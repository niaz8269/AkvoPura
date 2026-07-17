/**
 * ManagerTripsScreen — assignment-based trip view.
 *
 * Three buckets: Waiting for salesman (prepared, not started), On the road
 * (active), Closed (ended/cancelled). Manager can prep a new trip via FAB
 * and cancel a still-prepared trip inline.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { ApiError } from '../../api/client';
import { cancelTrip, listTrips, type ApiTripSummary } from '../../api/trips';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ManagerTripsScreen({ navigation }: any) {
  const [trips, setTrips] = useState<ApiTripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const rows = await listTrips();
      setTrips(rows);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.code === 'network_error'
            ? 'Cannot reach the server. Check Wi-Fi.'
            : `Server error: ${e.message}`
          : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const waiting = trips.filter((t) => !t.openedAt && !t.cancelledAt);
  const active = trips.filter((t) => t.openedAt && !t.closedAt && !t.cancelledAt);
  const closed = trips.filter((t) => t.closedAt || t.cancelledAt);

  const onCancel = (trip: ApiTripSummary) => {
    Alert.alert(
      'Cancel trip?',
      `Cancel the ${trip.vehicleLabel} assignment for ${trip.salesman?.name ?? 'salesman'}? Salesman won't be able to start it.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel trip',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelTrip(trip.id);
              load();
            } catch (e) {
              const msg = e instanceof ApiError ? e.message || e.code : 'Failed';
              Alert.alert('Could not cancel', msg);
            }
          },
        },
      ],
    );
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Trips</Text>
          <Text style={styles.subtitle}>
            {waiting.length} waiting · {active.length} on the road · {closed.length} closed
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
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
        {loading && trips.length === 0 ? (
          <View style={styles.centerPad}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={20} color={colors.danger} />
            <Text style={styles.errorMsg}>{error}</Text>
          </View>
        ) : null}

        {waiting.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Waiting for salesman</Text>
            {waiting.map((t) => (
              <TripCard
                key={t.id}
                trip={t}
                bucket="waiting"
                onPress={() => navigation.navigate('TripDetail', { tripId: t.id })}
                onCancel={() => onCancel(t)}
              />
            ))}
          </>
        ) : null}

        {active.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>On the road</Text>
            {active.map((t) => (
              <TripCard
                key={t.id}
                trip={t}
                bucket="active"
                onPress={() => navigation.navigate('TripDetail', { tripId: t.id })}
              />
            ))}
          </>
        ) : null}

        {closed.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Closed</Text>
            {closed.map((t) => (
              <TripCard
                key={t.id}
                trip={t}
                bucket="closed"
                onPress={() => navigation.navigate('TripDetail', { tripId: t.id })}
              />
            ))}
          </>
        ) : null}

        {!loading && trips.length === 0 && !error ? (
          <View style={styles.emptyCard}>
            <Ionicons name="car-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No trips yet</Text>
            <Text style={styles.emptySub}>
              Tap the + button to assign the first trip to one of your salesmen.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Pressable
        onPress={() => navigation.navigate('PrepareTrip')}
        style={({ pressed }) => [styles.fab, pressed ? { opacity: 0.85 } : null]}
        accessibilityLabel="Assign a trip"
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </Pressable>
    </Screen>
  );
}

type Bucket = 'waiting' | 'active' | 'closed';

function TripCard({
  trip,
  bucket,
  onPress,
  onCancel,
}: {
  trip: ApiTripSummary;
  bucket: Bucket;
  onPress: () => void;
  onCancel?: () => void;
}) {
  const stateChip =
    bucket === 'waiting'
      ? { label: 'WAITING', bg: colors.warning + '22', color: colors.warning }
      : bucket === 'active'
        ? { label: 'ON THE ROAD', bg: colors.success + '22', color: colors.success }
        : trip.cancelledAt
          ? { label: 'CANCELLED', bg: colors.textMuted + '22', color: colors.textMuted }
          : { label: 'CLOSED', bg: colors.textMuted + '22', color: colors.textMuted };

  const borderColor =
    bucket === 'waiting'
      ? colors.warning
      : bucket === 'active'
        ? colors.success
        : colors.textMuted;

  const timeText = trip.openedAt
    ? trip.closedAt
      ? `${formatTime(trip.openedAt)} → ${formatTime(trip.closedAt)}`
      : `Started ${formatTime(trip.openedAt)} · ${elapsedMin(trip.openedAt, null)}m`
    : `Assigned ${formatTime(trip.preparedAt)}`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: borderColor },
        pressed ? { opacity: 0.85 } : null,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.vehicleBadge}>
          <Ionicons name="car" size={16} color={colors.primaryDark} />
          <Text style={styles.vehicleText}>{trip.vehicleLabel}</Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: stateChip.bg }]}>
          <Text style={[styles.statusText, { color: stateChip.color }]}>{stateChip.label}</Text>
        </View>
      </View>

      <Text style={styles.salesmanName}>
        {trip.salesman?.name ?? 'Salesman'}
        <Text style={styles.roleTag}>
          {' · ' + (trip.role === 'cg' ? 'Cans/Gallons' : 'Pets')}
        </Text>
      </Text>

      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={14} color={colors.textMuted} />
        <Text style={styles.metaText}>{timeText}</Text>
      </View>

      {bucket === 'waiting' ? (
        <View style={styles.loadRow}>
          <Ionicons name="cube-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaText}>
            {trip.role === 'cg'
              ? `${trip.initialCansLoaded} cans · ${trip.initialGallonsLoaded} gallons`
              : `${trip.initialPet600Packs} × 600ml · ${trip.initialPet1500Packs} × 1.5L`}
          </Text>
        </View>
      ) : null}

      {bucket === 'waiting' && onCancel ? (
        <Pressable onPress={onCancel} style={styles.cancelBtn} hitSlop={8}>
          <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
          <Text style={styles.cancelBtnText}>Cancel assignment</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function elapsedMin(openedAt: string, closedAt: string | null): number {
  const start = Date.parse(openedAt);
  const end = closedAt ? Date.parse(closedAt) : Date.now();
  return Math.max(0, Math.round((end - start) / 60000));
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: 4,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },
  subtitle: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },

  body: { padding: spacing.lg, paddingBottom: spacing.xxl + 60 },

  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },

  centerPad: { padding: spacing.xxl, alignItems: 'center' },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger + '18',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorMsg: { flex: 1, fontSize: fontSizes.sm, color: colors.danger, fontWeight: '700' },

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: spacing.sm,
  },
  emptySub: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
  },
  cardHeader: {
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
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  salesmanName: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  roleTag: { fontSize: fontSizes.sm, color: colors.textMuted, fontWeight: '600' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  loadRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaText: { fontSize: fontSizes.xs, color: colors.textMuted },

  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.danger + '55',
  },
  cancelBtnText: { fontSize: fontSizes.xs, fontWeight: '800', color: colors.danger },

  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
