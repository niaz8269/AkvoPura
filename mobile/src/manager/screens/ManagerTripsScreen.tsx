/**
 * ManagerTripsScreen — auditable view of today's salesman activity.
 *
 * Two tabs (Cans/Gallons / Pets) — each shows the chronological list of
 * deliveries / bills / collections / returns with totals and reconciliation.
 */

import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useCGSalesman } from '../../cg/state';
import { usePetsSalesman } from '../../pets/state';
import { initialVanLoad as cgInitialLoad } from '../../cg/demoData';
import { initialPetVanLoad } from '../../pets/demoData';

const canIcon = require('../../../assets/brand/14ltr-can.webp');
const gallonIcon = require('../../../assets/brand/19ltr-gallon.webp');

type Tab = 'cg' | 'pets';

export function ManagerTripsScreen() {
  const [tab, setTab] = useState<Tab>('cg');

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Trips</Text>
        <Text style={styles.titleUr}>آج کے ٹرپ</Text>

        <View style={styles.tabRow}>
          <TabPill label="Cans / Gallons" active={tab === 'cg'} onPress={() => setTab('cg')} />
          <TabPill label="Pets" active={tab === 'pets'} onPress={() => setTab('pets')} />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
        {tab === 'cg' ? <CGSection /> : <PetsSection />}
      </ScrollView>
    </Screen>
  );
}

function TabPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tab,
        active ? styles.tabActive : null,
        pressed && !active ? styles.tabPressed : null,
      ]}
    >
      <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function CGSection() {
  const cg = useCGSalesman();

  const totalCash = cg.deliveries.reduce((s, d) => s + d.cashCollected, 0);
  const totalBilled = cg.deliveries.reduce((s, d) => s + d.amountBilled, 0);
  const cans = cg.deliveries.reduce((s, d) => s + d.cansDelivered, 0);
  const gallons = cg.deliveries.reduce((s, d) => s + d.gallonsDelivered, 0);
  const colCans = cg.collections.reduce((s, c) => s + c.cansCollected, 0);
  const colGallons = cg.collections.reduce((s, c) => s + c.gallonsCollected, 0);

  const events = [
    ...cg.deliveries.map((d) => ({ kind: 'delivery' as const, ts: d.timestamp, data: d })),
    ...cg.collections.map((c) => ({ kind: 'collection' as const, ts: c.timestamp, data: c })),
  ].sort((a, b) => b.ts - a.ts);

  return (
    <>
      <View style={styles.kpiRow}>
        <Kpi label="Cash" value={`Rs ${totalCash.toLocaleString()}`} accent />
        <Kpi label="Billed" value={`Rs ${totalBilled.toLocaleString()}`} />
      </View>
      <View style={styles.kpiRow}>
        <Kpi label="Cans delivered" value={cans} icon={canIcon} />
        <Kpi label="Gallons delivered" value={gallons} icon={gallonIcon} />
      </View>
      <View style={styles.kpiRow}>
        <Kpi label="Empty cans collected" value={colCans} icon={canIcon} muted />
        <Kpi label="Empty gallons collected" value={colGallons} icon={gallonIcon} muted />
      </View>

      <ReconCard
        title="Van reconciliation"
        rows={[
          [
            'Filled cans loaded → on van',
            `${cgInitialLoad.filledCans} → ${cg.vanLoad.filledCans}`,
          ],
          [
            'Filled gallons loaded → on van',
            `${cgInitialLoad.filledGallons} → ${cg.vanLoad.filledGallons}`,
          ],
          ['Empty cans on van (collected)', String(cg.vanLoad.emptyCansAboard)],
          ['Empty gallons on van (collected)', String(cg.vanLoad.emptyGallonsAboard)],
        ]}
      />

      <SectionTitle text={`Activity feed — currently on trip #${cg.currentTripNumber}`} />
      {events.length === 0 ? (
        <Empty text="No trip activity yet today." />
      ) : (
        renderGrouped(
          events,
          (ev) => ev.data.tripNumber,
          (ev) => {
            const cust = cg.customerById(ev.data.customerId);
            if (ev.kind === 'delivery') {
              const d = ev.data;
              return (
                <View key={d.id} style={styles.eventRow}>
                  <View style={[styles.kindChip, styles.chipDeliver]}>
                    <Text style={styles.kindChipText}>Deliver</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventName}>{cust?.name ?? '—'}</Text>
                    <Text style={styles.eventLine}>
                      {d.cansDelivered} cans • {d.gallonsDelivered} gallons • Rs{' '}
                      {d.cashCollected.toLocaleString()}/{d.amountBilled.toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.eventTime}>{formatTime(d.timestamp)}</Text>
                </View>
              );
            }
            const c = ev.data;
            return (
              <View key={c.id} style={styles.eventRow}>
                <View style={[styles.kindChip, styles.chipCollect]}>
                  <Text style={styles.kindChipText}>Collect</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventName}>{cust?.name ?? '—'}</Text>
                  <Text style={styles.eventLine}>
                    {c.cansCollected} cans • {c.gallonsCollected} gallons returned
                  </Text>
                </View>
                <Text style={styles.eventTime}>{formatTime(c.timestamp)}</Text>
              </View>
            );
          }
        )
      )}
    </>
  );
}

