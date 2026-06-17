/**
 * OrderFulfillmentScreen — salesman captures payment + empties at the
 * point of delivery, which the backend turns into actual delivery / bill
 * records. After this, the order moves to "delivered" and the customer's
 * debt + inventory are correctly updated.
 *
 * Cash + Bank fields default to 0 (safety: nothing is auto-counted).
 * Empty pickups (CG) and discount (Pets) only show for relevant items.
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

import { BilingualButton, Screen } from '../components';
import { QuantityStepper } from '../components/QuantityStepper';
import { colors, fontSizes, radii, spacing } from '../theme';
import { ApiError } from '../api/client';
import { fulfillOrderApi } from '../api/orders';
import { useCustomerPortal } from '../customer/state';
import type { CustomerOrder } from '../customer/types';

const PRODUCT_LABELS: Record<string, string> = {
  cans: 'Cans',
  gallons: 'Gallons',
  pet600: '600 ml packs',
  pet1500: '1.5 L packs',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function OrderFulfillmentScreen({ route, navigation }: any) {
  const orderId: string = route.params.orderId;
  const portal = useCustomerPortal();
  const order = portal.orders.find((o) => o.id === orderId);

  const [cashStr, setCashStr] = useState('');
  const [bankStr, setBankStr] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [emptyCans, setEmptyCans] = useState(0);
  const [emptyGallons, setEmptyGallons] = useState(0);
  const [discountStr, setDiscountStr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Derived helpers
  const items = order?.items ?? [];
  const cans = items.find((it) => it.productId === 'cans')?.qty ?? 0;
  const gallons = items.find((it) => it.productId === 'gallons')?.qty ?? 0;
  const pet600 = items.find((it) => it.productId === 'pet600')?.qty ?? 0;
  const pet1500 = items.find((it) => it.productId === 'pet1500')?.qty ?? 0;
  const hasCG = cans + gallons > 0;
  const hasPets = pet600 + pet1500 > 0;

  const totalDue = order?.totalAmount ?? 0;
  const cashAmt = useMemo(() => {
    const n = Number(cashStr) || 0;
    return Math.max(0, Math.min(totalDue, n));
  }, [cashStr, totalDue]);
  const bankAmt = useMemo(() => {
    const n = Number(bankStr) || 0;
    return Math.max(0, Math.min(totalDue - cashAmt, n));
  }, [bankStr, totalDue, cashAmt]);
  const discount = useMemo(() => {
    const n = Number(discountStr) || 0;
    return Math.max(0, Math.min(totalDue, n));
  }, [discountStr, totalDue]);
  const credit = Math.max(0, totalDue - cashAmt - bankAmt - discount);

  // Reset empties when items change
  useEffect(() => {
    setEmptyCans(0);
    setEmptyGallons(0);
  }, [orderId]);

  if (!order) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorText}>Order not loaded.</Text>
        </View>
      </Screen>
    );
  }

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fulfillOrderApi(orderId, {
        cashCollected: cashAmt,
        bankCollected: bankAmt,
        paymentReference: paymentRef.trim() || undefined,
        emptyCansCollected: hasCG ? emptyCans : undefined,
        emptyGallonsCollected: hasCG ? emptyGallons : undefined,
        discount: hasPets ? discount : undefined,
      });
      // Refresh provider state so the order disappears from "Active"
      // immediately + customer balances reflect the new bill.
      await portal.refreshOrders();
      Alert.alert(
        'Delivered',
        'Order recorded as delivered. Customer balance + inventory updated.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message || e.code : 'Unknown error';
      Alert.alert('Could not save', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {/* Order summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Order from</Text>
            <Text style={styles.summaryName}>
              {order.customerName ?? 'Customer'}
            </Text>
            {(order as CustomerOrder).preferredTime ? (
              <Text style={styles.summaryMeta}>
                ⏰ {(order as CustomerOrder).preferredTime}
              </Text>
            ) : null}
            {(order as CustomerOrder).notes ? (
              <Text style={styles.summaryMeta}>📝 {(order as CustomerOrder).notes}</Text>
            ) : null}

            <View style={styles.itemsBlock}>
              {order.items.map((it, i) => (
                <Text key={i} style={styles.itemLine}>
                  • {it.qty} × {PRODUCT_LABELS[it.productId] ?? it.productId}
                  {' @ Rs '}{it.unitPrice}
                  {' = Rs '}{(it.qty * it.unitPrice).toLocaleString()}
                </Text>
              ))}
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total due</Text>
              <Text style={styles.totalValue}>Rs {totalDue.toLocaleString()}</Text>
            </View>
          </View>

          {/* Empties (CG only) */}
          {hasCG ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Empties picked up</Text>
              <Text style={styles.cardHint}>
                Only count what the customer actually returned today.
              </Text>
              <View style={{ marginTop: spacing.sm }}>
                <QuantityStepper
                  label="Cans returned"
                  value={emptyCans}
                  onChange={setEmptyCans}
                  max={99}
                />
              </View>
              <View style={{ marginTop: spacing.sm }}>
                <QuantityStepper
                  label="Gallons returned"
                  value={emptyGallons}
                  onChange={setEmptyGallons}
                  max={99}
                />
              </View>
            </View>
          ) : null}

          {/* Discount (Pets only) */}
          {hasPets ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Discount (Pets)</Text>
              <View style={styles.payRow}>
                <Text style={styles.payLabel}>Discount</Text>
                <View style={styles.payInputWrap}>
                  <Text style={styles.payCurrency}>Rs</Text>
                  <TextInput
                    value={discountStr}
                    onChangeText={(t) => setDiscountStr(t.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    style={styles.payInput}
                    maxLength={6}
                  />
                </View>
              </View>
            </View>
          ) : null}

          {/* Payment */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment received</Text>
            <Text style={styles.cardHint}>
              Type only what you actually received. Anything left becomes
              credit on the customer's account.
            </Text>

            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Cash</Text>
              <View style={styles.payInputWrap}>
                <Text style={styles.payCurrency}>Rs</Text>
                <TextInput
                  value={cashStr}
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
              <Text style={styles.payLabel}>Bank / Easypaisa</Text>
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
              <TextInput
                value={paymentRef}
                onChangeText={setPaymentRef}
                placeholder="Reference / TXN id (optional)"
                placeholderTextColor={colors.textMuted}
                style={styles.refInput}
              />
            ) : null}

            <View style={styles.creditRow}>
              <Text style={styles.creditLabel}>On credit (debt)</Text>
              <Text
                style={[
                  styles.creditValue,
                  credit > 0 ? styles.creditValueDanger : null,
                ]}
              >
                Rs {credit.toLocaleString()}
              </Text>
            </View>
          </View>

          <BilingualButton
            label={{
              en: submitting ? 'Saving…' : 'Confirm delivery',
              ur: '  ',
            }}
            onPress={submit}
            disabled={submitting}
            style={{ marginTop: spacing.lg }}
          />

          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed ? { opacity: 0.7 } : null,
            ]}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.danger, fontSize: fontSizes.sm },

  body: { padding: spacing.lg, paddingBottom: spacing.xl },

  summary: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryLabel: { color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.xs, fontWeight: '700', textTransform: 'uppercase' },
  summaryName: { color: colors.textInverse, fontSize: fontSizes.title, fontWeight: '900', marginTop: 2 },
  summaryMeta: { color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.xs, marginTop: 4 },

  itemsBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  itemLine: { color: colors.textInverse, fontSize: fontSizes.sm, marginTop: 2 },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  totalLabel: { color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.sm, fontWeight: '700' },
  totalValue: { color: colors.textInverse, fontSize: fontSizes.heading, fontWeight: '900' },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: fontSizes.body, fontWeight: '800', color: colors.primaryDark },
  cardHint: { fontSize: fontSizes.xs, color: colors.textMuted, fontStyle: 'italic', marginTop: 2 },

  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  payLabel: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.text, flex: 1 },
  payInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    minWidth: 130,
  },
  payCurrency: { fontSize: fontSizes.xs, fontWeight: '800', color: colors.textMuted },
  payInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    textAlign: 'right',
  },
  refInput: {
    marginTop: spacing.sm,
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
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  creditLabel: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.text },
  creditValue: { fontSize: fontSizes.title, fontWeight: '900', color: colors.success },
  creditValueDanger: { color: colors.danger },

  cancelBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cancelBtnText: { color: colors.textMuted, fontSize: fontSizes.sm, fontWeight: '700' },
});
