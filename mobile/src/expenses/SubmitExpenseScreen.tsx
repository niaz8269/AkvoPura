/**
 * SubmitExpenseScreen — shared form used by Pets + Cans/Gallons salesmen
 * to log a field expense (fuel, food, repairs, etc.) for manager approval.
 *
 * Fields: category (chip picker), amount (+/- stepper for round numbers,
 * with a TextInput fallback for arbitrary values), optional note. Submits
 * with the logged-in user's name + role. Manager sees the new entry on
 * their Expenses tab as 'pending'.
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

import { BilingualButton, Screen } from '../components';
import { colors, fontSizes, radii, spacing } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { useManager } from '../manager/state';
import { expenseCategoryLabels } from '../manager/demoData';
import type { ExpenseCategory } from '../manager/types';

const CATEGORY_ICONS: Record<ExpenseCategory, keyof typeof Ionicons.glyphMap> = {
  fuel: 'car-outline',
  food: 'restaurant-outline',
  repairs: 'build-outline',
  utilities: 'flash-outline',
  salary: 'cash-outline',
  raw_material: 'cube-outline',
  other: 'ellipsis-horizontal-outline',
};

const CATEGORIES: ExpenseCategory[] = [
  'fuel',
  'food',
  'repairs',
  'utilities',
  'raw_material',
  'other',
];

export function SubmitExpenseScreen({ navigation }: any) {
  const { user } = useAuth();
  const { submitExpense } = useManager();

  const [category, setCategory] = useState<ExpenseCategory>('fuel');
  const [amountStr, setAmountStr] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const amount = Number(amountStr) || 0;
  const valid = amount > 0;

  const submit = async () => {
    if (!user || !valid) return;
    setSubmitting(true);
    try {
      await submitExpense({
        submittedBy: user.name,
        submittedByRole:
          user.role === 'pets_salesman' || user.role === 'cans_gallons_salesman'
            ? user.role
            : 'manager',
        category,
        amount,
        notes: notes.trim() || undefined,
      });
      Alert.alert(
        'Expense submitted',
        `Rs ${amount.toLocaleString()} sent to your manager for approval.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not submit';
      Alert.alert('Submit failed', msg);
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
          <Text style={styles.intro}>
            Log a field expense (fuel, food, repairs, etc.). Your manager will
            see it on their Expenses tab and can approve, reject, or forward
            to the owner if it's high value.
          </Text>

          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map((c) => {
              const active = c === category;
              const label = expenseCategoryLabels[c];
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={({ pressed }) => [
                    styles.catChip,
                    active ? styles.catChipActive : null,
                    pressed && !active ? { opacity: 0.7 } : null,
                  ]}
                >
                  <Ionicons
                    name={CATEGORY_ICONS[c]}
                    size={16}
                    color={active ? colors.textInverse : colors.primaryDark}
                  />
                  <Text style={[styles.catText, active ? styles.catTextActive : null]}>
                    {label.en}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Amount</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountCurrency}>Rs</Text>
            <TextInput
              value={amountStr}
              onChangeText={(t) => setAmountStr(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              maxLength={7}
            />
          </View>

          <View style={styles.quickAmounts}>
            {[100, 500, 1000, 2000, 5000].map((n) => (
              <Pressable
                key={n}
                onPress={() => setAmountStr(String(n))}
                style={({ pressed }) => [
                  styles.quickAmount,
                  pressed ? { opacity: 0.7 } : null,
                ]}
              >
                <Text style={styles.quickAmountText}>+{n}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Diesel — bypass pump"
            placeholderTextColor={colors.textMuted}
            style={styles.notesInput}
            multiline
            numberOfLines={2}
          />

          <BilingualButton
            label={{ en: 'Submit for approval', ur: 'منظوری کے لیے بھیجیں' }}
            onPress={submit}
            disabled={!valid || submitting}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  intro: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  catText: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.primaryDark },
  catTextActive: { color: colors.textInverse },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  amountCurrency: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.textMuted,
  },
  amountInput: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.heading,
    fontWeight: '900',
    color: colors.primaryDark,
    textAlign: 'right',
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  quickAmount: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  quickAmountText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  notesInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSizes.body,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
});
