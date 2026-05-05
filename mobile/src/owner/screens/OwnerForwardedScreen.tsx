/**
 * OwnerForwardedScreen — high-value expenses the Manager forwarded.
 *
 * Owner takes the final decision (approve / reject — no further forwarding).
 */

import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useManager } from '../../manager/state';
import { expenseCategoryLabels } from '../../manager/demoData';
import type { Expense } from '../../manager/types';

export function OwnerForwardedScreen() {
  const { expenses, decideExpense } = useManager();

  const forwarded = useMemo(
    () => expenses.filter((e) => e.status === 'forwarded'),
    [expenses]
  );

  const decidedByOwner = useMemo(
    () =>
      expenses
        .filter(
          (e) =>
            (e.status === 'approved' || e.status === 'rejected') &&
            e.amount >= 5_000 &&
            e.decidedAt
        )
        .sort((a, b) => (b.decidedAt ?? 0) - (a.decidedAt ?? 0))
        .slice(0, 10),
    [expenses]
  );

  const totalForwarded = forwarded.reduce((s, e) => s + e.amount, 0);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Forwarded for approval</Text>
        <Text style={styles.titleUr}>منظوری کے لیے بھیجے گئے</Text>

        <View style={styles.kpiRow}>
          <KpiCard label="Awaiting you" value={forwarded.length} />
          <KpiCard
            label="Total forwarded"
            value={`Rs ${totalForwarded.toLocaleString()}`}
            wide
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <SectionTitle text={`Awaiting decision (${forwarded.length})`} />
        {forwarded.length === 0 ? (
          <EmptyCard text="Nothing forwarded right now. The Manager hasn't pushed anything to you for review." />
        ) : (
          forwarded.map((e) => (
            <ForwardedCard
              key={e.id}
              expense={e}
              onDecide={(decision) => decideExpense(e.id, decision)}
            />
          ))
        )}

        <SectionTitle text="Recent decisions by you" />
        {decidedByOwner.length === 0 ? (
          <EmptyCard text="No decisions yet." />
        ) : (
          decidedByOwner.map((e) => <RecentRow key={e.id} expense={e} />)
        )}
      </ScrollView>
    </Screen>
  );
}

function ForwardedCard({
  expense,
  onDecide,
}: {
  expense: Expense;
  onDecide: (decision: 'approved' | 'rejected') => void;
}) {
  const cat = expenseCategoryLabels[expense.category];

  const confirm = (decision: 'approved' | 'rejected') => {
    const verb = decision === 'approved' ? 'Approve' : 'Reject';
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
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.catChip, { backgroundColor: colors.primary + '22' }]}>
          <Text style={styles.catChipText}>{cat.en}</Text>
        </View>
        <View style={styles.forwardedChip}>
          <Ionicons name="arrow-up-circle" size={12} color={colors.info} />
          <Text style={styles.forwardedChipText}>Forwarded</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={styles.time}>{formatTime(expense.submittedAt)}</Text>
      </View>

      <Text style={styles.amount}>Rs {expense.amount.toLocaleString()}</Text>
      <Text style={styles.submitter}>by {expense.submittedBy}</Text>
      {expense.notes ? <Text style={styles.notes}>{expense.notes}</Text> : null}

      <View style={styles.actionRow}>
        <Pressable
          onPress={() => confirm('approved')}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.approveBtn,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
          <Text style={[styles.actionText, { color: colors.success }]}>Approve</Text>
        </Pressable>
        <Pressable
          onPress={() => confirm('rejected')}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.rejectBtn,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Ionicons name="close-circle-outline" size={20} color={colors.danger} />
          <Text style={[styles.actionText, { color: colors.danger }]}>Reject</Text>
        </Pressable>
      </View>
    </View>
  );
}

function RecentRow({ expense }: { expense: Expense }) {
  const cat = expenseCategoryLabels[expense.category];
  const isApproved = expense.status === 'approved';
  const color = isApproved ? colors.success : colors.danger;
  const label = isApproved ? 'Approved' : 'Rejected';

  return (
    <View style={[styles.recentRow, { borderLeftColor: color }]}>
      <View style={[styles.statusChip, { backgroundColor: color + '22' }]}>
        <Text style={[styles.statusChipText, { color }]}>{label}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.recentName}>
          {expense.submittedBy} • {cat.en}
        </Text>
        <Text style={styles.recentSub}>
          Rs {expense.amount.toLocaleString()}
          {expense.notes ? ` • ${expense.notes}` : ''}
        </Text>
      </View>
      {expense.decidedAt ? (
        <Text style={styles.recentTime}>{formatTime(expense.decidedAt)}</Text>
      ) : null}
    </View>
  );
}

function SectionTitle({ text }: { text: string }) {
  return <Text style={styles.sectionTitle}>{text}</Text>;
}

function EmptyCard({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

function KpiCard({
  label,
  value,
  wide,
}: {
  label: string;
  value: number | string;
  wide?: boolean;
}) {
  return (
    <View style={[styles.kpi, wide ? styles.kpiWide : null]}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: 4,
    paddingBottom: 4,
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
  kpiValue: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  kpiLabel: { fontSize: fontSizes.xs, color: colors.textMuted },

  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  empty: {
    fontStyle: 'italic',
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    paddingVertical: spacing.lg,
    textAlign: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.info,
  },
  cardHeader: {
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
  forwardedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.info + '22',
  },
  forwardedChipText: { fontSize: 10, fontWeight: '800', color: colors.info },
  time: { fontSize: fontSizes.xs, color: colors.textMuted },
  amount: {
    fontSize: fontSizes.heading,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  submitter: { fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
  notes: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    paddingLeft: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
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
  approveBtn: { borderColor: colors.success, backgroundColor: colors.success + '15' },
  rejectBtn: { borderColor: colors.danger, backgroundColor: colors.danger + '15' },
  actionText: { fontSize: fontSizes.sm, fontWeight: '800' },

  recentRow: {
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
  recentName: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.text },
  recentSub: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  recentTime: { fontSize: fontSizes.xs, color: colors.textMuted },
});
