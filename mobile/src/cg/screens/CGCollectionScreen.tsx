/**
 * CGCollectionScreen — separate sheet for picking up empty containers.
 *
 * Per spec: empties are often picked up on a different visit than the delivery,
 * so this is its own screen. Auto-filters customers who are currently holding
 * empties (others are hidden — nothing to collect).
 *
 * Each row: customer + +/- counters for cans/gallons + swipe-to-confirm.
 * Top of screen shows running totals collected today.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '../../components';
import { QuantityStepper } from '../../components/QuantityStepper';
import { SwipeToConfirm } from '../../components/SwipeToConfirm';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useCGSalesman } from '../state';
import { CycleFilter, type CycleFilterValue } from '../components/CycleFilter';
import type { CGCustomer } from '../types';

const canIcon = require('../../../assets/brand/14ltr-can.webp');
const gallonIcon = require('../../../assets/brand/19ltr-gallon.webp');

export function CGCollectionScreen() {
  const {
    customers,
    collections,
    recordCollection,
    undoLastCollection,
    vanLoad,
  } = useCGSalesman();

  const [cycle, setCycle] = useState<CycleFilterValue>('all');

  // Now that collection also captures payment, show customers who EITHER
  // hold empties to return OR have outstanding debt to settle.
  const customersToVisit = useMemo(
    () =>
      customers.filter(
        (c) => c.emptyCansHeld + c.emptyGallonsHeld > 0 || c.outstandingDebt > 0,
      ),
    [customers],
  );

  const visibleEmpties = useMemo(
    () =>
      cycle === 'all'
        ? customersToVisit
        : customersToVisit.filter((c) => c.paymentCycle === cycle),
    [customersToVisit, cycle]
  );

  const countByCycle = useMemo(
    () => ({
      all: customersToVisit.length,
      daily: customersToVisit.filter((c) => c.paymentCycle === 'daily').length,
      weekly: customersToVisit.filter((c) => c.paymentCycle === 'weekly').length,
    }),
    [customersToVisit]
  );

  const totalCansCollected = collections.reduce((s, c) => s + c.cansCollected, 0);
  const totalGallonsCollected = collections.reduce((s, c) => s + c.gallonsCollected, 0);
  const totalCashCollected = collections.reduce(
    (s, c) => s + c.cashCollected + c.bankCollected,
    0,
  );

  return (
    <Screen padded={false}>
      <View style={styles.headerBar}>
        <View style={styles.headerStatRow}>
          <Text style={styles.headerStatLead}>Today:</Text>
          <Text style={styles.headerStatVal}>{totalCansCollected}</Text>
          <Image source={canIcon} style={styles.headerIcon} resizeMode="contain" />
          <Text style={styles.headerStatSep}>·</Text>
          <Text style={styles.headerStatVal}>{totalGallonsCollected}</Text>
          <Image source={gallonIcon} style={styles.headerIcon} resizeMode="contain" />
          {totalCashCollected > 0 ? (
            <Text style={styles.headerStatMoney}>· Rs {totalCashCollected.toLocaleString()}</Text>
          ) : null}
        </View>
        <View style={styles.headerStatRow}>
          <Text style={styles.headerStatMuted}>On van:</Text>
          <Text style={styles.headerStatMutedVal}>{vanLoad.emptyCansAboard}</Text>
          <Image source={canIcon} style={styles.headerIconSm} resizeMode="contain" />
          <Text style={styles.headerStatMuted}>·</Text>
          <Text style={styles.headerStatMutedVal}>{vanLoad.emptyGallonsAboard}</Text>
          <Image source={gallonIcon} style={styles.headerIconSm} resizeMode="contain" />
        </View>
        {collections.length > 0 ? (
          <Pressable
            onPress={() => {
              const last = undoLastCollection();
              if (last) Alert.alert('Undone', 'Last collection was undone.');
            }}
            style={({ pressed }) => [
              styles.undoBtn,
              pressed ? styles.undoBtnPressed : null,
            ]}
          >
            <Text style={styles.undoText}>↶ Undo</Text>
          </Pressable>
        ) : null}
      </View>

      <CycleFilter selected={cycle} onSelect={setCycle} counts={countByCycle} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
        {visibleEmpties.length === 0 ? (
          <Text style={styles.empty}>
            {customersToVisit.length === 0
              ? 'Nothing to collect — no empties or debts outstanding.'
              : `No ${cycle} customers with empties or debt.`}
          </Text>
        ) : (
          visibleEmpties.map((c) => (
            <CollectionRow
              key={c.id}
              customer={c}
              onRecord={(input) =>
                recordCollection({
                  customerId: c.id,
                  cansCollected: input.cans,
                  gallonsCollected: input.gallons,
                  cashCollected: input.cash,
                  bankCollected: input.bank,
                  paymentReference: input.ref,
                })
              }
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

type CollectionPayload = {
  cans: number;
  gallons: number;
  cash: number;
  bank: number;
  ref?: string;
};

function CollectionRow({
  customer,
  onRecord,
}: {
  customer: CGCustomer;
  onRecord: (input: CollectionPayload) => void;
}) {
  // Both cans + gallons default to 0. Salesman MUST actively bump them
  // up as they physically pick up empties — auto-defaulting to "all held"
  // would wrongly clear the customer's empties record on a cash-only swipe.
  const [cans, setCans] = useState(0);
  const [gallons, setGallons] = useState(0);
  const [cashStr, setCashStr] = useState<string | null>(null);
  const [bankStr, setBankStr] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Auto-reset after a successful confirmation — back to all-zero so the
  // next visit starts fresh.
  useEffect(() => {
    if (!confirmed) return;
    const t = setTimeout(() => {
      setConfirmed(false);
      setCans(0);
      setGallons(0);
      setCashStr(null);
      setBankStr('');
      setPaymentRef('');
      setResetKey((k) => k + 1);
    }, 1400);
    return () => clearTimeout(t);
  }, [confirmed]);

  const debt = customer.outstandingDebt;
  // Both cash + bank default to 0. Salesman MUST type any amount they
  // actually received — otherwise an accidental empties-only swipe could
  // wrongly mark the debt as settled.
  const cashAmt = useMemo(() => {
    const n = Number(cashStr ?? '') || 0;
    return Math.max(0, Math.min(debt, n));
  }, [cashStr, debt]);
  const bankAmt = useMemo(() => {
    const n = Number(bankStr) || 0;
    return Math.max(0, Math.min(debt - cashAmt, n));
  }, [bankStr, debt, cashAmt]);
  const remainingDebt = Math.max(0, debt - cashAmt - bankAmt);

  const canSwipe = cans + gallons + cashAmt + bankAmt > 0;

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowName} numberOfLines={1}>
          {customer.name}
        </Text>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusPill,
              customer.emptyCansHeld + customer.emptyGallonsHeld > 0
                ? styles.statusPillWarn
                : styles.statusPillOk,
            ]}
          >
            <Text
              style={[
                styles.statusPillLabel,
                customer.emptyCansHeld + customer.emptyGallonsHeld > 0
                  ? styles.statusPillLabelWarn
                  : styles.statusPillLabelOk,
              ]}
            >
              CUSTOMER IS HOLDING
            </Text>
            <View style={styles.statusPillIconRow}>
              <Text
                style={[
                  styles.statusPillValue,
                  customer.emptyCansHeld + customer.emptyGallonsHeld > 0
                    ? styles.statusPillValueWarn
                    : styles.statusPillValueOk,
                ]}
              >
                {customer.emptyCansHeld}
              </Text>
              <Image
                source={canIcon}
                style={styles.statusPillImg}
                resizeMode="contain"
              />
              <Text
                style={[
                  styles.statusPillValue,
                  customer.emptyCansHeld + customer.emptyGallonsHeld > 0
                    ? styles.statusPillValueWarn
                    : styles.statusPillValueOk,
                ]}
              >
                {' · '}{customer.emptyGallonsHeld}
              </Text>
              <Image
                source={gallonIcon}
                style={styles.statusPillImg}
                resizeMode="contain"
              />
            </View>
          </View>
          <View
            style={[
              styles.statusPill,
              debt > 0 ? styles.statusPillDanger : styles.statusPillOk,
            ]}
          >
            <Text
              style={[
                styles.statusPillLabel,
                debt > 0 ? styles.statusPillLabelDanger : styles.statusPillLabelOk,
              ]}
            >
              CUSTOMER OWES
            </Text>
            <Text
              style={[
                styles.statusPillValue,
                debt > 0 ? styles.statusPillValueDanger : styles.statusPillValueOk,
              ]}
            >
              Rs {debt.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      <QuantityStepper
        label="Cans collected"
        labelUr="کین جمع کیے"
        value={cans}
        onChange={setCans}
        max={customer.emptyCansHeld}
        icon={canIcon}
      />
      <QuantityStepper
        label="Gallons collected"
        labelUr="گیلن جمع کیے"
        value={gallons}
        onChange={setGallons}
        max={customer.emptyGallonsHeld}
        icon={gallonIcon}
      />

      {debt > 0 ? (
        <View style={styles.paymentBox}>
          <View style={styles.payRow}>
            <Text style={styles.payLabel}>Cash</Text>
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
            <Text style={styles.payLabel}>Bank</Text>
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
            <Text style={styles.creditLabel}>Remaining debt</Text>
            <Text
              style={[
                styles.creditValue,
                remainingDebt > 0 ? styles.creditValueDanger : null,
              ]}
            >
              Rs {remainingDebt.toLocaleString()}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.swipeWrap}>
        <SwipeToConfirm
          key={resetKey}
          labelEn="Swipe to record  ›››"
          labelUr="ریکارڈ کرنے کے لیے سوائپ کریں"
          doneLabelEn="Recorded ✓"
          doneLabelUr="ریکارڈ ہو گیا"
          done={confirmed}
          disabled={!canSwipe}
          onConfirm={() => {
            onRecord({
              cans,
              gallons,
              cash: cashAmt,
              bank: bankAmt,
              ref: paymentRef.trim() || undefined,
            });
            setConfirmed(true);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 32,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  headerStat: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  headerStatRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerStatLead: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  headerStatVal: { color: colors.primaryDark, fontWeight: '800', fontSize: 13 },
  headerStatSep: { color: colors.textMuted, fontSize: 12 },
  headerStatMuted: { fontSize: 11, color: colors.textMuted },
  headerStatMutedVal: { fontSize: 12, color: colors.primaryDark, fontWeight: '700' },
  headerIcon: { width: 14, height: 14 },
  headerIconSm: { width: 12, height: 12 },
  undoBtn: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  undoBtnPressed: { backgroundColor: colors.warning + '33' },
  undoText: { fontSize: 12, fontWeight: '700', color: colors.warning },
  scroll: { flex: 1 },
  list: { paddingHorizontal: spacing.lg, paddingTop: 4, paddingBottom: spacing.sm },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  rowHeader: { marginBottom: spacing.sm },
  rowName: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statusPill: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  statusPillOk: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  statusPillWarn: {
    backgroundColor: colors.warning + '14',
    borderColor: colors.warning,
  },
  statusPillDanger: {
    backgroundColor: colors.danger + '14',
    borderColor: colors.danger,
  },
  statusPillLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statusPillLabelOk: { color: colors.textMuted },
  statusPillLabelWarn: { color: colors.warning },
  statusPillLabelDanger: { color: colors.danger },
  statusPillValue: {
    fontSize: fontSizes.body,
    fontWeight: '900',
    marginTop: 2,
  },
  statusPillValueOk: { color: colors.textMuted },
  statusPillValueWarn: { color: colors.warning },
  statusPillValueDanger: { color: colors.danger },
  statusPillIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusPillImg: { width: 18, height: 18 },

  paymentBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  payLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  payInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    minHeight: 36,
  },
  payCurrency: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
  },
  payInput: {
    flex: 1,
    paddingVertical: 4,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.primaryDark,
    textAlign: 'right',
  },
  refInput: {
    marginTop: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    fontSize: fontSizes.sm,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  creditLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  creditValue: {
    fontSize: fontSizes.body,
    fontWeight: '900',
    color: colors.success,
  },
  creditValueDanger: { color: colors.danger },

  headerStatMoney: { color: colors.success, fontWeight: '900' },

  swipeWrap: { marginTop: spacing.md },
});
