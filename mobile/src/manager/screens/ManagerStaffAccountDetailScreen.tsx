/**
 * ManagerStaffAccountDetailScreen — view + edit a single staff account.
 *
 * Receives userId via route params, fetches fresh data on focus.
 * Manager can: rename, change role/branch (subject to backend rules),
 * deactivate, reactivate, and reset password.
 *
 * The backend re-checks all permissions, so the form mostly mirrors what
 * the API will accept.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BilingualButton, Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../api/client';
import { listUsers, resetUserPassword, updateUser, type ApiUser } from '../../api/users';
import { listBranches, type ApiBranch } from '../../api/branches';
import type { Branch, Role } from '../../auth/types';

// React Navigation's strict generics don't compose with hand-rolled
// Route/Nav types — match the rest of this app and accept loose props.

const ROLE_OPTIONS: { key: Role; label: string }[] = [
  { key: 'manager', label: 'Manager' },
  { key: 'pets_salesman', label: 'Pets' },
  { key: 'cans_gallons_salesman', label: 'C/G' },
  { key: 'production_worker', label: 'Production' },
  { key: 'driver', label: 'Driver' },
  { key: 'helper', label: 'Helper' },
  { key: 'other', label: 'Other' },
  { key: 'customer', label: 'Customer' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ManagerStaffAccountDetailScreen({ route }: any) {
  const userId: string = route.params.userId;
  const { user: me } = useAuth();
  const isOwner = me?.role === 'owner';

  const [branches, setBranches] = useState<ApiBranch[]>([]);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('cans_gallons_salesman');
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset password modal
  const [resetVisible, setResetVisible] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [resetting, setResetting] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      // No GET /users/:id yet — pull from list filter and find.
      const all = await listUsers();
      const u = all.find((x) => x.id === userId);
      if (!u) {
        setError('User not found (or out of your scope).');
        return;
      }
      setUser(u);
      setName(u.name);
      setRole(u.role);
      setBranch(u.branchSlug);
    } catch (e: unknown) {
      const msg =
        e instanceof ApiError
          ? e.code === 'network_error'
            ? 'Cannot reach the server. Check Wi-Fi.'
            : `Server error: ${e.message}`
          : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
    listBranches()
      .then((bs) => setBranches(bs.filter((b) => b.active)))
      .catch(() => setBranches([]));
  }, [load]);

  const dirty =
    user !== null &&
    (name.trim() !== user.name || role !== user.role || branch !== user.branchSlug);

  // Manager cannot edit owner / manager rows at all (backend enforces).
  const isReadOnly = !isOwner && (user?.role === 'owner' || user?.role === 'manager');

  const save = async () => {
    if (!user || !dirty) return;
    setSaving(true);
    try {
      const updated = await updateUser(user.id, {
        name: name.trim(),
        role,
        branchSlug: branch,
      });
      setUser(updated);
      Alert.alert('Saved', 'Account updated.');
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message || e.code : 'Unknown error';
      Alert.alert('Save failed', msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!user) return;
    const turningOff = user.active;
    if (turningOff && user.id === me?.id) {
      Alert.alert('Not allowed', 'You cannot deactivate your own account.');
      return;
    }
    Alert.alert(
      turningOff ? 'Deactivate account?' : 'Reactivate account?',
      turningOff
        ? `${user.name} will not be able to log in until you reactivate.`
        : `${user.name} will be able to log in again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: turningOff ? 'Deactivate' : 'Reactivate',
          style: turningOff ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const updated = await updateUser(user.id, { active: !user.active });
              setUser(updated);
            } catch (e: unknown) {
              const msg = e instanceof ApiError ? e.message || e.code : 'Unknown error';
              Alert.alert('Failed', msg);
            }
          },
        },
      ],
    );
  };

  const submitReset = async () => {
    if (!user || newPw.length < 4) return;
    setResetting(true);
    try {
      await resetUserPassword(user.id, newPw);
      Alert.alert('Password reset', `New password set for ${user.name}.`);
      setResetVisible(false);
      setNewPw('');
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message || e.code : 'Unknown error';
      Alert.alert('Reset failed', msg);
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error || !user) {
    return (
      <Screen>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
          <Text style={styles.errorText}>{error ?? 'User not loaded.'}</Text>
          <Pressable
            onPress={load}
            style={({ pressed }) => [
              styles.retryBtn,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <View style={styles.identifierBlock}>
            <Text style={styles.identifierLabel}>Login as</Text>
            <Text style={styles.identifierVal}>@{user.identifier}</Text>
          </View>

          {!user.active ? (
            <View style={styles.deactivatedBanner}>
              <Ionicons name="warning" size={16} color={colors.warning} />
              <Text style={styles.deactivatedText}>Account is deactivated</Text>
            </View>
          ) : null}

          {isReadOnly ? (
            <View style={styles.lockedNote}>
              <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
              <Text style={styles.lockedNoteText}>
                Only the owner can edit owner / manager accounts.
              </Text>
            </View>
          ) : null}

          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={[styles.input, isReadOnly ? styles.inputLocked : null]}
            autoCapitalize="words"
            editable={!isReadOnly}
          />

          <Text style={styles.fieldLabel}>Role</Text>
          <View style={styles.segmentRow}>
            {ROLE_OPTIONS.map((r) => {
              const active = r.key === role;
              const disabled =
                isReadOnly ||
                (!isOwner && (r.key === 'owner' || r.key === 'manager'));
              return (
                <Pressable
                  key={r.key}
                  onPress={() => !disabled && setRole(r.key)}
                  style={({ pressed }) => [
                    styles.segment,
                    active ? styles.segmentActive : null,
                    disabled ? styles.segmentDisabled : null,
                    pressed && !active && !disabled ? { opacity: 0.7 } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      active ? styles.segmentTextActive : null,
                      disabled ? styles.segmentTextDisabled : null,
                    ]}
                  >
                    {r.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Branch</Text>
          <View style={styles.segmentRow}>
            {branches.map((b) => {
              const active = b.slug === branch;
              const disabled = isReadOnly || (!isOwner && b.slug !== me?.branch);
              return (
                <Pressable
                  key={b.slug}
                  onPress={() => !disabled && setBranch(b.slug)}
                  style={({ pressed }) => [
                    styles.segment,
                    active ? styles.segmentActive : null,
                    disabled ? styles.segmentDisabled : null,
                    pressed && !active && !disabled ? { opacity: 0.7 } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      active ? styles.segmentTextActive : null,
                      disabled ? styles.segmentTextDisabled : null,
                    ]}
                  >
                    {b.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <BilingualButton
            label={{
              en: saving ? 'Saving…' : 'Save changes',
            }}
            onPress={save}
            disabled={!dirty || saving || isReadOnly}
            style={{ marginTop: spacing.lg }}
          />

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => setResetVisible(true)}
              disabled={isReadOnly}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionBtnNeutral,
                isReadOnly ? { opacity: 0.4 } : null,
                pressed && !isReadOnly ? { opacity: 0.85 } : null,
              ]}
            >
              <Ionicons name="key-outline" size={18} color={colors.primaryDark} />
              <Text style={styles.actionBtnText}>Reset password</Text>
            </Pressable>

            <Pressable
              onPress={toggleActive}
              disabled={isReadOnly}
              style={({ pressed }) => [
                styles.actionBtn,
                user.active ? styles.actionBtnDanger : styles.actionBtnSuccess,
                isReadOnly ? { opacity: 0.4 } : null,
                pressed && !isReadOnly ? { opacity: 0.85 } : null,
              ]}
            >
              <Ionicons
                name={user.active ? 'lock-closed-outline' : 'lock-open-outline'}
                size={18}
                color={user.active ? colors.danger : colors.success}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: user.active ? colors.danger : colors.success },
                ]}
              >
                {user.active ? 'Deactivate' : 'Reactivate'}
              </Text>
            </Pressable>
          </View>

          {resetVisible ? (
            <View style={styles.resetCard}>
              <Text style={styles.resetTitle}>Set a new password</Text>
              <TextInput
                value={newPw}
                onChangeText={setNewPw}
                placeholder="At least 4 characters"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
              <View style={styles.resetBtnRow}>
                <Pressable
                  onPress={() => {
                    setResetVisible(false);
                    setNewPw('');
                  }}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.actionBtnNeutral,
                    pressed ? { opacity: 0.85 } : null,
                  ]}
                >
                  <Text style={styles.actionBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={submitReset}
                  disabled={newPw.length < 4 || resetting}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.actionBtnPrimary,
                    newPw.length < 4 || resetting ? { opacity: 0.4 } : null,
                    pressed && newPw.length >= 4 ? { opacity: 0.85 } : null,
                  ]}
                >
                  <Text style={[styles.actionBtnText, { color: colors.textInverse }]}>
                    {resetting ? 'Resetting…' : 'Reset'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  errorText: { color: colors.danger, fontSize: fontSizes.sm, marginTop: spacing.md, textAlign: 'center' },
  retryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  retryBtnText: { color: colors.textInverse, fontWeight: '800' },

  body: { padding: spacing.lg, paddingBottom: spacing.xl },

  identifierBlock: {
    backgroundColor: colors.primary + '12',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  identifierLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  identifierVal: {
    fontSize: fontSizes.title,
    fontWeight: '900',
    color: colors.primaryDark,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },

  deactivatedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.warning + '22',
    padding: spacing.sm,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  deactivatedText: { color: colors.warning, fontWeight: '800', fontSize: fontSizes.sm },

  lockedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  lockedNoteText: { flex: 1, fontSize: fontSizes.xs, color: colors.textMuted, fontStyle: 'italic' },

  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: fontSizes.body,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  inputLocked: { backgroundColor: colors.border + '40', color: colors.textMuted },

  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 4 },
  segment: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
  },
  segmentActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  segmentDisabled: { backgroundColor: colors.border + '40', borderColor: colors.border },
  segmentText: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.primaryDark },
  segmentTextActive: { color: colors.textInverse },
  segmentTextDisabled: { color: colors.textMuted },

  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  actionBtnNeutral: {
    backgroundColor: colors.surface,
    borderColor: colors.primaryLight,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  actionBtnDanger: {
    backgroundColor: colors.danger + '12',
    borderColor: colors.danger,
  },
  actionBtnSuccess: {
    backgroundColor: colors.success + '12',
    borderColor: colors.success,
  },
  actionBtnText: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.primaryDark },

  resetCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  resetTitle: { fontSize: fontSizes.body, fontWeight: '800', color: colors.primaryDark, marginBottom: spacing.sm },
  resetBtnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
