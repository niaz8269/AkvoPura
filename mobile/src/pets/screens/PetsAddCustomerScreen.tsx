/**
 * PetsAddCustomerScreen — manual entry for a new Pets customer.
 *
 * Pets prices stay flexible at bill time, so we don't ask for per-customer
 * price overrides here. Bills will use the owner-set defaults unless the
 * salesman tweaks them on the fly while billing.
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
import { usePetsSalesman } from '../state';

type Nav = { goBack: () => void };

export function PetsAddCustomerScreen({ navigation }: { navigation: Nav }) {
  const { addCustomer } = usePetsSalesman();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [notes, setNotes] = useState('');

  const valid =
    name.trim().length >= 2 &&
    phone.trim().length >= 4 &&
    address.trim().length >= 2 &&
    area.trim().length >= 2;

  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const created = await addCustomer({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        area: area.trim(),
        notes: notes.trim() || undefined,
      });
      Alert.alert('Customer added', `${created.name} added.`);
      navigation.goBack();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not save';
      Alert.alert('Save failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.fieldLabel}>Name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Al-Madina General Store"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.fieldLabel}>Phone *</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="0300-1234567"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            keyboardType="phone-pad"
          />

          <Text style={styles.fieldLabel}>Address *</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="e.g. Bazaar Chowk, Timergara"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { minHeight: 50, textAlignVertical: 'top' }]}
            multiline
          />

          <Text style={styles.fieldLabel}>Area *</Text>
          <TextInput
            value={area}
            onChangeText={setArea}
            placeholder="e.g. Bazaar / School Road / Domestic"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Pays weekly on Friday"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { minHeight: 50, textAlignVertical: 'top' }]}
            multiline
          />

          <Text style={styles.flexNote}>
            💧 Pet pack prices stay flexible — adjust per bill while selling.
          </Text>

          <BilingualButton
            label={{
              en: submitting ? 'Adding…' : 'Add customer',
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
    marginBottom: 2,
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
  flexNote: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
});
