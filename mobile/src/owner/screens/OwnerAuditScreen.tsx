/**
 * OwnerAuditScreen — chronological log of every important action.
 *
 * Filters: All / Sales / Expenses / by branch.
 * Each row: kind chip (color-coded), summary, actor, time, optional amount.
 */

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useOwnerData } from '../computed';
import type { AuditLogItem, AuditLogKind } from '../types';

type Filter = 'all' | 'sales' | 'expenses';

const SALES_KINDS: AuditLogKind[] = ['cg_delivery', 'cg_collection', 'pets_bill', 'pets_return'];
const EXPENSE_KINDS: AuditLogKind[] = [
  'expense_submitted',
  'expense_approved',
  'expense_rejected',
  'expense_forwarded',
];

export function OwnerAuditScreen() {
  const { auditLog } = useOwnerData();
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(() => {
    if (filter === 'sales') return auditLog.filter((a) => SALES_KINDS.includes(a.kind));
    if (filter === 'expenses') return auditLog.filter((a) => EXPENSE_KINDS.includes(a.kind));
    return auditLog;
  }, [auditLog, filter]);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Audit log</Text>
        <Text style={styles.titleUr}>کاروائی کا ریکارڈ</Text>

        <View style={styles.filterRow}>
          {(['all', 'sales', 'expenses'] as Filter[]).map((f) => {
            const active = f === filter;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={({ pressed }) => [
                  styles.filterPill,
                  active ? styles.filterPillActive : null,
                  pressed && !active ? styles.filterPillPressed : null,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    active ? styles.filterPillTextActive : null,
                  ]}
                >
                  {FILTER_LABELS[f]}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.countLine}>
          {visible.length} entries shown — most recent first
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {visible.length === 0 ? (
          <Text style={styles.empty}>No audit entries yet for this filter.</Text>
        ) : (
          visible.map((item) => <Row key={item.id} item={item} />)
        )}
      </ScrollView>
    </Screen>
  );
}

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  sales: 'Sales',
  expenses: 'Expenses',
};

function Row({ item }: { item: AuditLogItem }) {
  const meta = KIND_META[item.kind];
  return (
    <View style={styles.row}>
      <View style={[styles.kindIconWrap, { backgroundColor: meta.color + '22' }]}>
        <Ionicons name={meta.icon} size={18} color={meta.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.summary} numberOfLines={2}>
          {item.summary}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.actor}>{item.actor}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.timeText}>{formatTimeFull(item.ts)}</Text>
          {item.amount !== undefined ? (
            <>
              <Text style={styles.metaDot}>•</Text>
              <Text style={[styles.amount, { color: meta.color }]}>
                Rs {item.amount.toLocaleString()}
              </Text>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const KIND_META: Record<
  AuditLogKind,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  cg_delivery: { icon: 'cube-outline', color: colors.primary },
  cg_collection: { icon: 'archive-outline', color: colors.warning },
  pets_bill: { icon: 'cash-outline', color: colors.accent },
  pets_return: { icon: 'return-down-back-outline', color: colors.danger },
  expense_submitted: { icon: 'add-circle-outline', color: colors.textMuted },
  expense_approved: { icon: 'checkmark-circle-outline', color: colors.success },
  expense_rejected: { icon: 'close-circle-outline', color: colors.danger },
  expense_forwarded: { icon: 'arrow-up-circle-outline', color: colors.info },
};

function formatTimeFull(ts: number) {
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
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  filterPillPressed: { backgroundColor: colors.surfaceMuted },
  filterPillText: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.primaryDark },
  filterPillTextActive: { color: colors.textInverse },
  countLine: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: spacing.sm },

  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  empty: {
    fontStyle: 'italic',
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    paddingVertical: spacing.xl,
    textAlign: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  kindIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: { fontSize: fontSizes.sm, color: colors.text, lineHeight: 20 },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  actor: { fontSize: fontSizes.xs, fontWeight: '700', color: colors.primaryDark },
  metaDot: { fontSize: fontSizes.xs, color: colors.textMuted, marginHorizontal: 2 },
  timeText: { fontSize: fontSizes.xs, color: colors.textMuted },
  amount: { fontSize: fontSizes.xs, fontWeight: '800' },
});
