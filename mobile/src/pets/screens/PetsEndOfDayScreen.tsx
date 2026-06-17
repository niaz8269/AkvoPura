/**
 * PetsEndOfDayScreen — reconciliation summary for the Pets salesman.
 */

import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BilingualButton, Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { usePetsSalesman } from '../state';
import { initialPetVanLoad } from '../demoData';

export function PetsEndOfDayScreen({ navigation }: any) {
  const { customers, bills, returns, vanLoad, currentTripNumber, resetDay } =
    usePetsSalesman();

  const totalCash = bills.reduce((s, b) => s + b.cashCollected, 0);
  const totalBilled = bills.reduce((s, b) => s + b.amountBilled, 0);
  const totalDiscount = bills.reduce((s, b) => s + (b.discount ?? 0), 0);
  const totalRefunds = returns.reduce((s, r) => s + r.refundAmount, 0);
  const sold600 = bills.reduce((s, b) => s + b.pet600Packs, 0);
  const sold1500 = bills.reduce((s, b) => s + b.pet1500Packs, 0);
  const ret600 = returns.reduce((s, r) => s + r.pet600Packs, 0);
  const ret1500 = returns.reduce((s, r) => s + r.pet1500Packs, 0);

  // Per-customer breakdown
  const perCustomer = customers
    .map((c) => {
      const bs = bills.filter((b) => b.customerId === c.id);
      const rs = returns.filter((r) => r.customerId === c.id);
      if (bs.length === 0 && rs.length === 0) return null;
      return {
        id: c.id,
        name: c.name,
        billed: bs.reduce((s, b) => s + b.amountBilled, 0),
        cash: bs.reduce((s, b) => s + b.cashCollected, 0),
        refund: rs.reduce((s, r) => s + r.refundAmount, 0),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const submit = () => {
    Alert.alert(
      'Submit closure',
      `Closure ready to send to manager.\n\nCash: Rs ${totalCash.toLocaleString()}\nSold: ${sold600} × 600ml, ${sold1500} × 1.5L\nReturns: ${ret600} × 600ml, ${ret1500} × 1.5L\nRefund credits: Rs ${totalRefunds.toLocaleString()}\n\n(Real submission goes to the backend in a later slice.)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset day (demo)',
          style: 'destructive',
          onPress: () => resetDay(),
        },
      ]
    );
  };

  return (
    <Screen scroll>
      <Text style={styles.title}>End of Day</Text>

      <View style={styles.cashCard}>
        <Text style={styles.cashLabel}>Cash collected today</Text>
        <Text style={styles.cashValue}>Rs {totalCash.toLocaleString()}</Text>
        {totalBilled !== totalCash ? (
          <Text style={styles.cashDelta}>
            Billed Rs {totalBilled.toLocaleString()} • Credit Rs{' '}
            {(totalBilled - totalCash).toLocaleString()}
          </Text>
        ) : null}
      </View>

      <View style={styles.statRow}>
        <BigStat label="600 ml packs sold" value={sold600} />
        <BigStat label="1.5 L packs sold" value={sold1500} />
      </View>

      <View style={styles.statRow}>
        <BigStat label="600 ml packs returned" value={ret600} variant="warn" />
        <BigStat label="1.5 L packs returned" value={ret1500} variant="warn" />
      </View>

      <Section title={`Per-trip breakdown (${currentTripNumber} trip${currentTripNumber === 1 ? '' : 's'} today)`} subtitle="   ">
        {Array.from({ length: currentTripNumber }, (_, i) => {
          const tripNum = i + 1;
          const tripBills = bills.filter((b) => b.tripNumber === tripNum);
          const tripReturns = returns.filter((r) => r.tripNumber === tripNum);
          const tCash = tripBills.reduce((s, b) => s + b.cashCollected, 0);
          const t600 = tripBills.reduce((s, b) => s + b.pet600Packs, 0);
          const t1500 = tripBills.reduce((s, b) => s + b.pet1500Packs, 0);
          const tRet600 = tripReturns.reduce((s, r) => s + r.pet600Packs, 0);
          const tRet1500 = tripReturns.reduce((s, r) => s + r.pet1500Packs, 0);
          return (
            <Row
              key={tripNum}
              label={`Trip #${tripNum}`}
              value={
                tripBills.length === 0 && tripReturns.length === 0
                  ? '—'
                  : `${t600}×600ml ${t1500}×1.5L · returns ${tRet600}+${tRet1500} · Rs ${tCash.toLocaleString()}`
              }
            />
          );
        })}
      </Section>

      <Section title="Van reconciliation" subtitle="  ">
        <Row
          label="600 ml packs loaded → returning"
          value={`${initialPetVanLoad.pet600Packs} → ${vanLoad.pet600Packs}`}
        />
        <Row
          label="1.5 L packs loaded → returning"
          value={`${initialPetVanLoad.pet1500Packs} → ${vanLoad.pet1500Packs}`}
        />
        <Row label="Refund credits issued" value={`Rs ${totalRefunds.toLocaleString()}`} />
        <Row
          label="Discount given today"
          value={
            totalDiscount > 0 ? `−Rs ${totalDiscount.toLocaleString()}` : '—'
          }
        />
      </Section>

      <Section title="Per-customer breakdown" subtitle="   ">
        {perCustomer.length === 0 ? (
          <Text style={styles.empty}>No bills or returns today.</Text>
        ) : (
          perCustomer.map((p) => (
            <View key={p.id} style={styles.custRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.custName} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={styles.custSub}>
                  Rs {p.cash.toLocaleString()}/{p.billed.toLocaleString()}
                  {p.refund > 0 ? ` • refund Rs ${p.refund.toLocaleString()}` : ''}
                </Text>
              </View>
              {p.cash < p.billed ? (
                <View style={styles.creditChip}>
                  <Text style={styles.creditChipText}>Credit</Text>
                </View>
              ) : null}
            </View>
          ))
        )}
      </Section>

      <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
        <BilingualButton
          label={{ en: 'Submit closure to manager' }}
          onPress={submit}
          disabled={bills.length === 0 && returns.length === 0}
        />
        <BilingualButton
          label={{ en: 'Add field expense' }}
          variant="secondary"
          onPress={() =>
            navigation.getParent()?.navigate('SubmitExpense') ??
            navigation.navigate('SubmitExpense')
          }
        />
      </View>
    </Screen>
  );
}

