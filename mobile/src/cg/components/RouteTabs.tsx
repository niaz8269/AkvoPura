/**
 * RouteTabs — top tab strip for Hospital / Bypass / Others.
 * Big tappable pills with English + Urdu labels and a count badge.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii, spacing } from '../../theme';
import { strings } from '../../i18n/strings';
import type { CGRoute } from '../types';

const ROUTE_LABELS: Record<CGRoute, { en: string; ur: string }> = {
  hospital: { en: 'Hospital', ur: 'ہسپتال' },
  bypass: { en: 'Bypass', ur: 'بائی پاس' },
  others: { en: 'Others', ur: 'دیگر' },
};

const ROUTES: CGRoute[] = ['hospital', 'bypass', 'others'];

type Props = {
  selected: CGRoute;
  onSelect: (route: CGRoute) => void;
  countByRoute: Record<CGRoute, number>;
};

// Touch the strings import so unused-warnings stay quiet if the consumer
// later wants to swap to the global strings table.
void strings;

export function RouteTabs({ selected, onSelect, countByRoute }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {ROUTES.map((route) => {
        const active = route === selected;
        const label = ROUTE_LABELS[route];
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
            <View>
              <Text style={[styles.labelEn, active ? styles.labelActive : null]}>
                {label.en}
              </Text>
              <Text style={[styles.labelUr, active ? styles.labelUrActive : null]}>
                {label.ur}
              </Text>
            </View>
            <View style={[styles.badge, active ? styles.badgeActive : null]}>
              <Text style={[styles.badgeText, active ? styles.badgeTextActive : null]}>
                {countByRoute[route] ?? 0}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  tabPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  labelEn: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  labelActive: {
    color: colors.textInverse,
  },
  labelUr: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  labelUrActive: {
    color: 'rgba(255,255,255,0.85)',
  },
  badge: {
    minWidth: 28,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
    backgroundColor: colors.primaryLight + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  badgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  badgeTextActive: {
    color: colors.textInverse,
  },
});