/** Groups timestamp-sorted events by trip number with a small section header
 *  before each group ("Trip #1", "Trip #2"). Returns React nodes. */
function renderGrouped<T>(
  items: T[],
  tripOf: (item: T) => number,
  renderItem: (item: T) => React.ReactNode
): React.ReactNode {
  if (items.length === 0) return null;
  const groups = new Map<number, T[]>();
  items.forEach((it) => {
    const t = tripOf(it);
    if (!groups.has(t)) groups.set(t, []);
    groups.get(t)!.push(it);
  });
  // Sort by trip number desc so most-recent trip comes first
  const sortedTrips = [...groups.keys()].sort((a, b) => b - a);
  return sortedTrips.map((tripNum) => (
    <React.Fragment key={`trip-${tripNum}`}>
      <View style={styles.tripGroupHeader}>
        <Text style={styles.tripGroupText}>Trip #{tripNum}</Text>
        <View style={styles.tripGroupCount}>
          <Text style={styles.tripGroupCountText}>
            {groups.get(tripNum)!.length} {groups.get(tripNum)!.length === 1 ? 'event' : 'events'}
          </Text>
        </View>
      </View>
      {groups.get(tripNum)!.map(renderItem)}
    </React.Fragment>
  ));
}

function PetsSection() {
  const pets = usePetsSalesman();

  const totalCash = pets.bills.reduce((s, b) => s + b.cashCollected, 0);
  const totalBilled = pets.bills.reduce((s, b) => s + b.amountBilled, 0);
  const sold600 = pets.bills.reduce((s, b) => s + b.pet600Packs, 0);
  const sold1500 = pets.bills.reduce((s, b) => s + b.pet1500Packs, 0);
  const refunds = pets.returns.reduce((s, r) => s + r.refundAmount, 0);

  const events = [
    ...pets.bills.map((b) => ({ kind: 'bill' as const, ts: b.timestamp, data: b })),
    ...pets.returns.map((r) => ({ kind: 'return' as const, ts: r.timestamp, data: r })),
  ].sort((a, b) => b.ts - a.ts);

  return (
    <>
      <View style={styles.kpiRow}>
        <Kpi label="Cash" value={`Rs ${totalCash.toLocaleString()}`} accent />
        <Kpi label="Billed" value={`Rs ${totalBilled.toLocaleString()}`} />
      </View>
      <View style={styles.kpiRow}>
        <Kpi label="600ml packs sold" value={sold600} />
        <Kpi label="1.5L packs sold" value={sold1500} />
      </View>
      <View style={styles.kpiRow}>
        <Kpi label="Refunds issued" value={`Rs ${refunds.toLocaleString()}`} muted />
      </View>

      <ReconCard
        title="Van reconciliation"
        rows={[
          [
            '600 ml packs loaded → on van',
            `${initialPetVanLoad.pet600Packs} → ${pets.vanLoad.pet600Packs}`,
          ],
          [
            '1.5 L packs loaded → on van',
            `${initialPetVanLoad.pet1500Packs} → ${pets.vanLoad.pet1500Packs}`,
          ],
        ]}
      />

      <SectionTitle text={`Activity feed — currently on trip #${pets.currentTripNumber}`} />
      {events.length === 0 ? (
        <Empty text="No trip activity yet today." />
      ) : (
        renderGrouped(
          events,
          (ev) => ev.data.tripNumber,
          (ev) => {
            const cust = pets.customerById(ev.data.customerId);
            if (ev.kind === 'bill') {
              const b = ev.data;
              return (
                <View key={b.id} style={styles.eventRow}>
                  <View style={[styles.kindChip, styles.chipBill]}>
                    <Text style={styles.kindChipText}>Bill</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventName}>{cust?.name ?? '—'}</Text>
                    <Text style={styles.eventLine}>
                      {b.pet600Packs} × 600ml • {b.pet1500Packs} × 1.5L • Rs{' '}
                      {b.cashCollected.toLocaleString()}/{b.amountBilled.toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.eventTime}>{formatTime(b.timestamp)}</Text>
                </View>
              );
            }
            const r = ev.data;
            return (
              <View key={r.id} style={styles.eventRow}>
                <View style={[styles.kindChip, styles.chipReturn]}>
                  <Text style={styles.kindChipText}>Return</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventName}>{cust?.name ?? '—'}</Text>
                  <Text style={styles.eventLine}>
                    {r.pet600Packs} × 600ml • {r.pet1500Packs} × 1.5L • refund Rs{' '}
                    {r.refundAmount.toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.eventTime}>{formatTime(r.timestamp)}</Text>
              </View>
            );
          }
        )
      )}
    </>
  );
}

