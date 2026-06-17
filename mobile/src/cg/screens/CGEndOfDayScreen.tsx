/**
 * CGEndOfDayScreen — reconciliation summary the salesman submits to manager.
 *
 * Per spec, end-of-day shows:
 *   - Cash collected (total + per-customer breakdown)
 *   - Filled cans/gallons delivered (totals)
 *   - Empty cans/gallons collected (totals)
 *   - Outstanding van load (what should be returned to depot)
 *   - "Submit closure" button (mock — real backend integration later)
 */

import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BilingualButton, Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useCGSalesman } from '../state';
import { initialVanLoad } from '../demoData';

const canIcon = require('../../../assets/brand/14ltr-can.webp');
const gallonIcon = require('../../../assets/brand/19ltr-gallon.webp');

export function CGEndOfDayScreen({ navigation }: any) {
  const { customers, deliveries, collections, vanLoad, currentTripNumber, resetDay } =
    useCGSalesman();

  const totalCansDelivered = deliveries.reduce((s, d) => s + d.cansDelivered, 0);
  const totalGallonsDelivered = deliveries.reduce((s, d) => s + d.gallonsDelivered, 0);
  const totalCash = deliveries.reduce((s, d) => s + d.cashCollected, 0);
  const totalBilled = deliveries.reduce((s, d) => s + d.amountBilled, 0);
  const totalCansCollected = collections.reduce((s, c) => s + c.cansCollected, 0);
  const totalGallonsCollected = collections.reduce((s, c) => s + c.gallonsCollected, 0);

  // Per-customer payment breakdown
  const perCustomer = customers
    .map((c) => {
      const ds = deliveries.filter((d) => d.customerId === c.id);
      if (ds.length === 0) return null;
      return {
        id: c.id,
        name: c.name,
        cans: ds.reduce((s, d) => s + d.cansDelivered, 0),
        gallons: ds.reduce((s, d) => s + d.gallonsDelivered, 0),
        billed: ds.reduce((s, d) => s + d.amountBilled, 0),
        cash: ds.reduce((s, d) => s + d.cashCollected, 0),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const outstandingFilledCans = vanLoad.filledCans;
  const outstandingFilledGallons = vanLoad.filledGallons;
  const expectedCansLoaded = initialVanLoad.filledCans;
  const expectedGallonsLoaded = initialVanLoad.filledGallons;

  const submit = () => {
    Alert.alert(
      'Submit closure',
      `Closure ready to send to manager.\n\nCash: Rs ${totalCash.toLocaleString()}\nDelivered: ${totalCansDelivered} cans, ${totalGallonsDelivered} gallons\nEmpties collected: ${totalCansCollected} cans, ${totalGallonsCollected} gallons\n\n(Real submission goes to the backend in a later slice.)`,
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
        <BigStat
          icon={canIcon}
          label="Cans delivered"
          value={totalCansDelivered}
        />
        <BigStat
          icon={gallonIcon}
          label="Gallons delivered"
          value={totalGallonsDelivered}
        />
      </View>

      <View style={styles.statRow}>
        <BigStat
          icon={canIcon}
          label="Empty cans collected"
          value={totalCansCollected}
        />
        <BigStat
          icon={gallonIcon}
          label="Empty gallons collected"
          value={totalGallonsCollected}
        />
      </View>

      <Section title={`Per-trip breakdown (${currentTripNumber} trip${currentTripNumber === 1 ? '' : 's'} today)`} subtitle="   ">
        {Array.from({ length: currentTripNumber }, (_, i) => {
          const tripNum = i + 1;
          const tripDeliveries = deliveries.filter((d) => d.tripNumber === tripNum);
          const tripCollections = collections.filter((c) => c.tripNumber === tripNum);
          const tCash = tripDeliveries.reduce((s, d) => s + d.cashCollected, 0);
          const tCans = tripDeliveries.reduce((s, d) => s + d.cansDelivered, 0);
          const tGallons = tripDeliveries.reduce((s, d) => s + d.gallonsDelivered, 0);
          const tEmpCans = tripCollections.reduce((s, c) => s + c.cansCollected, 0);
          const tEmpGallons = tripCollections.reduce((s, c) => s + c.gallonsCollected, 0);
          return (
            <ReconRow
              key={tripNum}
              label={`Trip #${tripNum}`}
              value={
                tripDeliveries.length === 0 && tripCollections.length === 0
                  ? '—'
                  : `${tCans}🥫 ${tGallons}💧 · empties ${tEmpCans}🥫 ${tEmpGallons}💧 · Rs ${tCash.toLocaleString()}`
              }
            />
          );
        })}
      </Section>

      <Section title="Van reconciliation" subtitle="  ">
        <ReconRow
          label="Filled cans loaded → returning"
          value={`${expectedCansLoaded} → ${outstandingFilledCans}`}
        />
        <ReconRow
          label="Filled gallons loaded → returning"
          value={`${expectedGallonsLoaded} → ${outstandingFilledGallons}`}
        />
        <ReconRow
          label="Empty cans returned to van"
          value={String(vanLoad.emptyCansAboard)}
        />
        <ReconRow
          label="Empty gallons returned to van"
          value={String(vanLoad.emptyGallonsAboard)}
        />
      </Section>

      <Section title="Per-customer breakdown" subtitle="   ">
        {perCustomer.length === 0 ? (
          <Text style={styles.empty}>No deliveries today.</Text>
        ) : (
          perCustomer.map((p) => (
            <View key={p.id} style={styles.custRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.custName} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={styles.custSub}>
                  {p.cans} cans • {p.gallons} gallons • Rs{' '}
                  {p.cash.toLocaleString()}/{p.billed.toLocaleString()}
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
          disabled={deliveries.length === 0 && collections.length === 0}
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
  icon,
  label,
  value,
}: {
  icon: ReturnType<typeof require>;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.bigStat}>
      <Image source={icon} style={styles.bigStatIcon} resizeMode="contain" />
      <Text style={styles.bigStatValue}>{value}</Text>
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

function ReconRow({ label, value }: { label: string; value: string }) {
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
  bigStatIcon: { width: 36, height: 36, marginBottom: spacing.xs },
  bigStatValue: {
    fontSize: fontSizes.heading,
    fontWeight: '800',
    color: colors.primaryDark,
  },
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
