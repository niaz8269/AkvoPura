/**
 * ChangeMyPasswordScreen — self-service password change.
 *
 * Available to every role. Asks for current password (server verifies it),
 * then new password twice (client double-checks they match before submit).
 * Server enforces min 6 chars; client mirrors that for a clean Save button.
 */

import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BilingualButton, Screen, TextField } from '../components';
import { colors, fontSizes, spacing } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { changeMyPassword } from '../api/users';
import { ApiError } from '../api/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ChangeMyPasswordScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const matches = next.length > 0 && next === confirm;
  const valid =
    current.length >= 1 &&
    next.length >= 6 &&
    confirm.length >= 6 &&
    matches;

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await changeMyPassword(current, next);
      Alert.alert(
        'Password changed',
        'Use your new password the next time you log in.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (e: unknown) {
      const msg =
        e instanceof ApiError
          ? e.status === 401
            ? 'Current password is wrong.'
            : e.message || e.code
          : 'Unknown error';
      Alert.alert('Could not change password', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Change your password</Text>
          <Text style={styles.introSub}>
            Signed in as <Text style={styles.userPill}>{user?.identifier}</Text>
          </Text>
        </View>

        <TextField
          label={{ en: 'Current password' }}
          value={current}
          onChangeText={setCurrent}
          placeholder="Your existing password"
          secureTextEntry
          autoComplete="current-password"
        />

        <TextField
          label={{ en: 'New password' }}
          value={next}
          onChangeText={setNext}
          placeholder="At least 6 characters"
          secureTextEntry
          autoComplete="new-password"
        />

        <TextField
          label={{ en: 'Confirm new password' }}
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Type the new password again"
          secureTextEntry
        />

        {confirm.length > 0 && !matches ? (
          <Text style={styles.warn}>Passwords don't match.</Text>
        ) : null}

        <BilingualButton
          label={{ en: submitting ? 'Saving…' : 'Save new password' }}
          onPress={submit}
          disabled={!valid || submitting}
          style={{ marginTop: spacing.lg }}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.lg },
  introTitle: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  introSub: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  userPill: {
    fontWeight: '800',
    color: colors.primaryDark,
  },
  warn: {
    color: colors.danger,
    fontSize: fontSizes.sm,
    marginTop: -spacing.md,
    marginBottom: spacing.md,
  },
});