function Kpi({
  label,
  value,
  icon,
  accent,
  muted,
}: {
  label: string;
  value: number | string;
  icon?: ReturnType<typeof require>;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <View style={[styles.kpi, accent ? styles.kpiAccent : null, muted ? styles.kpiMuted : null]}>
      {icon ? <Image source={icon} style={styles.kpiIcon} resizeMode="contain" /> : null}
      <Text
        style={[
          styles.kpiValue,
          accent ? styles.kpiValueAccent : null,
        ]}
      >
        {value}
      </Text>
      <Text style={[styles.kpiLabel, accent ? styles.kpiLabelAccent : null]}>{label}</Text>
    </View>
  );
}

function ReconCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <View style={styles.reconCard}>
      <Text style={styles.reconTitle}>{title}</Text>
      {rows.map(([k, v], i) => (
        <View
          key={k}
          style={[styles.reconRow, i === rows.length - 1 ? styles.reconRowLast : null]}
        >
          <Text style={styles.reconLabel}>{k}</Text>
          <Text style={styles.reconValue}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

function SectionTitle({ text }: { text: string }) {
  return <Text style={styles.sectionTitle}>{text}</Text>;
}

function Empty({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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
  title: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },
  titleUr: { fontSize: fontSizes.body, color: colors.primary, marginBottom: spacing.md },
  tabRow: { flexDirection: 'row', gap: spacing.sm },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  tabPressed: { backgroundColor: colors.surfaceMuted },
  tabText: { fontSize: fontSizes.body, fontWeight: '700', color: colors.primaryDark },
  tabTextActive: { color: colors.textInverse },

  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  kpiRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  kpi: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  kpiAccent: { backgroundColor: colors.primary },
  kpiMuted: { backgroundColor: colors.surfaceMuted },
  kpiIcon: { width: 32, height: 32, marginBottom: spacing.xs },
  kpiValue: {
    fontSize: fontSizes.title,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  kpiValueAccent: { color: colors.textInverse },
  kpiLabel: { fontSize: fontSizes.xs, color: colors.textMuted, textAlign: 'center' },
  kpiLabelAccent: { color: 'rgba(255,255,255,0.85)' },

  reconCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  reconTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },
  reconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reconRowLast: { borderBottomWidth: 0 },
  reconLabel: { fontSize: fontSizes.sm, color: colors.text, flex: 1 },
  reconValue: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.primaryDark,
  },

  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },
  empty: {
    fontStyle: 'italic',
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    paddingVertical: spacing.lg,
    textAlign: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  kindChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    minWidth: 64,
    alignItems: 'center',
  },
  chipDeliver: { backgroundColor: colors.primary + '22' },
  chipCollect: { backgroundColor: colors.warning + '22' },
  chipBill: { backgroundColor: colors.accent + '22' },
  chipReturn: { backgroundColor: colors.danger + '22' },
  kindChipText: { fontSize: 10, fontWeight: '800', color: colors.primaryDark },
  eventName: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.text },
  eventLine: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  eventTime: { fontSize: fontSizes.xs, color: colors.textMuted },

  tripGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accent + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.md,
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  tripGroupText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 0.5,
  },
  tripGroupCount: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  tripGroupCountText: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
});
