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
import { statusForCustomer } from '../cardStatus';
import type { CGRoute } from '../types';

const canIcon = require('../../../assets/brand/14ltr-can.webp');
const gallonIcon = require('../../../assets/brand/19ltr-gallon.webp');

type Nav = {
  navigate: (screen: string, params?: { customerId: string }) => void;
};

export function CGTodayScreen({ navigation }: { navigation: Nav }) {
  const { customers, vanLoad, deliveries, customersByRoute, deliveriesForCustomer } =
    useCGSalesman();

  const [route, setRoute] = useState<CGRoute>('hospital');

  const countByRoute = useMemo(
    () => ({
      hospital: customers.filter((c) => c.route === 'hospital').length,
      bypass: customers.filter((c) => c.route === 'bypass').length,
      others: customers.filter((c) => c.route === 'others').length,
    }),
    [customers]
  );

  const visible = customersByRoute(route);

  // Trigger re-render when deliveries change (status colors).
  void deliveries.length;

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Trip</Text>
        <Text style={styles.titleUr}>آج کا ٹرپ</Text>
        <View style={styles.vanRow}>
          <VanStat icon={canIcon} label="Cans on van" value={vanLoad.filledCans} />
          <VanStat icon={gallonIcon} label="Gallons on van" value={vanLoad.filledGallons} />
        </View>
      </View>

      <RouteTabs selected={route} onSelect={setRoute} countByRoute={countByRoute} />

      <ScrollView contentContainerStyle={styles.list}>
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
          <Text style={styles.empty}>No customers on this route.</Text>
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
      <View>
        <Text style={styles.vanValue}>{value}</Text>
        <Text style={styles.vanLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  titleUr: {
    fontSize: fontSizes.body,
    color: colors.primary,
  },
  vanRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  vanStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  vanIcon: { width: 36, height: 36 },
  vanValue: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.primaryDark,
    lineHeight: 26,
  },
  vanLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xl,
  },
});
