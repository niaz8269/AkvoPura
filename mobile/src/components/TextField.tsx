/**
 * TextField — labeled text input.
 * Big tap target, clear focus state.
 *
 * When secureTextEntry is true, an eye toggle appears inside the input
 * so the user can briefly reveal the password (avoids typing mistakes
 * for long passwords on phone keyboards).
 */

import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSizes, radii, spacing, tapTarget } from '../theme';
import type { BilingualString } from '../i18n/strings';

type Props = {
  /** Bilingual label; only the English half is rendered. */
  label: BilingualString;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  keyboardType?: KeyboardTypeOptions;
  autoComplete?: TextInputProps['autoComplete'];
  testID?: string;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize = 'none',
  keyboardType,
  autoComplete,
  testID,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);
  const masked = !!secureTextEntry && !reveal;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.labelEn}>{label.en}</Text>
      </View>
      <View
        style={[
          styles.inputRow,
          focused ? styles.inputRowFocused : null,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={masked}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
          testID={testID}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setReveal((r) => !r)}
            hitSlop={10}
            style={({ pressed }) => [
              styles.eyeBtn,
              pressed ? { opacity: 0.6 } : null,
            ]}
            accessibilityLabel={reveal ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={reveal ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  labelEn: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.text,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: tapTarget.min,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  inputRowFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceMuted,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSizes.body,
    color: colors.text,
  },
  eyeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
