/**
 * ActiveTripBanner — compact floating chip for salesmen.
 *
 * Placement: bottom-right corner as a small pill (like a FAB indicator).
 * Small enough not to cover form controls; tap to view/end the trip via
 * a confirmation dialog so an accidental tap can never end a live trip.
 *
 * Only rendered for REAL salesmen (never for owner-impersonating-salesman,
 * because owner has no trip and can't record on someone else's van).
 */

import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSizes, radii, spacing } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { useTrip } from './state';
import { navigationRef } from '../navigation/navigationRef';

const SALESMAN_ROLES = new Set(['cans_gallons_salesman', 'pets_salesman']);

export function ActiveTripBanner() {
  const insets = useSafeAreaInsets();
  const { user, viewAs } = useAuth();
  const { activeTrip, loading } = useTrip();

  const isRealSalesman = user ? SALESMAN_ROLES.has(user.role) : false;
  if (!isRealSalesman || loading) return null;
  void viewAs;

  const go = (screen: 'Assignments' | 'EndTrip') => {
    if (navigationRef.isReady()) {
      navigationRef.navigate(screen as never);
    }
  };

  const onActiveTap = () => {
    if (!activeTrip) return;
    Alert.alert(
      `Van ${activeTrip.vehicleLabel}`,
      `On the road for ${activeTrip.openedAt ? elapsedMinutes(activeTrip.openedAt) : 0} minutes.`,
      [
        { text: 'Keep going', style: 'cancel' },
        { text: 'End trip', style: 'destructive', onPress: () => go('EndTrip') },
      ],
    );
  };

  // Bottom-right corner FAB position. Small, doesn't cover swipe buttons
  // or form fields, and requires a confirmation tap to end — no more
  // accidental trip-endings.
  const bottomOffset = insets.bottom + spacing.md;

  if (!activeTrip) {
    // No trip active. Point salesman at their assignments queue.
    return (
      <View
        style={[styles.floatWrap, { bottom: bottomOffset }]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => go('Assignments')}
          style={({ pressed }) => [
            styles.chip,
            styles.chipIdle,
            pressed ? { opacity: 0.85, transform: [{ scale: 0.97 }] } : null,
          ]}
          accessibilityLabel="See my assigned trips"
        >
          <Ionicons name="clipboard-outline" size={14} color={colors.textInverse} />
          <Text style={styles.chipText}>MY TRIPS</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={[styles.floatWrap, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onActiveTap}
        style={({ pressed }) => [
          styles.chip,
          styles.chipActive,
          pressed ? { opacity: 0.85, transform: [{ scale: 0.97 }] } : null,
        ]}
        accessibilityLabel={`Trip active — Van ${activeTrip.vehicleLabel}. Tap to end.`}
      >
        <View style={styles.pulseDot} />
        <Text style={styles.chipText} numberOfLines={1}>
          {activeTrip.vehicleLabel}
        </Text>
      </Pressable>
    </View>
  );
}

function elapsedMinutes(openedAt: string): number {
  const opened = Date.parse(openedAt);
  if (Number.isNaN(opened)) return 0;
  return Math.max(0, Math.round((Date.now() - opened) / 60000));
}

const styles = StyleSheet.create({
  floatWrap: {
    position: 'absolute',
    right: spacing.md,
    alignItems: 'flex-end',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  chipActive: { backgroundColor: colors.success },
  chipIdle: { backgroundColor: colors.warning },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textInverse,
  },
  chipText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    maxWidth: 140,
  },
});
