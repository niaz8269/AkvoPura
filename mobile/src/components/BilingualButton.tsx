/**
 * BilingualButton — large, accessible button showing English + Urdu labels stacked.
 *
 * Tap target meets the spec minimum (48dp). Three visual variants: primary, secondary, danger.
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { colors, fontSizes, radii, spacing, tapTarget } from '../theme';
import type { BilingualString } from '../i18n/strings';

type Variant = 'primary' | 'secondary' | 'danger';

type Props = {
  label: BilingualString;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function BilingualButton({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
}: Props) {
  const isDisabled = disabled || loading;
  const variantStyles = VARIANTS[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles.container,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${label.en} / ${label.ur}`}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.textColor} />
      ) : (
        <View style={styles.labelStack}>
          <Text style={[styles.labelEn, { color: variantStyles.textColor }]}>{label.en}</Text>
          <Text style={[styles.labelUr, { color: variantStyles.textColor }]}>{label.ur}</Text>
        </View>
      )}
    </Pressable>
  );
}

const VARIANTS: Record<Variant, { container: ViewStyle; textColor: string }> = {
  primary: {
    container: { backgroundColor: colors.primary },
    textColor: colors.textInverse,
  },
  secondary: {
    container: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    textColor: colors.primary,
  },
  danger: {
    container: { backgroundColor: colors.danger },
    textColor: colors.textInverse,
  },
};

const styles = StyleSheet.create({
  base: {
    minHeight: tapTarget.min + 8,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelStack: {
    alignItems: 'center',
  },
  labelEn: {
    fontSize: fontSizes.button,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  labelUr: {
    fontSize: fontSizes.sm,
    marginTop: 2,
    opacity: 0.9,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
