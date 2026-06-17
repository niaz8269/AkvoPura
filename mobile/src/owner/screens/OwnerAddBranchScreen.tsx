/**
 * OwnerAddBranchScreen — owner creates a new branch.
 *
 * Slug must be lowercase letters, digits, underscore or hyphen — used in
 * URLs and FK refs. Name is the human-readable label, nameUr is the
 * optional Urdu label, location is a free-text address.
 */

import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

import { BilingualButton, Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { ApiError } from '../../api/client';
import { createBranch } from '../../api/branches';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function OwnerAddBranchScreen({ navigation }: any) {
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const valid =
    slug.trim().length >= 2 &&
    /^[a-z0-9_-]+$/.test(slug.trim()) &&
    name.trim().length >= 2;

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const created = await createBranch({
        slug: slug.trim().toLowerCase(),
        name: name.trim(),
        nameUr: nameUr.trim() || undefined,
        location: location.trim() || undefined,
      });
      Alert.alert('Branch created', `${created.name} (${created.slug}) is ready.`);
      navigation.goBack();
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message || e.code : 'Unknown error';
      Alert.alert('Could not create branch', msg);
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
        >
          <Text style={styles.fieldLabel}>Slug *</Text>
          <Text style={styles.hint}>
            Short identifier — lowercase letters, digits, _ or -. Used in URLs
            and cannot be changed later. e.g. <Text style={styles.mono}>peshawar</Text>
          </Text>
          <TextInput
            value={slug}
            onChangeText={(t) => setSlug(t.replace(/[^a-z0-9_-]/gi, '').toLowerCase())}
            placeholder="peshawar"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.mono]}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.fieldLabel}>Name (English) *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Peshawar"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.fieldLabel}>Name (Urdu)</Text>
          <TextInput
            value={nameUr}
            onChangeText={setNameUr}
            placeholder="e.g. "
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>Location (optional)</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Saddar Road, Peshawar Cantt"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { minHeight: 50, textAlignVertical: 'top' }]}
            multiline
          />

          <BilingualButton
            label={{
              en: submitting ? 'Creating…' : 'Create branch',
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
});
