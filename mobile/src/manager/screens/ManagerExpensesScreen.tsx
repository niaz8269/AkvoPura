/**
 * ManagerExpensesScreen — approval inbox for expense submissions.
 *
 * Each pending expense is a card with submitter, category, amount, notes,
 * and three actions: Approve / Forward (to Owner, for high-value items) /
 * Reject. Decided expenses move to a "Recent decisions" list below.
 */

import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useManager } from '../state';
import { HIGH_VALUE_THRESHOLD, expenseCategoryLabels } from '../demoData';
import type { Expense } from '../types';

export function ManagerExpensesScreen() {
  const { expenses, pendingExpenses, decideExpense } = useManager();

  const decided = useMemo(
    () =>
      [...expenses]
        .filter((e) => e.status !== 'pending')
        .sort((a, b) => (b.decidedAt ?? 0) - (a.decidedAt ?? 0))
        .slice(0, 10),
    [expenses]
  );

  const totalPending = pendingExpenses.reduce((s, e) => s + e.amount, 0);
  const highValueCount = pendingExpenses.filter((e) => e.amount >= HIGH_VALUE_THRESHOLD).length;

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Expense approvals</Text>
        <Text style={styles.titleUr}>اخراجات کی منظوری</Text>

        <View style={styles.kpiRow}>
          <KpiCard label="Pending" value={pendingExpenses.length} />
          <KpiCard
            label="Total pending"
            value={`Rs ${totalPending.toLocaleString()}`}
            wide
          />
          {highValueCount > 0 ? (
            <KpiCard label="High value" value={highValueCount} highlight="warn" />
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <SectionTitle text={`Pending (${pendingExpenses.length})`} subtitle="منظوری کا انتظار" />
        {pendingExpenses.length === 0 ? (
          <EmptyCard text="No pending expenses. You're all caught up." />
        ) : (
          pendingExpenses.map((e) => (
            <PendingCard
              key={e.id}
              expense={e}
              onDecide={(decision, note) => {
                decideExpense(e.id, decision, note);
              }}
            />
          ))
        )}

        <SectionTitle text="Recent decisions" subtitle="حالیہ فیصلے" />
        {decided.length === 0 ? (
          <EmptyCard text="No decisions yet." />
        ) : (
          decided.map((e) => <DecidedCard key={e.id} expense={e} />)
        )}
      </ScrollView>
    </Screen>
  );
}

function PendingCard({
  expense,
  onDecide,
}: {
  expense: Expense;
  onDecide: (decision: 'approved' | 'rejected' | 'forwarded', note?: string) => void;
}) {
  const isHighValue = expense.amount >= HIGH_VALUE_THRESHOLD;
  const cat = expenseCategoryLabels[expense.category];

  const confirm = (decision: 'approved' | 'rejected' | 'forwarded') => {
    const verb =
      decision === 'approved' ? 'Approve' : decision === 'rejected' ? 'Reject' : 'Forward to Owner';
    Alert.alert(
      verb + '?',
      `${expense.submittedBy} • Rs ${expense.amount.toLocaleString()} • ${cat.en}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: verb,
          style: decision === 'rejected' ? 'destructive' : 'default',
          onPress: () => onDecide(decision),
        },
      ]
    );
  };

  return (
    <View style={[styles.expCard, isHighValue ? styles.expCardHigh : null]}>
      <View style={styles.expHeader}>
        <View style={[styles.catChip, { backgroundColor: colors.primary + '22' }]}>
          <Text style={styles.catChipText}>{cat.en}</Text>
        </View>
        {isHighValue ? (
          <View style={styles.highChip}>
            <Ionicons name="alert-outline" size={12} color={colors.warning} />
            <Text style={styles.highChipText}>High value</Text>
          </View>
        ) : null}
        <View style={{ flex: 1 }} />
        <Text style={styles.expTime}>{formatTime(expense.submittedAt)}</Text>
      </View>

      <Text style={styles.expAmount}>Rs {expense.amount.toLocaleString()}</Text>
      <Text style={styles.expSubmitter}>by {expense.submittedBy}</Text>
      {expense.notes ? <Text style={styles.expNotes}>{expense.notes}</Text> : null}

      <View style={styles.actionRow}>
        <ActionBtn
          variant="approve"
          icon="checkmark-circle-outline"
          label="Approve"
          onPress={() => confirm('approved')}
        />
        {isHighValue ? (
          <ActionBtn
            variant="forward"
            icon="arrow-up-circle-outline"
            label="Forward"
            onPress={() => confirm('forwarded')}
          />
        ) : null}
        <ActionBtn
          variant="reject"
          icon="close-circle-outline"
          label="Reject"
          onPress={() => confirm('rejected')}
        />
      </View>
    </View>
  );
}

function ActionBtn({
  variant,
  icon,
  label,
  onPress,
}: {
  variant: 'approve' | 'reject' | 'forward';
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const v = ACTION_STYLES[variant];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed ? { opacity: 0.85 } : null,
      ]}
    >
      <Ionicons name={icon} size={20} color={v.color} />
      <Text style={[styles.actionText, { color: v.color }]}>{label}</Text>
    </Pressable>
  );
}

function DecidedCard({ expense }: { expense: Expense }) {
  const cat = expenseCategoryLabels[expense.category];
  const v = STATUS_STYLES[expense.status];
  return (
    <View style={[styles.decidedRow, { borderLeftColor: v.color }]}>
      <View style={[styles.statusChip, { backgroundColor: v.bg }]}>
        <Text style={[styles.statusChipText, { color: v.color }]}>{v.label}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.decidedName} numberOfLines={1}>
          {expense.submittedBy} • {cat.en}
        </Text>
        <Text style={styles.decidedSub}>
          Rs {expense.amount.toLocaleString()}
          {expense.notes ? ` • ${expense.notes}` : ''}
        </Text>
      </View>
      {expense.decidedAt ? (
        <Text style={styles.decidedTime}>{formatTime(expense.decidedAt)}</Text>
      ) : null}
    </View>
  );
}

function SectionTitle({ text, subtitle }: { text: string; subtitle?: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.sectionTitle}>{text}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function EmptyCard({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

function KpiCard({
  label,
  value,
  highlight,
  wide,
}: {
  label: string;
  value: number | string;
  highlight?: 'warn';
  wide?: boolean;
}) {
  return (
    <View
      style={[
        styles.kpi,
        wide ? styles.kpiWide : null,
        highlight === 'warn' ? styles.kpiWarn : null,
      ]}
    >
      <Text
        style={[
          styles.kpiValue,
          highlight === 'warn' ? styles.kpiValueWarn : null,
        ]}
      >
        {value}
      </Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const ACTION_STYLES = {
  approve: { bg: colors.success + '15', color: colors.success, border: colors.success },
  reject: { bg: colors.danger + '15', color: colors.danger, border: colors.danger },
  forward: { bg: colors.info + '15', color: colors.info, border: colors.info },
};

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  approved: { label: 'Approved', bg: colors.success + '22', color: colors.success },
  rejected: { label: 'Rejected', bg: colors.danger + '22', color: colors.danger },
  forwarded: { label: 'Forwarded', bg: colors.info + '22', color: colors.info },
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },
  titleUr: { fontSize: fontSizes.body, color: colors.primary, marginBottom: spacing.md },
  kpiRow: { flexDirection: 'row', gap: spacing.sm },
  kpi: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  kpiWide: { flex: 2 },
  kpiWarn: { backgroundColor: colors.warning + '15' },
  kpiValue: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  kpiValueWarn: { color: colors.warning },
  kpiLabel: { fontSize: fontSizes.xs, color: colors.textMuted },

  body: { padding: spacing.lg, paddingBottom: spacing.xxxl },

  sectionTitleWrap: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: fontSizes.body, fontWeight: '800', color: colors.primaryDark },
  sectionSubtitle: { fontSize: fontSizes.xs, color: colors.textMuted },

  expCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expCardHigh: {
    borderColor: colors.warning,
    borderWidth: 1.5,
  },
  expHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  catChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  catChipText: { fontSize: 10, fontWeight: '800', color: colors.primaryDark },
  highChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.warning + '22',
  },
  highChipText: { fontSize: 10, fontWeight: '800', color: colors.warning },
  expTime: { fontSize: fontSizes.xs, color: colors.textMuted },
  expAmount: {
    fontSize: fontSizes.heading,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  expSubmitter: { fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
  expNotes: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    paddingLeft: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  actionText: { fontSize: fontSizes.sm, fontWeight: '800' },

  decidedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
  },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    minWidth: 76,
    alignItems: 'center',
  },
  statusChipText: { fontSize: 10, fontWeight: '800' },
  decidedName: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.text },
  decidedSub: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  decidedTime: { fontSize: fontSizes.xs, color: colors.textMuted },

  empty: {
    fontStyle: 'italic',
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    paddingVertical: spacing.lg,
    textAlign: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
  },
});
