/**
 * RouteTabs — compact horizontal pills for Hospital / Bypass / Others.
 *
 * Designed to be dense (~36 px tall) so the filter row above the customer
 * list doesn't eat the screen. English label only inside the pill — Urdu
 * is reserved for the screen header. The active pill shows its count badge;
 * inactive pills omit it to reduce noise.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii, spacing } from '../../theme';
import type { CGRoute } from '../types';

const ROUTE_LABELS: Record<CGRoute, string> = {
  hospital: 'Hospital',
  bypass: 'Bypass',
  others: 'Others',
};

const ROUTES: CGRoute[] = ['hospital', 'bypass', 'others'];

type Props = {
  selected: CGRoute;
  onSelect: (route: CGRoute) => void;
  countByRoute: Record<CGRoute, number>;
};

export function RouteTabs({ selected, onSelect, countByRoute }: Props) {
  return (
    <View style={styles.row}>
      {ROUTES.map((route) => {
        const active = route === selected;
        return (
          <Pressable
            key={route}
            onPress={() => onSelect(route)}
            style={({ pressed }) => [
              styles.tab,
              active ? styles.tabActive : null,
              pressed && !active ? styles.tabPressed : null,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active ? styles.labelActive : null]}>
              {ROUTE_LABELS[route]}
            </Text>
            {active ? (
              <View style={styles.countActive}>
                <Text style={styles.countActiveText}>{countByRoute[route] ?? 0}</Text>
              </View>
            ) : (
              <Text style={styles.countInactive}>{countByRoute[route] ?? 0}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 2,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 30,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  tabPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  labelActive: { color: colors.textInverse },
  countInactive: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  countActive: {
    minWidth: 22,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countActiveText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textInverse,
  },
});
