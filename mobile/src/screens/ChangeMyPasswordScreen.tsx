/**
 * ChangeMyPasswordScreen — self-service account settings for the logged-in
 * user (any role). Two sections:
 *
 *   1. Change username (identifier)
 *   2. Change password
 *
 * Each section takes the CURRENT password as a guard — protects against a
 * stolen-phone scenario where someone could rewrite the login credentials
 * without knowing the old ones.
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
import { colors, fontSizes, radii, spacing } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { changeMyPassword, changeMyIdentifier } from '../api/users';
import { ApiError } from '../api/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ChangeMyPasswordScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();

  // Username section
  const [uCurrentPassword, setUCurrentPassword] = useState('');
  const [newIdentifier, setNewIdentifier] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

  // Password section
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const usernameChanged =
    newIdentifier.trim().length > 0 && newIdentifier.trim() !== user?.identifier;
  const usernameValid =
    uCurrentPassword.length >= 1 &&
    newIdentifier.trim().length >= 3 &&
    usernameChanged;

  const passwordMatches = next.length > 0 && next === confirm;
  const passwordValid =
    current.length >= 1 && next.length >= 6 && confirm.length >= 6 && passwordMatches;

  const submitUsername = async () => {
    if (!usernameValid || savingUsername) return;
    setSavingUsername(true);
    try {
      const res = await changeMyIdentifier(uCurrentPassword, newIdentifier.trim());
      Alert.alert(
        'Username changed',
        `Your username is now "${res.identifier}". Use it the next time you log in.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (e: unknown) {
      const msg =
        e instanceof ApiError
          ? e.status === 401
            ? 'Current password is wrong.'
            : e.message || e.code
          : 'Unknown error';
      Alert.alert('Could not change username', msg);
    } finally {
      setSavingUsername(false);
    }
  };

  const submitPassword = async () => {
    if (!passwordValid || savingPassword) return;
    setSavingPassword(true);
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
      setSavingPassword(false);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Account settings</Text>
          <Text style={styles.introSub}>
            Signed in as <Text style={styles.userPill}>{user?.identifier}</Text>
          </Text>
        </View>

        {/* ---- Change username ---- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Change username</Text>
          <Text style={styles.cardHint}>
            Pick something short and easy to remember. Must be at least 3 characters and unique.
          </Text>

          <TextField
            label={{ en: 'New username' }}
            value={newIdentifier}
            onChangeText={setNewIdentifier}
            placeholder={user?.identifier ?? 'e.g. imran123'}
            autoCapitalize="none"
            autoComplete="username"
          />

          <TextField
            label={{ en: 'Current password (to confirm)' }}
            value={uCurrentPassword}
            onChangeText={setUCurrentPassword}
            placeholder="Your existing password"
            secureTextEntry
            autoComplete="current-password"
          />

          <BilingualButton
            label={{ en: savingUsername ? 'Saving…' : 'Save username' }}
            onPress={submitUsername}
            disabled={!usernameValid || savingUsername}
          />
          {newIdentifier.trim() === user?.identifier && newIdentifier.length > 0 ? (
            <Text style={styles.info}>
              That's your current username — enter a different one to change it.
            </Text>
          ) : null}
        </View>

        {/* ---- Change password ---- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Change password</Text>
          <Text style={styles.cardHint}>
            At least 6 characters. Type the same password twice to confirm.
          </Text>

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

          {confirm.length > 0 && !passwordMatches ? (
            <Text style={styles.warn}>Passwords don't match.</Text>
          ) : null}

          <BilingualButton
            label={{ en: savingPassword ? 'Saving…' : 'Save new password' }}
            onPress={submitPassword}
            disabled={!passwordValid || savingPassword}
          />
        </View>

        <View style={styles.forgotBox}>
          <Text style={styles.forgotTitle}>Forgot your login?</Text>
          <Text style={styles.forgotText}>
            {user?.role === 'owner'
              ? 'Contact your app administrator to reset the owner account.'
              : user?.role === 'manager'
                ? 'Ask your Owner to reset your login — they can do it in under a minute from their Managers screen.'
                : 'Ask your branch Manager to reset your login — they can do it in under a minute from their Team screen.'}
          </Text>
        </View>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  cardHint: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  warn: {
    color: colors.danger,
    fontSize: fontSizes.sm,
    marginTop: -spacing.md,
    marginBottom: spacing.md,
  },
  info: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  forgotBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  forgotTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 4,
  },
  forgotText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
