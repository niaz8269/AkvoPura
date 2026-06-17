/**
 * ManagerAddEmployeeScreen — create a new HR employee record.
 *
 * Note: this is SEPARATE from creating a staff login account
 * (ManagerAddStaffAccountScreen). An Employee row tracks attendance +
 * salary; a User row controls login. They can optionally be linked.
 */

import React, { useState } from 'react';
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
import { useEmployees } from '../../employees/state';
import { ApiError } from '../../api/client';
import type { EmployeeRole, EmploymentType } from '../../employees/types';

const ROLES: { key: EmployeeRole; label: string }[] = [
  { key: 'pets_salesman', label: 'Pets Salesman' },
  { key: 'cans_gallons_salesman', label: 'Cans / Gallons Salesman' },
  { key: 'production_worker', label: 'Production Worker' },
  { key: 'driver', label: 'Driver' },
  { key: 'helper', label: 'Helper' },
  { key: 'other', label: 'Other' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ManagerAddEmployeeScreen({ navigation }: any) {
  const { user: me } = useAuth();
  const { addEmployee } = useEmployees();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<EmployeeRole>('driver');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('salaried');
  const [salaryStr, setSalaryStr] = useState('');
  const [hourlyStr, setHourlyStr] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const branch = me?.branch as 'timergara' | 'shergarh' | undefined;

  const valid =
    name.trim().length >= 2 &&
    phone.trim().length >= 4 &&
    !!branch &&
    (employmentType === 'salaried'
      ? Number(salaryStr) > 0
      : Number(hourlyStr) > 0);

  const submit = async () => {
    if (!valid || submitting || !branch) return;
    setSubmitting(true);
    try {
      await addEmployee({
        name: name.trim(),
        phone: phone.trim(),
        role,
        branch,
        employmentType,
        monthlySalary:
          employmentType === 'salaried' ? Number(salaryStr) : undefined,
        hourlyRate:
          employmentType === 'hourly' ? Number(hourlyStr) : undefined,
        notes: notes.trim() || undefined,
      });
      Alert.alert(
        'Employee added',
        `${name.trim()} is now in your branch's employee list.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message || e.code : 'Unknown error';
      Alert.alert('Could not save', msg);
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
          <View style={styles.intro}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.introText}>
              Adds an HR record only. To give them app login access, also
              create a Staff Account from the Team tab.
            </Text>
          </View>

          <Text style={styles.label}>FULL NAME *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Akbar Khan"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.label}>PHONE *</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="0300-1234567"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>ROLE *</Text>
          <View style={styles.pillRow}>
            {ROLES.map((r) => {
              const active = r.key === role;
              return (
                <Pressable
                  key={r.key}
                  onPress={() => setRole(r.key)}
                  style={({ pressed }) => [
                    styles.pill,
                    active ? styles.pillActive : null,
                    pressed && !active ? { opacity: 0.7 } : null,
                  ]}
                >
                  <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>
                    {r.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>EMPLOYMENT TYPE *</Text>
          <View style={styles.pillRow}>
            {(['salaried', 'hourly'] as EmploymentType[]).map((t) => {
              const active = t === employmentType;
              return (
                <Pressable
                  key={t}
                  onPress={() => setEmploymentType(t)}
                  style={({ pressed }) => [
                    styles.pill,
                    active ? styles.pillActive : null,
                    pressed && !active ? { opacity: 0.7 } : null,
                  ]}
                >
                  <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>
                    {t === 'salaried' ? 'Monthly salary' : 'Hourly wage'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {employmentType === 'salaried' ? (
            <>
              <Text style={styles.label}>MONTHLY SALARY (Rs) *</Text>
              <TextInput
                value={salaryStr}
                onChangeText={(t) => setSalaryStr(t.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 30000"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                keyboardType="number-pad"
                maxLength={7}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>HOURLY RATE (Rs) *</Text>
              <TextInput
                value={hourlyStr}
                onChangeText={(t) => setHourlyStr(t.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 200"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                keyboardType="number-pad"
                maxLength={5}
              />
            </>
          )}

          <Text style={styles.label}>NOTES (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Joined June 2026, lives near plant"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.textarea]}
            multiline
            numberOfLines={3}
          />

          <View style={styles.branchInfo}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
            <Text style={styles.branchInfoText}>
              Will be added to <Text style={{ fontWeight: '800' }}>{branch ?? 'your branch'}</Text>
            </Text>
          </View>

          <BilingualButton
            label={{
              en: submitting ? 'Saving…' : 'Add employee',
              ur: 'ملازم شامل کریں',
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
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primary + '12',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  introText: { flex: 1, fontSize: fontSizes.xs, color: colors.text, lineHeight: 18 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: fontSizes.body,
    color: colors.text,
  },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  pillText: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.primaryDark },
  pillTextActive: { color: colors.textInverse },
  branchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
  },
  branchInfoText: { fontSize: fontSizes.xs, color: colors.textMuted, fontStyle: 'italic' },
});
