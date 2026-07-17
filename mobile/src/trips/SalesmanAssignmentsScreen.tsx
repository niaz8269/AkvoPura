/**
 * SalesmanAssignmentsScreen — the salesman's queue of trips the manager
 * has assigned. Also shows the currently-active trip (if any) at the top
 * with a jump-to-end button.
 *
 * Rule: only one trip can be active at a time. Tapping START on an
 * assignment when a trip is already active shows a warning telling the
 * salesman to end the current trip first.
 */

import React, { useCallback, useState } from 'react';
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

import { Screen } from '../components';
import { colors, fontSizes, radii, spacing } from '../theme';
import { ApiError } from '../api/client';
import { useTrip } from './state';
import { navigationRef } from '../navigation/navigationRef';
import type { ApiTripSummary } from '../api/trips';

export function SalesmanAssignmentsScreen() {
  const { activeTrip, assignedTrips, loading, refresh, startTrip } = useTrip();
  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const onStart = (trip: ApiTripSummary) => {
    if (activeTrip) {
      Alert.alert(
        'End current trip first',
        `You're already on trip ${activeTrip.vehicleLabel}. End it before starting the next one.`,
      );
      return;
    }
    Alert.alert(
      `Start trip on ${trip.vehicleLabel}?`,
      loadSummary(trip),
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            setStarting(trip.id);
            try {
              await startTrip(trip.id);
            } catch (e) {
              const msg = e instanceof ApiError ? e.message || e.code : 'Failed';
              Alert.alert('Could not start', msg);
            } finally {
              setStarting(null);
            }
          },
        },
      ],
    );
  };

  const onEnd = () => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('EndTrip' as never);
    }
  };

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTrip ? (
          <View style={styles.activeCard}>
            <View style={styles.activeHeader}>
              <View style={styles.pulseDot} />
              <Text style={styles.activeLabel}>ON THE ROAD</Text>
            </View>
            <Text style={styles.activeVehicle}>Van {activeTrip.vehicleLabel}</Text>
            <Text style={styles.activeSub}>{loadSummary(activeTrip)}</Text>
            <Pressable
              onPress={onEnd}
              style={({ pressed }) => [
                styles.endBtn,
                pressed ? { opacity: 0.85 } : null,
              ]}
            >
              <Ionicons name="stop-circle-outline" size={18} color={colors.textInverse} />
              <Text style={styles.endBtnText}>END TRIP</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>
          {assignedTrips.length === 0 ? 'No assignments' : 'Assignments'}
        </Text>
        <Text style={styles.sectionSub}>
          {assignedTrips.length === 0
            ? "Your manager hasn't assigned any trips yet. Check back later or pull to refresh."
            : 'Tap a trip to start it. You can run them one at a time.'}
        </Text>

        {loading && assignedTrips.length === 0 && !activeTrip ? (
          <View style={styles.centerPad}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}

        {assignedTrips.map((trip) => (
          <View key={trip.id} style={styles.assignmentCard}>
            <View style={styles.assignmentHeader}>
              <View style={styles.vehicleBadge}>
                <Ionicons name="car" size={16} color={colors.primaryDark} />
                <Text style={styles.vehicleText}>{trip.vehicleLabel}</Text>
              </View>
              <Text style={styles.roleTag}>
                {trip.role === 'cg' ? 'CANS/GALLONS' : 'PETS'}
              </Text>
            </View>
            <Text style={styles.loadText}>{loadSummary(trip)}</Text>
            {trip.notes ? (
              <View style={styles.noteBox}>
                <Ionicons name="chatbox-outline" size={14} color={colors.textMuted} />
                <Text style={styles.noteText}>{trip.notes}</Text>
              </View>
            ) : null}
            <Text style={styles.timeText}>
              Assigned {formatTime(trip.preparedAt)}
            </Text>
            <Pressable
              onPress={() => onStart(trip)}
              disabled={!!activeTrip || starting === trip.id}
              style={({ pressed }) => [
                styles.startBtn,
                activeTrip ? styles.startBtnDisabled : null,
                pressed && !activeTrip ? { opacity: 0.85 } : null,
              ]}
            >
              <Ionicons
                name={starting === trip.id ? 'hourglass-outline' : 'play'}
                size={16}
                color={colors.textInverse}
              />
              <Text style={styles.startBtnText}>
                {starting === trip.id ? 'STARTING…' : activeTrip ? 'END CURRENT FIRST' : 'START TRIP'}
              </Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

function loadSummary(trip: ApiTripSummary): string {
  if (trip.role === 'cg') {
    return `${trip.initialCansLoaded} cans · ${trip.initialGallonsLoaded} gallons loaded`;
  }
  return `${trip.initialPet600Packs} × 600ml · ${trip.initialPet1500Packs} × 1.5L packs loaded`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg },
  centerPad: { padding: spacing.xxl, alignItems: 'center' },

  activeCard: {
    backgroundColor: colors.success,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  activeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.textInverse },
  activeLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '900',
    color: colors.textInverse,
    letterSpacing: 1,
  },
  activeVehicle: {
    fontSize: fontSizes.heading,
    fontWeight: '900',
    color: colors.textInverse,
    marginTop: spacing.sm,
  },
  activeSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fontSizes.sm,
    marginTop: 4,
  },
  endBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    marginTop: spacing.md,
  },
  endBtnText: { color: colors.textInverse, fontSize: fontSizes.body, fontWeight: '900', letterSpacing: 0.5 },

  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: spacing.md,
  },
  sectionSub: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.md,
  },

  assignmentCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
  },
  assignmentHeader: {
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
  roleTag: { fontSize: 10, fontWeight: '900', color: colors.textMuted, letterSpacing: 0.5 },
  loadText: { fontSize: fontSizes.body, fontWeight: '700', color: colors.primaryDark },
  timeText: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 4 },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    borderRadius: radii.md,
    marginTop: spacing.sm,
  },
  noteText: { flex: 1, fontSize: fontSizes.sm, color: colors.text },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    marginTop: spacing.md,
  },
  startBtnDisabled: { backgroundColor: colors.textMuted },
  startBtnText: { color: colors.textInverse, fontSize: fontSizes.body, fontWeight: '900', letterSpacing: 0.5 },
});
