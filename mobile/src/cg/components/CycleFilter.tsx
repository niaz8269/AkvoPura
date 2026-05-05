/**
 * CycleFilter — compact 3-option segmented control: All / Daily / Weekly.
 *
 * Sits above RouteTabs. Designed dense (~32 px tall) so the two filter rows
 * together stay under 80 px and don't crowd out the customer list.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii, spacing } from '../../theme';
import type { PaymentCycle } from '../types';

export type CycleFilterValue = PaymentCycle | 'all';

const ITEMS: { value: CycleFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

type Props = {
  selected: CycleFilterValue;
  onSelect: (v: CycleFilterValue) => void;
  counts: Record<CycleFilterValue, number>;
};

export function CycleFilter({ selected, onSelect, counts }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.segment}>
        {ITEMS.map((it) => {
          const active = it.value === selected;
          return (
            <Pressable
              key={it.value}
              onPress={() => onSelect(it.value)}
              style={({ pressed }) => [
                styles.segmentBtn,
                active ? styles.segmentBtnActive : null,
                pressed && !active ? styles.segmentBtnPressed : null,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.segmentLabel, active ? styles.segmentLabelActive : null]}>
                {it.label}
              </Text>
              <Text
                style={[
                  styles.segmentCount,
                  active ? styles.segmentCountActive : null,
                ]}
              >
                {counts[it.value] ?? 0}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 2,
    backgroundColor: colors.surface,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    borderRadius: radii.pill,
    gap: 4,
  },
  segmentBtnActive: {
    backgroundColor: colors.accent,
  },
  segmentBtnPressed: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  segmentLabelActive: {
    color: colors.textInverse,
  },
  segmentCount: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  segmentCountActive: {
    color: 'rgba(255,255,255,0.85)',
  },
});

void fontSizes; // tokens reserved for future use
