/**
 * ManagerTripDetailScreen — every delivery / bill / collection / return
 * logged under one trip. Includes van reconciliation (initial vs final
 * counts) and cash reconciliation (expected vs declared).
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { ApiError } from '../../api/client';
import { getTripDetail, type ApiTripDetail } from '../../api/trips';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ManagerTripDetailScreen({ route }: any) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState<ApiTripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const t = await getTripDetail(tripId);
      setTrip(t);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.code === 'network_error'
            ? 'Cannot reach the server.'
            : `Server error: ${e.message}`
          : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !trip) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!trip) {
    return (
      <Screen>
        <Text style={{ textAlign: 'center', marginTop: spacing.xl, color: colors.danger }}>
          {error ?? 'Trip not found'}
        </Text>
      </Screen>
    );
  }

  const totalCash =
    trip.deliveries.reduce((s, d) => s + d.cashCollected, 0) +
    trip.collections.reduce((s, c) => s + (c.cashCollected ?? 0), 0) +
    trip.bills.reduce((s, b) => s + b.cashCollected, 0);
  const totalBank =
    trip.deliveries.reduce((s, d) => s + d.bankCollected, 0) +
    trip.collections.reduce((s, c) => s + (c.bankCollected ?? 0), 0) +
    trip.bills.reduce((s, b) => s + b.bankCollected, 0);

  const cashMismatch =
    trip.declaredCashOnHand != null ? trip.declaredCashOnHand - totalCash : null;

  const opened = trip.openedAt ? new Date(trip.openedAt) : null;
  const closed = trip.closedAt ? new Date(trip.closedAt) : null;
  const prepared = new Date(trip.preparedAt);

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.vehicleBadge}>
              <Ionicons name="car" size={16} color={colors.primaryDark} />
              <Text style={styles.vehicleText}>{trip.vehicleLabel}</Text>
            </View>
            <View
              style={[
                styles.statusChip,
                closed ? styles.statusClosed : styles.statusOpen,
              ]}
            >
              <Text style={styles.statusText}>{closed ? 'CLOSED' : 'ON THE ROAD'}</Text>
            </View>
          </View>
          <Text style={styles.salesmanName}>{trip.salesman?.name ?? 'Salesman'}</Text>
          <Text style={styles.timeText}>
            {opened
              ? `${fmtDateTime(opened)}${closed ? ` → ${fmtDateTime(closed)}` : ' — still active'}`
              : `Assigned ${fmtDateTime(prepared)} — waiting for salesman`}
          </Text>
          {trip.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{trip.notes}</Text>
            </View>
          ) : null}
        </View>

        {trip.role === 'cg' ? (
          <VanReconCG trip={trip} />
        ) : (
          <VanReconPets trip={trip} />
        )}

        <SectionTitle>Cash reconciliation</SectionTitle>
        <View style={styles.section}>
          <Row label="Cash collected on trip" value={`Rs ${totalCash.toLocaleString()}`} />
          <Row label="Bank / digital collected" value={`Rs ${totalBank.toLocaleString()}`} />
          {trip.declaredCashOnHand != null ? (
            <Row label="Declared at end" value={`Rs ${trip.declaredCashOnHand.toLocaleString()}`} last />
          ) : (
            <Row label="Declared at end" value="—" last />
          )}
          {cashMismatch != null && cashMismatch !== 0 ? (
            <View
              style={[
                styles.mismatch,
                cashMismatch < 0 ? styles.mismatchShort : styles.mismatchOver,
              ]}
            >
              <Ionicons
                name={cashMismatch < 0 ? 'alert-circle' : 'add-circle'}
                size={16}
                color={cashMismatch < 0 ? colors.danger : colors.warning}
              />
              <Text style={styles.mismatchText}>
                {cashMismatch < 0
                  ? `Short by Rs ${Math.abs(cashMismatch).toLocaleString()}`
                  : `Rs ${cashMismatch.toLocaleString()} more than expected`}
              </Text>
            </View>
          ) : null}
        </View>

        {trip.deliveries.length > 0 ? (
          <>
            <SectionTitle>Deliveries ({trip.deliveries.length})</SectionTitle>
            {trip.deliveries.map((d) => (
              <ActivityRow
                key={d.id}
                chip="Deliver"
                chipColor={colors.primary}
                title={d.customer.name}
                line={`${d.cansDelivered} cans + ${d.gallonsDelivered} gallons · Rs ${d.cashCollected}/${d.amountBilled}`}
                time={fmtTime(new Date(d.loggedAt))}
              />
            ))}
          </>
        ) : null}

        {trip.collections.length > 0 ? (
          <>
            <SectionTitle>Collections ({trip.collections.length})</SectionTitle>
            {trip.collections.map((c) => (
              <ActivityRow
                key={c.id}
                chip="Collect"
                chipColor={colors.warning}
                title={c.customer.name}
                line={`${c.cansCollected} cans + ${c.gallonsCollected} gallons returned${c.cashCollected ? ` · Rs ${c.cashCollected}` : ''}`}
                time={fmtTime(new Date(c.loggedAt))}
              />
            ))}
          </>
        ) : null}

        {trip.bills.length > 0 ? (
          <>
            <SectionTitle>Bills ({trip.bills.length})</SectionTitle>
            {trip.bills.map((b) => (
              <ActivityRow
                key={b.id}
                chip="Bill"
                chipColor={colors.accent}
                title={b.customer.name}
                line={`${b.pet600Packs} × 600ml + ${b.pet1500Packs} × 1.5L · Rs ${b.cashCollected}/${b.amountBilled}`}
                time={fmtTime(new Date(b.loggedAt))}
              />
            ))}
          </>
        ) : null}

        {trip.returns.length > 0 ? (
          <>
            <SectionTitle>Returns ({trip.returns.length})</SectionTitle>
            {trip.returns.map((r) => (
              <ActivityRow
                key={r.id}
                chip="Return"
                chipColor={colors.danger}
                title={r.customer.name}
                line={`${r.pet600Packs} × 600ml + ${r.pet1500Packs} × 1.5L · refund Rs ${r.refundAmount}`}
                time={fmtTime(new Date(r.loggedAt))}
              />
            ))}
          </>
        ) : null}

        {trip.deliveries.length +
          trip.collections.length +
          trip.bills.length +
          trip.returns.length ===
        0 ? (
          <Text style={styles.empty}>No activity logged under this trip yet.</Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function VanReconCG({ trip }: { trip: ApiTripDetail }) {
  const cansDelivered = trip.deliveries.reduce((s, d) => s + d.cansDelivered, 0);
  const gallonsDelivered = trip.deliveries.reduce((s, d) => s + d.gallonsDelivered, 0);
  const emptyCansPicked = trip.deliveries.reduce((s, d) => s + d.emptyCansCollected, 0)
    + trip.collections.reduce((s, c) => s + c.cansCollected, 0);
  const emptyGallonsPicked = trip.deliveries.reduce((s, d) => s + d.emptyGallonsCollected, 0)
    + trip.collections.reduce((s, c) => s + c.gallonsCollected, 0);

  const expectedCans = trip.initialCansLoaded - cansDelivered;
  const expectedGallons = trip.initialGallonsLoaded - gallonsDelivered;
  const cansOff = trip.finalCansOnVan != null ? trip.finalCansOnVan - expectedCans : null;
  const gallonsOff = trip.finalGallonsOnVan != null ? trip.finalGallonsOnVan - expectedGallons : null;

  return (
    <>
      <SectionTitle>Van reconciliation</SectionTitle>
      <View style={styles.section}>
        <Row label="Loaded (cans)" value={`${trip.initialCansLoaded}`} />
        <Row label="Loaded (gallons)" value={`${trip.initialGallonsLoaded}`} />
        <Row label="Delivered (cans)" value={`${cansDelivered}`} />
        <Row label="Delivered (gallons)" value={`${gallonsDelivered}`} />
        <Row label="Expected remaining (cans)" value={`${expectedCans}`} />
        <Row label="Expected remaining (gallons)" value={`${expectedGallons}`} />
        <Row
          label="Declared remaining (cans)"
          value={trip.finalCansOnVan != null ? String(trip.finalCansOnVan) : '—'}
          warn={cansOff != null && cansOff !== 0}
        />
        <Row
          label="Declared remaining (gallons)"
          value={trip.finalGallonsOnVan != null ? String(trip.finalGallonsOnVan) : '—'}
          warn={gallonsOff != null && gallonsOff !== 0}
        />
        <Row label="Empty cans picked up" value={`${emptyCansPicked}`} />
        <Row label="Empty gallons picked up" value={`${emptyGallonsPicked}`} last />
      </View>
    </>
  );
}

function VanReconPets({ trip }: { trip: ApiTripDetail }) {
  const packs600Sold = trip.bills.reduce((s, b) => s + b.pet600Packs, 0);
  const packs1500Sold = trip.bills.reduce((s, b) => s + b.pet1500Packs, 0);
  const packs600Returned = trip.returns.reduce((s, r) => s + r.pet600Packs, 0);
  const packs1500Returned = trip.returns.reduce((s, r) => s + r.pet1500Packs, 0);

  const expected600 = trip.initialPet600Packs - packs600Sold + packs600Returned;
  const expected1500 = trip.initialPet1500Packs - packs1500Sold + packs1500Returned;
  const off600 = trip.finalPet600Packs != null ? trip.finalPet600Packs - expected600 : null;
  const off1500 = trip.finalPet1500Packs != null ? trip.finalPet1500Packs - expected1500 : null;

  return (
    <>
      <SectionTitle>Van reconciliation</SectionTitle>
      <View style={styles.section}>
        <Row label="Loaded (600ml)" value={`${trip.initialPet600Packs}`} />
        <Row label="Loaded (1.5L)" value={`${trip.initialPet1500Packs}`} />
        <Row label="Sold (600ml)" value={`${packs600Sold}`} />
        <Row label="Sold (1.5L)" value={`${packs1500Sold}`} />
        <Row label="Returned (600ml)" value={`${packs600Returned}`} />
        <Row label="Returned (1.5L)" value={`${packs1500Returned}`} />
        <Row label="Expected remaining (600ml)" value={`${expected600}`} />
        <Row label="Expected remaining (1.5L)" value={`${expected1500}`} />
        <Row
          label="Declared remaining (600ml)"
          value={trip.finalPet600Packs != null ? String(trip.finalPet600Packs) : '—'}
          warn={off600 != null && off600 !== 0}
        />
        <Row
          label="Declared remaining (1.5L)"
          value={trip.finalPet1500Packs != null ? String(trip.finalPet1500Packs) : '—'}
          warn={off1500 != null && off1500 !== 0}
          last
        />
      </View>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function Row({
  label,
  value,
  warn,
  last,
}: {
  label: string;
  value: string;
  warn?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last ? styles.rowLast : null]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, warn ? styles.rowValueWarn : null]}>{value}</Text>
    </View>
  );
}

function ActivityRow({
  chip,
  chipColor,
  title,
  line,
  time,
}: {
  chip: string;
  chipColor: string;
  title: string;
  line: string;
  time: string;
}) {
  return (
    <View style={styles.activityRow}>
      <View style={[styles.activityChip, { backgroundColor: chipColor + '22' }]}>
        <Text style={[styles.activityChipText, { color: chipColor }]}>{chip}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activityLine}>{line}</Text>
      </View>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
  );
}

function fmtDateTime(d: Date) {
  return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function fmtTime(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  vehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  vehicleText: {
    fontSize: fontSizes.sm,
    fontWeight: '900',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  statusOpen: { backgroundColor: colors.success + '22' },
  statusClosed: { backgroundColor: colors.surfaceMuted },
  statusText: { fontSize: 10, fontWeight: '900', color: colors.primaryDark, letterSpacing: 0.5 },
  salesmanName: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  timeText: { fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
  notesBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  notesText: { fontSize: fontSizes.sm, color: colors.text },

  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: fontSizes.sm, color: colors.text, flex: 1 },
  rowValue: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.primaryDark },
  rowValueWarn: { color: colors.danger },

  mismatch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: spacing.sm,
    borderRadius: radii.md,
    marginTop: spacing.sm,
  },
  mismatchShort: { backgroundColor: colors.danger + '18' },
  mismatchOver: { backgroundColor: colors.warning + '22' },
  mismatchText: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.text },

  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  activityChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    minWidth: 64,
    alignItems: 'center',
  },
  activityChipText: { fontSize: 10, fontWeight: '900' },
  activityTitle: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.text },
  activityLine: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  activityTime: { fontSize: fontSizes.xs, color: colors.textMuted },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.lg,
  },
});
