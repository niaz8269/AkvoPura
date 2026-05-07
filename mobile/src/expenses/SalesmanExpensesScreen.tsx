/**
 * SalesmanExpensesScreen — the salesman's own expense history with a
 * + FAB to submit a new one. Used by both Pets and CG salesman flows.
 *
 * Status chips:
 *   pending   — awaiting manager
 *   approved  — manager approved
 *   rejected  — manager rejected (rejection reason in decisionNote)
 *   forwarded — manager escalated to owner
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { Screen } from '../components';
import { colors, fontSizes, radii, spacing } from '../theme';
import { listMyExpenses } from '../api/expenses';
import { ApiError } from '../api/client';
import type { Expense, ExpenseStatus } from '../manager/types';

const CATEGORY_LABELS: Record<string, string> = {
  fuel: 'Fuel',
  food: 'Food',
  repairs: 'Repairs',
  utilities: 'Utilities',
  salary: 'Salary',
  raw_material: 'Raw material',
  other: 'Other',
};

const STATUS_TONE: Record<ExpenseStatus, 'warn' | 'success' | 'danger' | 'info'> = {
  pending: 'warn',
  approved: 'success',
  rejected: 'danger',
  forwarded: 'info',
};

const STATUS_LABEL: Record<ExpenseStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  forwarded: 'Forwarded to Owner',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SalesmanExpensesScreen({ navigation }: any) {
  const tabBarHeight = useBottomTabBarHeight();
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setExpenses(await listMyExpenses());
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
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading && !expenses) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your expenses…</Text>
        </View>
      </Screen>
    );
  }

  const pendingCount = expenses?.filter((e) => e.status === 'pending').length ?? 0;
  const approvedTotal = expenses
    ?.filter((e) => e.status === 'approved')
    .reduce((s, e) => s + e.amount, 0) ?? 0;

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>My expenses</Text>
        <Text style={styles.titleUr}>میرے اخراجات</Text>
        <View style={styles.kpiRow}>
          <View style={styles.kpi}>
            <Text style={[styles.kpiValue, pendingCount > 0 ? styles.kpiValueWarn : null]}>
              {pendingCount}
            </Text>
            <Text style={styles.kpiLabel}>Pending</Text>
          </View>
          <View style={[styles.kpi, styles.kpiWide]}>
            <Text style={[styles.kpiValue, styles.kpiValueSuccess]}>
              Rs {approvedTotal.toLocaleString()}
            </Text>
            <Text style={styles.kpiLabel}>Approved total</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: tabBarHeight + 80 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={20} color={colors.danger} />
            <Text style={styles.errorMsg}>{error}</Text>
          </View>
        ) : null}

        {expenses && expenses.length === 0 ? (
          <Text style={styles.empty}>
            No expenses yet. Tap the + button to submit one.
          </Text>
        ) : null}

        {expenses?.map((e) => (
          <View key={e.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.category}>{CATEGORY_LABELS[e.category] ?? e.category}</Text>
              <View
                style={[styles.statusChip, statusChipStyle(STATUS_TONE[e.status])]}
              >
                <Text style={[styles.statusChipText, statusChipTextStyle(STATUS_TONE[e.status])]}>
                  {STATUS_LABEL[e.status]}
                </Text>
              </View>
            </View>
            <Text style={styles.amount}>Rs {e.amount.toLocaleString()}</Text>
            {e.notes ? <Text style={styles.notes}>{e.notes}</Text> : null}
            <Text style={styles.metaLine}>
              Submitted {formatDate(e.submittedAt)}
              {e.decidedAt ? ` · Decided ${formatDate(e.decidedAt)}` : ''}
            </Text>
            {e.decisionNote ? (
              <View style={styles.decisionNote}>
                <Ionicons name="chatbubble-ellipses" size={12} color={colors.textMuted} />
                <Text style={styles.decisionNoteText}>{e.decisionNote}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <Pressable
        onPress={() => navigation.navigate('SubmitExpense')}
        style={({ pressed }) => [
          styles.fab,
          { bottom: tabBarHeight + spacing.md },
          pressed ? { opacity: 0.85 } : null,
        ]}
        accessibilityLabel="Submit new expense"
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </Pressable>
    </Screen>
  );
}

function statusChipStyle(tone: 'warn' | 'success' | 'danger' | 'info') {
  switch (tone) {
    case 'success': return { backgroundColor: colors.success + '22' };
    case 'warn':    return { backgroundColor: colors.warning + '22' };
    case 'danger':  return { backgroundColor: colors.danger + '22' };
    case 'info':    return { backgroundColor: colors.info + '22' };
  }
}
function statusChipTextStyle(tone: 'warn' | 'success' | 'danger' | 'info') {
  switch (tone) {
    case 'success': return { color: colors.success };
    case 'warn':    return { color: colors.warning };
    case 'danger':  return { color: colors.danger };
    case 'info':    return { color: colors.info };
  }
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.textMuted, fontSize: fontSizes.sm },

  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },
  titleUr: { fontSize: fontSizes.body, color: colors.primary, marginTop: 2 },
  kpiRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  kpi: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  kpiWide: { flex: 2 },
  kpiValue: { fontSize: fontSizes.title, fontWeight: '900', color: colors.primaryDark },
  kpiValueWarn: { color: colors.warning },
  kpiValueSuccess: { color: colors.success },
  kpiLabel: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },

  body: { padding: spacing.lg },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger + '18',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorMsg: { fontSize: fontSizes.sm, color: colors.danger, fontWeight: '700' },

  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xl,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  category: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  statusChipText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  amount: {
    fontSize: fontSizes.heading,
    fontWeight: '900',
    color: colors.text,
    marginTop: 4,
  },
  notes: { fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 4 },
  metaLine: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: spacing.sm },
  decisionNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.md,
  },
  decisionNoteText: {
    fontSize: fontSizes.xs,
    color: colors.text,
    fontStyle: 'italic',
    flex: 1,
  },

  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
