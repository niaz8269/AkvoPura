/**
 * QuantityStepper — `−` [ N ] `+` control with optional product icon.
 *
 * The centre value is a real TextInput so the user can tap it and type a
 * number directly — critical when a customer places a large order (e.g.
 * 150 packs) and clicking + one hundred times isn't reasonable. The +/-
 * buttons still work for small adjustments and long-press repeats.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
  type ViewStyle,
} from 'react-native';

import { colors, fontSizes, radii, spacing, tapTarget } from '../theme';

type Props = {
  label: string;

  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  icon?: ImageSourcePropType;
  style?: ViewStyle;
};

export function QuantityStepper({
  label,
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

  // Local text state for the typed value — decoupled from the numeric prop
  // so the user can mid-type an empty string or partial number without the
  // parent snapping it back to 0.
  const [text, setText] = useState<string>(String(value));
  useEffect(() => {
    // If the parent changes value externally (e.g. reset after submit),
    // sync the input.
    setText(String(value));
  }, [value]);

  const commit = () => {
    const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
    const next = clamp(Number.isFinite(parsed) ? parsed : min);
    setText(String(next));
    if (next !== value) onChange(next);
  };

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

        <TextInput
          value={text}
          onChangeText={(t) => setText(t.replace(/[^0-9]/g, ''))}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType="number-pad"
          returnKeyType="done"
          selectTextOnFocus
          maxLength={5}
          style={styles.valueInput}
          accessibilityLabel={`${label} quantity`}
        />

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
  valueInput: {
    minWidth: 72,
    height: tapTarget.min,
    marginHorizontal: spacing.xs,
    textAlign: 'center',
    fontSize: fontSizes.heading,
    fontWeight: '800',
    color: colors.primaryDark,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 4,
  },
});
