/**
 * OwnerExpenseAnalyticsScreen — owner-only breakdown of approved expenses
 * over a chosen period (today / this week / this month / this year).
 *
 * All numbers are derived from the same ManagerProvider expense list the
 * dashboard uses, so no new API endpoint is needed. "Other" category is
 * shown as a separate line (owner withdrawal) so plant expense totals
 * stay clean.
 */

import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useManager } from '../../manager/state';
import { expenseCategoryLabels } from '../../manager/demoData';
import { isOwnerWithdrawal, type ExpenseCategory } from '../../manager/types';

type Period = 'today' | 'week' | 'month' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Today',
  week: 'This week',
  month: 'This month',
  year: 'This year',
};

function periodStart(period: Period): number {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'today') return d.getTime();
  if (period === 'week') {
    // Start of week = Monday
    const dow = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dow);
    return d.getTime();
  }
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return new Date(now.getFullYear(), 0, 1).getTime();
}

function previousPeriodStart(period: Period): number {
  const now = new Date();
  if (period === 'today') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    return d.getTime();
  }
  if (period === 'week') {
    const d = new Date(periodStart('week'));
    d.setDate(d.getDate() - 7);
    return d.getTime();
  }
  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  }
  return new Date(now.getFullYear() - 1, 0, 1).getTime();
}

function previousPeriodEnd(period: Period): number {
  return periodStart(period);
}

export function OwnerExpenseAnalyticsScreen() {
  const { expenses } = useManager();
  const [period, setPeriod] = useState<Period>('month');

  const stats = useMemo(() => {
    const cur = expenses.filter(
      (e) => e.status === 'approved' && e.submittedAt >= periodStart(period),
    );
    const prev = expenses.filter(
      (e) =>
        e.status === 'approved' &&
        e.submittedAt >= previousPeriodStart(period) &&
        e.submittedAt < previousPeriodEnd(period),
    );

    const plantTotal = cur
      .filter((e) => !isOwnerWithdrawal(e.category))
      .reduce((s, e) => s + e.amount, 0);
    const otherTotal = cur
      .filter((e) => isOwnerWithdrawal(e.category))
      .reduce((s, e) => s + e.amount, 0);
    const total = plantTotal + otherTotal;

    const prevTotal = prev.reduce((s, e) => s + e.amount, 0);
    const change = prevTotal === 0 ? null : ((total - prevTotal) / prevTotal) * 100;

    const byCategory: Record<string, number> = {};
    cur.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    });
    const categoryRows = (Object.entries(byCategory) as [ExpenseCategory, number][])
      .sort((a, b) => b[1] - a[1]);

    return { plantTotal, otherTotal, total, prevTotal, change, categoryRows, count: cur.length };
  }, [expenses, period]);

  return (
    <Screen scroll>
      <Text style={styles.title}>Expense analytics</Text>
      <Text style={styles.intro}>
        Approved expenses only. "Owner withdrawal" (Other category) is shown
        separately so plant profit stays clean.
      </Text>

      <View style={styles.periodRow}>
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => {
          const active = p === period;
          return (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={({ pressed }) => [
                styles.periodPill,
                active ? styles.periodPillActive : null,
                pressed && !active ? { opacity: 0.85 } : null,
              ]}
            >
              <Text style={[styles.periodPillText, active ? styles.periodPillTextActive : null]}>
                {PERIOD_LABELS[p]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total spent · {PERIOD_LABELS[period].toLowerCase()}</Text>
        <Text style={styles.summaryValue}>Rs {stats.total.toLocaleString()}</Text>
        <Text style={styles.summarySub}>{stats.count} approved expense{stats.count === 1 ? '' : 's'}</Text>
        {stats.change !== null ? (
          <Text
            style={[
              styles.changeText,
              stats.change > 0 ? styles.changeUp : styles.changeDown,
            ]}
          >
            {stats.change > 0 ? '▲' : '▼'} {Math.abs(stats.change).toFixed(1)}% vs previous {period}
          </Text>
        ) : null}
      </View>

      <View style={styles.splitRow}>
        <View style={[styles.splitCard, styles.splitPlant]}>
          <Text style={styles.splitLabel}>Plant expenses</Text>
          <Text style={styles.splitValue}>Rs {stats.plantTotal.toLocaleString()}</Text>
          <Text style={styles.splitHint}>Operational cost — deducted from profit</Text>
        </View>
        <View style={[styles.splitCard, styles.splitOther]}>
          <Text style={styles.splitLabel}>Owner withdrawals</Text>
          <Text style={styles.splitValue}>Rs {stats.otherTotal.toLocaleString()}</Text>
          <Text style={styles.splitHint}>"Other" — personal, not a plant cost</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Breakdown by category</Text>
      {stats.categoryRows.length === 0 ? (
        <Text style={styles.empty}>No approved expenses in this period.</Text>
      ) : (
        stats.categoryRows.map(([cat, amount]) => {
          const pct = stats.total === 0 ? 0 : (amount / stats.total) * 100;
          const isOwner = isOwnerWithdrawal(cat);
          return (
            <View key={cat} style={styles.catRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.catLabel}>
                  {expenseCategoryLabels[cat]?.en ?? cat}
                  {isOwner ? <Text style={styles.catBadge}>  · withdrawal</Text> : null}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${pct}%` },
                      isOwner ? styles.barFillOwner : null,
                    ]}
                  />
                </View>
              </View>
              <View style={styles.catRight}>
                <Text style={styles.catAmount}>Rs {amount.toLocaleString()}</Text>
                <Text style={styles.catPct}>{pct.toFixed(1)}%</Text>
              </View>
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSizes.heading, fontWeight: '800', color: colors.primaryDark },
  intro: { fontSize: fontSizes.sm, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg, lineHeight: 20 },
  periodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.lg },
  periodPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
  },
  periodPillActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  periodPillText: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.primaryDark },
  periodPillTextActive: { color: colors.textInverse },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryLabel: { color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.sm, fontWeight: '600' },
  summaryValue: { color: colors.textInverse, fontSize: 36, fontWeight: '900', marginTop: 4 },
  summarySub: { color: 'rgba(255,255,255,0.75)', fontSize: fontSizes.xs, marginTop: 4 },
  changeText: { fontSize: fontSizes.xs, fontWeight: '800', marginTop: spacing.sm },
  changeUp: { color: '#FFD8A8' },
  changeDown: { color: '#C6F6D5' },
  splitRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  splitCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md },
  splitPlant: { borderLeftWidth: 4, borderLeftColor: colors.primary },
  splitOther: { borderLeftWidth: 4, borderLeftColor: colors.accent },
  splitLabel: { fontSize: fontSizes.xs, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  splitValue: { fontSize: fontSizes.title, fontWeight: '900', color: colors.primaryDark, marginTop: 4 },
  splitHint: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  sectionTitle: { fontSize: fontSizes.body, fontWeight: '800', color: colors.primaryDark, marginTop: spacing.md, marginBottom: spacing.sm },
  empty: { color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: spacing.xl },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.sm },
  catLabel: { fontSize: fontSizes.body, fontWeight: '700', color: colors.text },
  catBadge: { fontSize: fontSizes.xs, color: colors.accent, fontWeight: '700' },
  barTrack: { height: 6, backgroundColor: colors.surfaceMuted, borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
  barFillOwner: { backgroundColor: colors.accent },
  catRight: { alignItems: 'flex-end' },
  catAmount: { fontSize: fontSizes.body, fontWeight: '800', color: colors.primaryDark },
  catPct: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
});
