/**
 * PetsSellScreen — generate a bill for a Pets customer.
 *
 * Single-screen flow (no wizard) so a salesman who's seen it 50 times can move
 * fast: pick customer → set quantities → toggle Paid/Credit → swipe to finalize.
 *
 * After confirm: shows a brief receipt summary, then resets so they can sell
 * to the next customer.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { QuantityStepper } from '../../components/QuantityStepper';
import { SwipeToConfirm } from '../../components/SwipeToConfirm';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { CustomerPicker } from '../components/CustomerPicker';
import { usePetsSalesman } from '../state';
import type { PetCustomer } from '../types';
import { generateAndShareBill, type BillItem } from '../../billing/pdf';
import { useAuth } from '../../auth/AuthContext';

export function PetsSellScreen() {
  const {
    customers,
    vanLoad,
    bills,
    priceFor,
    recordBill,
    undoLastBill,
  } = usePetsSalesman();
  const { user } = useAuth();

  const [selected, setSelected] = useState<PetCustomer | null>(null);
  const [pet600, setPet600] = useState(0);
  const [pet1500, setPet1500] = useState(0);
  // Bill-time price overrides (string so the TextInput can hold partial values
  // like an empty string mid-edit). null means "use customer/default price".
  const [price600, setPrice600] = useState<string | null>(null);
  const [price1500, setPrice1500] = useState<string | null>(null);
  const [discountStr, setDiscountStr] = useState('');
  // Payment method state. Cash defaults to the full bill (current behaviour);
  // bank covers digital payments (Easypaisa / JazzCash / IBFT). Anything not
  // covered by either becomes credit on the customer's account.
  const [cashStr, setCashStr] = useState<string | null>(null);
  const [bankStr, setBankStr] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<{
    billId: string;
    customer: PetCustomer;
    pet600: number;
    pet1500: number;
    unit600: number;
    unit1500: number;
    subtotal: number;
    discount: number;
    amount: number;
    cash: number;
  } | null>(null);

  // Effective unit prices used for the bill = override (if a valid number) else
  // the customer/default price from priceFor.
  const effective600 = useMemo(() => {
    if (!selected) return 0;
    if (price600 !== null) {
      const n = Number(price600);
      if (!Number.isNaN(n) && n >= 0) return n;
    }
    return priceFor(selected, 'pet600');
  }, [selected, price600, priceFor]);

  const effective1500 = useMemo(() => {
    if (!selected) return 0;
    if (price1500 !== null) {
      const n = Number(price1500);
      if (!Number.isNaN(n) && n >= 0) return n;
    }
    return priceFor(selected, 'pet1500');
  }, [selected, price1500, priceFor]);

  const subtotal = useMemo(
    () => pet600 * effective600 + pet1500 * effective1500,
    [pet600, pet1500, effective600, effective1500]
  );
  const discount = useMemo(() => {
    const n = Number(discountStr) || 0;
    return Math.max(0, Math.min(subtotal, n));
  }, [discountStr, subtotal]);
  const billed = subtotal - discount;

  // Both cash + bank default to 0. Salesman MUST type any amount they
  // actually received — auto-defaulting to "paid in full" risks marking a
  // credit sale as paid if the salesman swipes without checking.
  const cashAmt = useMemo(() => {
    const n = Number(cashStr ?? '') || 0;
    return Math.max(0, Math.min(billed, n));
  }, [cashStr, billed]);
  const bankAmt = useMemo(() => {
    const n = Number(bankStr) || 0;
    return Math.max(0, Math.min(billed - cashAmt, n));
  }, [bankStr, billed, cashAmt]);
  const creditAmt = Math.max(0, billed - cashAmt - bankAmt);

  const canSwipe = !!selected && pet600 + pet1500 > 0 && !confirmed;

  useEffect(() => {
    if (!confirmed) return;
    // Longer auto-reset window so the user has time to tap Share PDF.
    const t = setTimeout(() => {
      setConfirmed(false);
      setSelected(null);
      setPet600(0);
      setPet1500(0);
      setPrice600(null);
      setPrice1500(null);
      setDiscountStr('');
      setCashStr(null);
      setBankStr('');
      setPaymentRef('');
      setLastReceipt(null);
      setResetKey((k) => k + 1);
    }, 7000);
    return () => clearTimeout(t);
  }, [confirmed]);

  const onConfirm = () => {
    if (!selected) return;
    // Cash + bank can be split arbitrarily; whatever isn't covered by
    // either becomes credit on the customer's account.
    const entry = recordBill({
      customerId: selected.id,
      pet600Packs: pet600,
      pet1500Packs: pet1500,
      cashCollected: cashAmt,
      bankCollected: bankAmt,
      paymentReference: paymentRef.trim() || undefined,
      pricePet600: effective600,
      pricePet1500: effective1500,
      discount,
    });
    if (entry) {
      setLastReceipt({
        billId: entry.id,
        customer: selected,
        pet600,
        pet1500,
        unit600: effective600,
        unit1500: effective1500,
        subtotal,
        discount,
        amount: billed,
        cash: cashAmt + bankAmt, // legacy field — total paid for receipt math
      });
      setConfirmed(true);
    }
  };

  const onShareBill = async () => {
    if (!lastReceipt) return;
    setSharing(true);
    try {
      const items: BillItem[] = [];
      if (lastReceipt.pet600 > 0) {
        items.push({
          name: '600 ml pack',
          qty: lastReceipt.pet600,
          unitPrice: lastReceipt.unit600,
        });
      }
      if (lastReceipt.pet1500 > 0) {
        items.push({
          name: '1.5 L pack',
          qty: lastReceipt.pet1500,
          unitPrice: lastReceipt.unit1500,
        });
      }
      const ok = await generateAndShareBill({
        billNumber: lastReceipt.billId.slice(-6).toUpperCase(),
        dateTime: Date.now(),
        customerName: lastReceipt.customer.name,
        customerAddress: lastReceipt.customer.address,
        customerPhone: lastReceipt.customer.phone,
        branchName: user?.branch === 'shergarh' ? 'Shergarh' : 'Timergara',
        salesmanName: user?.name,
        items,
        discount: lastReceipt.discount,
        paid: lastReceipt.cash,
        credit: lastReceipt.amount - lastReceipt.cash,
      });
      if (!ok) {
        Alert.alert('Sharing unavailable', 'This device does not support sharing files.');
      }
    } catch (err) {
      Alert.alert('Could not generate PDF', String(err));
    } finally {
      setSharing(false);
    }
  };

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Sell</Text>
              <Text style={styles.titleUr}>فروخت</Text>
            </View>
            <View style={styles.vanChip}>
              <Text style={styles.vanChipLabel}>On van</Text>
              <Text style={styles.vanChipValue}>
                {vanLoad.pet600Packs} × 600ml • {vanLoad.pet1500Packs} × 1.5L
              </Text>
            </View>
          </View>

          {bills.length > 0 ? (
            <Pressable
              onPress={() => {
                const last = undoLastBill();
                if (last) Alert.alert('Undone', 'Last bill was undone.');
              }}
              style={({ pressed }) => [
                styles.undoBtn,
                pressed ? styles.undoBtnPressed : null,
              ]}
            >
              <Text style={styles.undoText}>↶ Undo last bill</Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <CustomerPicker
            customers={customers}
            selected={selected}
            onSelect={(c) => {
              setSelected(c);
              setPet600(0);
              setPet1500(0);
              setPrice600(null);
              setPrice1500(null);
              setDiscountStr('');
              setLastReceipt(null);
            }}
          />

          {selected ? (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Quantities</Text>

              <QuantityStepper
                label="600 ml packs"
                labelUr="۶۰۰ ملی پیک"
                value={pet600}
                onChange={setPet600}
                max={vanLoad.pet600Packs}
              />
              <PriceEditor
                label="Price per 600 ml pack"
                defaultPrice={priceFor(selected, 'pet600')}
                value={price600}
                onChange={setPrice600}
                lineQty={pet600}
                lineTotal={effective600 * pet600}
              />

              <View style={styles.divider} />

              <QuantityStepper
                label="1.5 L packs"
                labelUr="۱.۵ لیٹر پیک"
                value={pet1500}
                onChange={setPet1500}
                max={vanLoad.pet1500Packs}
              />
              <PriceEditor
                label="Price per 1.5 L pack"
                defaultPrice={priceFor(selected, 'pet1500')}
                value={price1500}
                onChange={setPrice1500}
                lineQty={pet1500}
                lineTotal={effective1500 * pet1500}
              />


              <View style={styles.discountRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.discountLabel}>Discount (Rs)</Text>
                  <Text style={styles.discountLabelUr}>چھوٹ</Text>
                </View>
                <View style={styles.discountInputWrap}>
                  <Text style={styles.discountMinus}>−</Text>
                  <TextInput
                    value={discountStr}
                    onChangeText={(t) => setDiscountStr(t.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    style={styles.discountInput}
                    maxLength={6}
                  />
                </View>
              </View>

              <View style={styles.totalCard}>
                {discount > 0 ? (
                  <Text style={styles.subtotalLine}>
                    Subtotal Rs {subtotal.toLocaleString()} · Discount −Rs{' '}
                    {discount.toLocaleString()}
                  </Text>
                ) : null}
                <Text style={styles.totalLabel}>Total bill</Text>
                <Text style={styles.totalLabelUr}>کل بل</Text>
                <Text style={styles.totalValue}>Rs {billed.toLocaleString()}</Text>
              </View>

              <View style={styles.paymentCard}>
                <Text style={styles.paymentTitle}>Payment</Text>
                <Text style={styles.paymentTitleUr}>ادائیگی</Text>

                <View style={styles.payRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payLabel}>Cash</Text>
                    <Text style={styles.payLabelUr}>نقد</Text>
                  </View>
                  <View style={styles.payInputWrap}>
                    <Text style={styles.payCurrency}>Rs</Text>
                    <TextInput
                      value={cashStr ?? ''}
                      onChangeText={(t) => setCashStr(t.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      style={styles.payInput}
                      maxLength={7}
                    />
                  </View>
                </View>

                <View style={styles.payRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payLabel}>Bank / Easypaisa</Text>
                    <Text style={styles.payLabelUr}>بینک / ایزی پیسہ</Text>
                  </View>
                  <View style={styles.payInputWrap}>
                    <Text style={styles.payCurrency}>Rs</Text>
                    <TextInput
                      value={bankStr}
                      onChangeText={(t) => setBankStr(t.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      style={styles.payInput}
                      maxLength={7}
                    />
                  </View>
                </View>

                {bankAmt > 0 ? (
                  <View style={styles.refRow}>
                    <Text style={styles.refLabel}>Reference / TXN ID</Text>
                    <TextInput
                      value={paymentRef}
                      onChangeText={setPaymentRef}
                      placeholder="e.g. EP12345 or sender name"
                      placeholderTextColor={colors.textMuted}
                      style={styles.refInput}
                    />
                  </View>
                ) : null}

                <View style={styles.creditRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.creditLabel}>On credit (debt)</Text>
                    <Text style={styles.creditLabelUr}>قرض</Text>
                  </View>
                  <Text
                    style={[
                      styles.creditValue,
                      creditAmt > 0 ? styles.creditValueDanger : null,
                    ]}
                  >
                    Rs {creditAmt.toLocaleString()}
                  </Text>
                </View>
              </View>

              <SwipeToConfirm
                key={resetKey}
                labelEn="Swipe to finalize bill  ›››"
                labelUr="بل کو حتمی شکل دیں"
                doneLabelEn="Bill saved ✓"
                doneLabelUr="بل محفوظ ہو گیا"
                done={confirmed}
                disabled={!canSwipe}
                onConfirm={onConfirm}
                style={styles.swipe}
              />
            </View>
          ) : null}

          {confirmed && lastReceipt ? (
            <View style={styles.receiptCard}>
              <Text style={styles.receiptTitle}>✓ Bill saved</Text>
              <Text style={styles.receiptCustomer}>{lastReceipt.customer.name}</Text>
              <Text style={styles.receiptLine}>
                {lastReceipt.pet600} × 600ml + {lastReceipt.pet1500} × 1.5L
              </Text>
              <Text style={styles.receiptAmount}>
                Rs {lastReceipt.amount.toLocaleString()}{' '}
                {lastReceipt.cash < lastReceipt.amount ? '(on credit)' : '(paid)'}
              </Text>

              <Pressable
                onPress={onShareBill}
                disabled={sharing}
                style={({ pressed }) => [
                  styles.shareBtn,
                  pressed ? { opacity: 0.85 } : null,
                  sharing ? { opacity: 0.6 } : null,
                ]}
              >
                <Ionicons name="share-social" size={20} color={colors.textInverse} />
                <Text style={styles.shareBtnText}>
                  {sharing ? 'Generating PDF…' : 'Share bill (PDF / WhatsApp)'}
                </Text>
              </Pressable>

              <Text style={styles.receiptHint}>This screen resets in a few seconds…</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function PriceEditor({
  label,
  defaultPrice,
  value,
  onChange,
  lineQty,
  lineTotal,
}: {
  label: string;
  defaultPrice: number;
  value: string | null;
  onChange: (v: string | null) => void;
  lineQty: number;
  lineTotal: number;
}) {
  const isOverridden = value !== null && Number(value) !== defaultPrice;

  return (
    <View style={styles.priceEditor}>
      <View style={styles.priceEditorRow}>
        <Text style={styles.priceEditorLabel}>{label}</Text>
        {isOverridden ? (
          <Pressable
            onPress={() => onChange(null)}
            style={({ pressed }) => [
              styles.priceResetBtn,
              pressed ? { opacity: 0.7 } : null,
            ]}
          >
            <Ionicons name="refresh-outline" size={12} color={colors.textMuted} />
            <Text style={styles.priceResetText}>Reset to Rs {defaultPrice}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.priceInputRow}>
        <Text style={styles.priceCurrency}>Rs</Text>
        <TextInput
          value={value ?? String(defaultPrice)}
          onChangeText={(t) => {
            // Only digits allowed
            const cleaned = t.replace(/[^0-9]/g, '');
            onChange(cleaned === '' ? '' : cleaned);
          }}
          keyboardType="number-pad"
          style={styles.priceInput}
          maxLength={5}
        />
        <Text style={styles.priceTimes}>× {lineQty} =</Text>
        <Text style={styles.priceLineTotal}>Rs {lineTotal.toLocaleString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },
  titleUr: { fontSize: fontSizes.body, color: colors.primary },
  vanChip: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  vanChipLabel: { fontSize: fontSizes.xs, color: colors.textMuted },
  vanChipValue: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  undoBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  undoBtnPressed: { backgroundColor: colors.warning + '33' },
  undoText: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.warning },
  scroll: { flex: 1 },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  formTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },
  priceLine: {
    paddingHorizontal: spacing.sm,
    paddingTop: 4,
  },
  priceLineText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  priceLineBold: { color: colors.primaryDark, fontWeight: '800' },
  priceEditor: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  priceEditorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  priceEditorLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.textMuted,
  },
  priceResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  priceResetText: { fontSize: 10, color: colors.textMuted, fontWeight: '700' },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  priceCurrency: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.textMuted,
  },
  priceInput: {
    width: 80,
    height: 40,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  priceTimes: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    fontWeight: '700',
  },
  priceLineTotal: {
    flex: 1,
    textAlign: 'right',
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '10',
    borderWidth: 1.5,
    borderColor: colors.warning,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  discountLabel: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.warning },
  discountLabelUr: { fontSize: fontSizes.xs, color: colors.warning },
  discountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.warning,
    paddingHorizontal: spacing.sm,
    height: 40,
    minWidth: 110,
  },
  discountMinus: { fontSize: 20, fontWeight: '900', color: colors.warning, lineHeight: 22 },
  discountInput: {
    flex: 1,
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.warning,
    textAlign: 'right',
  },
  subtotalLine: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fontSizes.xs,
    marginBottom: spacing.xs,
  },
  totalCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  totalLabel: { color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.body, fontWeight: '600' },
  totalLabelUr: { color: 'rgba(255,255,255,0.7)', fontSize: fontSizes.xs },
  totalValue: {
    color: colors.textInverse,
    fontSize: fontSizes.heading,
    fontWeight: '900',
    marginTop: 4,
  },
  paidToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
  },
  paidToggleOn: {
    backgroundColor: colors.success + '15',
    borderColor: colors.success,
  },
  paidToggleOff: {
    backgroundColor: colors.warning + '15',
    borderColor: colors.warning,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: { backgroundColor: colors.success, borderColor: colors.success },
  checkMark: { color: colors.textInverse, fontWeight: '900', fontSize: 16 },
  paidLabel: { fontSize: fontSizes.body, fontWeight: '700', color: colors.text },
  paidLabelUr: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 1 },
  swipe: { marginTop: spacing.sm },

  paymentCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  paymentTitleUr: {
    fontSize: fontSizes.xs,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  payLabel: { fontSize: fontSizes.body, fontWeight: '700', color: colors.text },
  payLabelUr: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 1 },
  payInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    minWidth: 110,
  },
  payCurrency: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: colors.textMuted,
  },
  payInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    textAlign: 'right',
  },
  refRow: { marginTop: spacing.sm },
  refLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  refInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: fontSizes.sm,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  creditLabel: { fontSize: fontSizes.body, fontWeight: '700', color: colors.text },
  creditLabelUr: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 1 },
  creditValue: {
    fontSize: fontSizes.title,
    fontWeight: '900',
    color: colors.success,
  },
  creditValueDanger: { color: colors.danger },
  receiptCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.statusGreen + '22',
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.success,
    alignItems: 'center',
  },
  receiptTitle: {
    fontSize: fontSizes.title,
    fontWeight: '900',
    color: colors.success,
  },
  receiptCustomer: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xs,
  },
  receiptLine: {
    fontSize: fontSizes.sm,
    color: colors.text,
    marginTop: spacing.xs,
  },
  receiptAmount: {
    fontSize: fontSizes.title,
    fontWeight: '900',
    color: colors.primaryDark,
    marginTop: spacing.sm,
  },
  receiptHint: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
  shareBtnText: {
    color: colors.textInverse,
    fontSize: fontSizes.body,
    fontWeight: '800',
  },
});
