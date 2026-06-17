/**
 * QuantityStepper — `−` value `+` control with optional product icon.
 *
 * Per spec: numbers are entered via tap counters, never typed on the keyboard.
 * Long-press on `−` or `+` repeats — useful for jumping by 5/10.
 */

import React, { useEffect, useRef } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type ViewStyle,
} from 'react-native';

import { colors, fontSizes, radii, spacing, tapTarget } from '../theme';

type Props = {
  label: string;
  labelUr?: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  icon?: ImageSourcePropType;
  style?: ViewStyle;
};

export function QuantityStepper({
  label,
  labelUr,
  value,
  onChange,
  min = 0,
  max = 9999,
  icon,
  style,
}: Props) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const dec = () => onChange(clamp(value - 1));
  const inc = () => onChange(clamp(value + 1));

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  useEffect(() => stop, []);

  const startRepeat = (delta: number) => {
    stop();
    intervalRef.current = setInterval(() => onChange(clamp(value + delta)), 120);
  };

  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <View style={[styles.row, style]}>
      <View style={styles.labelBox}>
        {icon ? <Image source={icon} style={styles.icon} resizeMode="contain" /> : null}
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.labelEn}>{label}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={dec}
          onLongPress={() => startRepeat(-1)}
          onPressOut={stop}
          disabled={atMin}
          style={({ pressed }) => [
            styles.btn,
            styles.btnMinus,
            pressed && !atMin ? styles.btnPressed : null,
            atMin ? styles.btnDisabled : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
        >
          <Text style={styles.btnText}>−</Text>
        </Pressable>

        <Text style={styles.value}>{value}</Text>

        <Pressable
          onPress={inc}
          onLongPress={() => startRepeat(1)}
          onPressOut={stop}
          disabled={atMax}
          style={({ pressed }) => [
            styles.btn,
            styles.btnPlus,
            pressed && !atMax ? styles.btnPressed : null,
            atMax ? styles.btnDisabled : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
        >
          <Text style={[styles.btnText, styles.btnTextPlus]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  labelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
    paddingRight: spacing.sm,
  },
  icon: {
    width: 36,
    height: 36,
  },
  labelEn: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: colors.text,
  },
  labelUr: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    width: tapTarget.min,
    height: tapTarget.min,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnMinus: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  btnPlus: {
    backgroundColor: colors.primary,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primaryDark,
    lineHeight: 30,
  },
  btnTextPlus: {
    color: colors.textInverse,
  },
  value: {
    minWidth: 56,
    textAlign: 'center',
    fontSize: fontSizes.heading,
    fontWeight: '800',
    color: colors.primaryDark,
    paddingHorizontal: spacing.sm,
  },
});
