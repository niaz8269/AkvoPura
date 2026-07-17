/**
 * OwnerCombinedScreen — leaderboard-style comparison across all branches.
 *
 * For each KPI: one row per branch, ranked; a trophy marks the leader.
 * Supports N branches (works with 2 through 10+).
 */

import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useAllBranchStats } from '../useBranchList';
import type { BranchSummary } from '../types';

export function OwnerCombinedScreen() {
  const { stats, loading, refreshing, error, refresh } = useAllBranchStats();

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <Text style={styles.title}>Branch comparison</Text>
        <Text style={styles.intro}>
          Today's numbers across {stats.length} branch{stats.length === 1 ? '' : 'es'}.
          Best on each metric is marked with a trophy.
        </Text>

        {loading && stats.length === 0 ? (
          <View style={styles.centerPad}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={20} color={colors.danger} />
            <Text style={styles.errorMsg}>{error}</Text>
          </View>
        ) : null}

        {stats.length < 2 && !loading ? (
          <View style={styles.emptyCard}>
            <Ionicons name="git-compare-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Need at least 2 branches to compare</Text>
            <Text style={styles.emptySub}>Add more branches from Manage Branches.</Text>
          </View>
        ) : null}

        {stats.length >= 2 ? (
          <>
            <MetricBlock title="Cash collected" stats={stats} pick={(s) => s.cashCollectedToday} format="rupees" />
            <MetricBlock title="Amount billed" stats={stats} pick={(s) => s.amountBilledToday} format="rupees" />
            <MetricBlock title="Pets bills" stats={stats} pick={(s) => s.petsBills} />
            <MetricBlock title="600 ml packs sold" stats={stats} pick={(s) => s.pet600PacksSold} />
            <MetricBlock title="1.5 L packs sold" stats={stats} pick={(s) => s.pet1500PacksSold} />
            <MetricBlock title="C/G deliveries" stats={stats} pick={(s) => s.cgDeliveries} />
            <MetricBlock title="Cans delivered" stats={stats} pick={(s) => s.cansDelivered} />
            <MetricBlock title="Gallons delivered" stats={stats} pick={(s) => s.gallonsDelivered} />
            <MetricBlock title="Empty cans collected" stats={stats} pick={(s) => s.emptyCansCollected} />
            <MetricBlock title="Total customers" stats={stats} pick={(s) => s.customerCount} />
            <MetricBlock title="Customers in debt" stats={stats} pick={(s) => s.customersInDebt} lowerIsBetter />
            <MetricBlock title="At risk (30+ days)" stats={stats} pick={(s) => s.customersAtRisk} lowerIsBetter />
            <MetricBlock title="Total outstanding" stats={stats} pick={(s) => s.totalDebt} format="rupees" lowerIsBetter />
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function MetricBlock({
  title,
  stats,
  pick,
  format = 'number',
  lowerIsBetter,
}: {
  title: string;
  stats: BranchSummary[];
  pick: (s: BranchSummary) => number;
  format?: 'number' | 'rupees';
  lowerIsBetter?: boolean;
}) {
  const fmt = (n: number) =>
    format === 'rupees' ? `Rs ${n.toLocaleString()}` : n.toLocaleString();

  const rows = stats
    .map((s) => ({ s, v: pick(s) }))
    .sort((a, b) => (lowerIsBetter ? a.v - b.v : b.v - a.v));

  // Winner = only distinct top value gets a trophy (ties → no trophy)
  const bestValue = rows[0]?.v;
  const nextValue = rows[1]?.v;
  const hasClearWinner = rows.length > 1 && bestValue !== nextValue;

  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      <View style={styles.blockBody}>
        {rows.map((row, i) => {
          const isWinner = i === 0 && hasClearWinner;
          return (
            <View
              key={row.s.key}
              style={[styles.metricRow, i === rows.length - 1 ? styles.metricRowLast : null]}
            >
              <View style={styles.metricLeft}>
                {isWinner ? (
                  <Ionicons name="trophy" size={16} color="#B58200" />
                ) : (
                  <View style={{ width: 16 }} />
                )}
                <Text style={[styles.metricBranch, isWinner ? styles.metricBranchWin : null]}>
                  {row.s.name.en}
                </Text>
              </View>
              <Text style={[styles.metricValue, isWinner ? styles.metricValueWin : null]}>
                {fmt(row.v)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSizes.heading, fontWeight: '800', color: colors.primaryDark },
  intro: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginVertical: spacing.md,
    lineHeight: 20,
  },
  centerPad: { padding: spacing.xxl, alignItems: 'center' },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger + '18',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorMsg: { fontSize: fontSizes.sm, color: colors.danger, fontWeight: '700', flex: 1 },
  emptyCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: fontSizes.body, fontWeight: '800', color: colors.primaryDark, marginTop: spacing.sm },
  emptySub: { fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 4 },

  block: { marginBottom: spacing.md },
  blockTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  blockBody: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metricRowLast: { borderBottomWidth: 0 },
  metricLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  metricBranch: { fontSize: fontSizes.body, fontWeight: '700', color: colors.text },
  metricBranchWin: { color: colors.primaryDark },
  metricValue: { fontSize: fontSizes.body, fontWeight: '800', color: colors.text },
  metricValueWin: { color: colors.success },
});
