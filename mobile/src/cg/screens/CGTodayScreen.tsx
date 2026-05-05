/**
 * CGTodayScreen — the salesman's "today's customers" view.
 *
 * Shows the van load at top, route tabs (Hospital/Bypass/Others), then
 * the colored customer cards for the selected route. Tap a card to see
 * full history.
 */

import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useCGSalesman } from '../state';
import { CustomerCard } from '../components/CustomerCard';
import { RouteTabs } from '../components/RouteTabs';
import { CycleFilter, type CycleFilterValue } from '../components/CycleFilter';
import { statusForCustomer } from '../cardStatus';
import type { CGRoute } from '../types';

const canIcon = require('../../../assets/brand/14ltr-can.webp');
const gallonIcon = require('../../../assets/brand/19ltr-gallon.webp');

type Nav = {
  navigate: (screen: string, params?: { customerId: string }) => void;
};

export function CGTodayScreen({ navigation }: { navigation: Nav }) {
  const { customers, vanLoad, deliveries, deliveriesForCustomer, currentTripNumber } =
    useCGSalesman();

  const [cycle, setCycle] = useState<CycleFilterValue>('all');
  const [route, setRoute] = useState<CGRoute>('hospital');

  const cycleFiltered = useMemo(
    () => (cycle === 'all' ? customers : customers.filter((c) => c.paymentCycle === cycle)),
    [customers, cycle]
  );

  const countByCycle = useMemo(
    () => ({
      all: customers.length,
      daily: customers.filter((c) => c.paymentCycle === 'daily').length,
      weekly: customers.filter((c) => c.paymentCycle === 'weekly').length,
    }),
    [customers]
  );

  const countByRoute = useMemo(
    () => ({
      hospital: cycleFiltered.filter((c) => c.route === 'hospital').length,
      bypass: cycleFiltered.filter((c) => c.route === 'bypass').length,
      others: cycleFiltered.filter((c) => c.route === 'others').length,
    }),
    [cycleFiltered]
  );

  const visible = cycleFiltered.filter((c) => c.route === route);

  // Trigger re-render when deliveries change (status colors).
  void deliveries.length;

  return (
    <Screen padded={false}>
      <View style={styles.vanBar}>
        <View style={styles.tripChip}>
          <Text style={styles.tripChipText}>Trip #{currentTripNumber}</Text>
        </View>
        <VanStat icon={canIcon} label="Cans" value={vanLoad.filledCans} />
        <View style={styles.vanDivider} />
        <VanStat icon={gallonIcon} label="Gallons" value={vanLoad.filledGallons} />
      </View>

      <CycleFilter selected={cycle} onSelect={setCycle} counts={countByCycle} />
      <RouteTabs selected={route} onSelect={setRoute} countByRoute={countByRoute} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
        {visible.map((c) => {
          const todays = deliveriesForCustomer(c.id);
          const status = statusForCustomer(c, todays);
          const cans = todays.reduce((s, d) => s + d.cansDelivered, 0);
          const gallons = todays.reduce((s, d) => s + d.gallonsDelivered, 0);
          return (
            <CustomerCard
              key={c.id}
              customer={c}
              status={status}
              todaysCansDelivered={cans}
              todaysGallonsDelivered={gallons}
              onPress={() => navigation.navigate('CustomerDetail', { customerId: c.id })}
            />
          );
        })}

        {visible.length === 0 ? (
          <Text style={styles.empty}>
            No {cycle === 'all' ? '' : cycle + ' '}customers on this route.
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function VanStat({
  icon,
  label,
  value,
}: {
  icon: ReturnType<typeof require>;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.vanStat}>
      <Image source={icon} style={styles.vanIcon} resizeMode="contain" />
      <Text style={styles.vanValue}>{value}</Text>
      <Text style={styles.vanLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  vanBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  vanDivider: {
    width: 1,
    height: 18,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  vanStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vanIcon: { width: 18, height: 18 },
  vanValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  vanLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tripChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.accent + '22',
    marginRight: spacing.md,
  },
  tripChipText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 0.5,
  },
  scroll: { flex: 1 },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: 4,
    paddingBottom: spacing.sm,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xl,
  },
});
