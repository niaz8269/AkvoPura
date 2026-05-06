/**
 * OwnerEditBranchScreen — owner edits branch details (name, Urdu name,
 * location, active flag). Slug is immutable.
 */

import React, { useEffect, useState } from 'react';
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
import { ApiError } from '../../api/client';
import { listBranches, updateBranch, type ApiBranch } from '../../api/branches';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function OwnerEditBranchScreen({ route }: any) {
  const slug: string = route.params.slug;

  const [branch, setBranch] = useState<ApiBranch | null>(null);
  const [name, setName] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const all = await listBranches();
        const b = all.find((x) => x.slug === slug);
        if (!b) {
          setError('Branch not found.');
          return;
        }
        setBranch(b);
        setName(b.name);
        setNameUr(b.nameUr ?? '');
        setLocation(b.location ?? '');
      } catch (e: unknown) {
        const msg = e instanceof ApiError ? e.message || e.code : 'Unknown error';
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const dirty =
    branch !== null &&
    (name.trim() !== branch.name ||
      nameUr.trim() !== (branch.nameUr ?? '') ||
      location.trim() !== (branch.location ?? ''));

  const save = async () => {
    if (!branch || !dirty) return;
    setSaving(true);
    try {
      const updated = await updateBranch(branch.slug, {
        name: name.trim(),
        nameUr: nameUr.trim() || undefined,
        location: location.trim() || undefined,
      });
      setBranch(updated);
      Alert.alert('Saved', 'Branch updated.');
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message || e.code : 'Unknown error';
      Alert.alert('Save failed', msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!branch) return;
    const turningOff = branch.active;
    Alert.alert(
      turningOff ? 'Deactivate branch?' : 'Reactivate branch?',
      turningOff
        ? `${branch.name} will be hidden from new staff-account dropdowns. Existing accounts assigned to it keep working.`
        : `${branch.name} will be selectable again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: turningOff ? 'Deactivate' : 'Reactivate',
          style: turningOff ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const updated = await updateBranch(branch.slug, {
                active: !branch.active,
              });
              setBranch(updated);
            } catch (e: unknown) {
              const msg = e instanceof ApiError ? e.message || e.code : 'Unknown error';
              Alert.alert('Failed', msg);
            }
          },
        },
      ],
    );
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
  if (error || !branch) {
    return (
      <Screen>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
          <Text style={styles.errorText}>{error ?? 'Branch not loaded'}</Text>
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
        >
          <View style={styles.slugBlock}>
            <Text style={styles.slugLabel}>Slug</Text>
            <Text style={styles.slugVal}>@{branch.slug}</Text>
            <Text style={styles.slugHint}>Identifier — cannot be changed</Text>
          </View>

          {!branch.active ? (
            <View style={styles.deactivatedBanner}>
              <Ionicons name="warning" size={16} color={colors.warning} />
              <Text style={styles.deactivatedText}>Branch is deactivated</Text>
            </View>
          ) : null}

          <Text style={styles.fieldLabel}>Name (English)</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.fieldLabel}>Name (Urdu)</Text>
          <TextInput
            value={nameUr}
            onChangeText={setNameUr}
            placeholder="e.g. پشاور"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>Location</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Saddar Road, Peshawar"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { minHeight: 50, textAlignVertical: 'top' }]}
            multiline
          />

          <BilingualButton
            label={{ en: saving ? 'Saving…' : 'Save changes', ur: 'محفوظ کریں' }}
            onPress={save}
            disabled={!dirty || saving}
            style={{ marginTop: spacing.lg }}
          />

          <Pressable
            onPress={toggleActive}
            style={({ pressed }) => [
              styles.toggleBtn,
              branch.active ? styles.toggleBtnDanger : styles.toggleBtnSuccess,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Ionicons
              name={branch.active ? 'lock-closed-outline' : 'lock-open-outline'}
              size={18}
              color={branch.active ? colors.danger : colors.success}
            />
            <Text
              style={[
                styles.toggleBtnText,
                { color: branch.active ? colors.danger : colors.success },
              ]}
            >
              {branch.active ? 'Deactivate branch' : 'Reactivate branch'}
            </Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  errorText: { color: colors.danger, marginTop: spacing.md, textAlign: 'center' },

  body: { padding: spacing.lg, paddingBottom: spacing.xl },

  slugBlock: {
    backgroundColor: colors.primary + '12',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  slugLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  slugVal: {
    fontSize: fontSizes.title,
    fontWeight: '900',
    color: colors.primaryDark,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  slugHint: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },

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

  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    marginTop: spacing.md,
  },
  toggleBtnDanger: { backgroundColor: colors.danger + '12', borderColor: colors.danger },
  toggleBtnSuccess: { backgroundColor: colors.success + '12', borderColor: colors.success },
  toggleBtnText: { fontSize: fontSizes.sm, fontWeight: '800' },
});
