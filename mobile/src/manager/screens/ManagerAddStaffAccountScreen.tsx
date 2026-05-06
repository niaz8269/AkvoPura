/**
 * ManagerAddStaffAccountScreen — create a new login account.
 *
 * Manager can only create non-owner / non-manager accounts inside their
 * own branch. The backend re-enforces the rule, so the form is just a
 * convenience filter.
 */

import React, { useEffect, useState } from 'react';
import {
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
import { createUser } from '../../api/users';
import { listBranches, type ApiBranch } from '../../api/branches';
import { ApiError } from '../../api/client';
import type { Branch, Role } from '../../auth/types';


const ASSIGNABLE_ROLES: { key: Role; label: string }[] = [
  { key: 'pets_salesman', label: 'Pets Salesman' },
  { key: 'cans_gallons_salesman', label: 'Cans / Gallons Salesman' },
  { key: 'production_worker', label: 'Production Worker' },
  { key: 'driver', label: 'Driver' },
  { key: 'helper', label: 'Helper' },
  { key: 'other', label: 'Other' },
  { key: 'customer', label: 'Customer' },
];

const OWNER_ROLES: { key: Role; label: string }[] = [
  { key: 'manager', label: 'Manager' },
  ...ASSIGNABLE_ROLES,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ManagerAddStaffAccountScreen({ navigation }: any) {
  const { user: me } = useAuth();
  const isOwner = me?.role === 'owner';
  const roles = isOwner ? OWNER_ROLES : ASSIGNABLE_ROLES;

  const [branches, setBranches] = useState<ApiBranch[]>([]);
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('cans_gallons_salesman');
  const [branch, setBranch] = useState<Branch>(
    (me?.branch as Branch | undefined) ?? 'timergara',
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listBranches()
      .then((bs) => {
        const active = bs.filter((b) => b.active);
        setBranches(active);
        if (active.length > 0 && !active.some((b) => b.slug === branch)) {
          setBranch(active[0].slug);
        }
      })
      .catch(() => {
        /* dropdown stays empty — backend label below */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const valid =
    identifier.trim().length >= 2 &&
    name.trim().length >= 2 &&
    password.length >= 4;

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const created = await createUser({
        identifier: identifier.trim(),
        name: name.trim(),
        password,
        role,
        branchSlug: branch,
      });
      Alert.alert(
        'Account created',
        `${created.name} can log in with @${created.identifier}.`,
      );
      navigation.goBack();
    } catch (e: unknown) {
      const msg =
        e instanceof ApiError
          ? e.message || e.code
          : 'Unknown error';
      Alert.alert('Could not create account', msg);
    } finally {
      setSubmitting(false);
    }
  };

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
          <Text style={styles.fieldLabel}>Login identifier *</Text>
          <Text style={styles.hint}>Letters, digits, underscore, dot, hyphen. e.g. <Text style={styles.mono}>cans3</Text></Text>
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="cans3"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.mono]}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.fieldLabel}>Full name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Zubair Khan"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.fieldLabel}>Initial password *</Text>
          <Text style={styles.hint}>At least 4 characters. They can change it after login.</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.mono]}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={false}
          />

          <Text style={styles.fieldLabel}>Role *</Text>
          <View style={styles.segmentRow}>
            {roles.map((r) => {
              const active = r.key === role;
              return (
                <Pressable
                  key={r.key}
                  onPress={() => setRole(r.key)}
                  style={({ pressed }) => [
                    styles.segment,
                    active ? styles.segmentActive : null,
                    pressed && !active ? { opacity: 0.7 } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      active ? styles.segmentTextActive : null,
                    ]}
                  >
                    {r.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Branch *</Text>
          {!isOwner ? (
            <View style={styles.lockedNote}>
              <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
              <Text style={styles.lockedNoteText}>
                You can only create accounts in your own branch ({branch}).
              </Text>
            </View>
          ) : branches.length === 0 ? (
            <Text style={styles.hint}>Loading branches…</Text>
          ) : (
            <View style={styles.segmentRow}>
              {branches.map((b) => {
                const active = b.slug === branch;
                return (
                  <Pressable
                    key={b.slug}
                    onPress={() => setBranch(b.slug)}
                    style={({ pressed }) => [
                      styles.segment,
                      active ? styles.segmentActive : null,
                      pressed && !active ? { opacity: 0.7 } : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        active ? styles.segmentTextActive : null,
                      ]}
                    >
                      {b.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <BilingualButton
            label={{
              en: submitting ? 'Creating…' : 'Create account',
              ur: 'اکاؤنٹ بنائیں',
            }}
            onPress={submit}
            disabled={!valid || submitting}
            style={{ marginTop: spacing.lg }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, paddingBottom: spacing.xl },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: spacing.md,
  },
  hint: { fontSize: fontSizes.xs, color: colors.textMuted, marginBottom: 6 },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }) },
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
  segmentText: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.primaryDark },
  segmentTextActive: { color: colors.textInverse },
  lockedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  lockedNoteText: {
    flex: 1,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