function BigStat({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant?: 'warn';
}) {
  return (
    <View style={[styles.bigStat, variant === 'warn' ? styles.bigStatWarn : null]}>
      <Text style={[styles.bigStatValue, variant === 'warn' ? styles.bigStatWarnText : null]}>
        {value}
      </Text>
      <Text style={styles.bigStatLabel}>{label}</Text>
    </View>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={{ marginBottom: spacing.sm }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reconRow}>
      <Text style={styles.reconLabel}>{label}</Text>
      <Text style={styles.reconValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSizes.heading, fontWeight: '800', color: colors.primaryDark },
  cashCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  cashLabel: { color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.body, fontWeight: '600' },
  cashValue: {
    color: colors.textInverse,
    fontSize: fontSizes.display,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  cashDelta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fontSizes.sm,
    marginTop: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  bigStat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  bigStatWarn: { backgroundColor: colors.warning + '15' },
  bigStatValue: {
    fontSize: fontSizes.heading,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  bigStatWarnText: { color: colors.warning },
  bigStatLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  section: { marginTop: spacing.lg },
  sectionTitle: { fontSize: fontSizes.body, fontWeight: '800', color: colors.primaryDark },
  sectionSubtitle: { fontSize: fontSizes.xs, color: colors.textMuted },
  sectionBody: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  reconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reconLabel: { fontSize: fontSizes.sm, color: colors.text, flex: 1 },
  reconValue: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  custRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  custName: { fontSize: fontSizes.body, fontWeight: '700', color: colors.text },
  custSub: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  creditChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.warning + '22',
  },
  creditChipText: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: colors.warning,
  },
  empty: {
    fontStyle: 'italic',
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    paddingVertical: spacing.sm,
  },
});
