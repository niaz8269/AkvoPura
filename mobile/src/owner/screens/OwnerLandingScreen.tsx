/**
 * OwnerLandingScreen — main Owner home.
 *
 * Fetches the branch list from /branches and renders one card per branch
 * with live stats. Pull-to-refresh triggers a fresh fetch across the board.
 * Managing branches (add, edit, deactivate) is one tap away.
 */

import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
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
import type { BranchKey, BranchSummary } from '../types';

const brandLogo = require('../../../assets/brand/akvopura-brand.png');

type Nav = {
  navigate: (screen: string, params?: { branch: BranchKey; name?: string }) => void;
};

export function OwnerLandingScreen({ navigation }: { navigation: Nav }) {
  const { stats, loading, refreshing, error, refresh } = useAllBranchStats();

  const totalCash = stats.reduce((s, b) => s + b.cashCollectedToday, 0);
  const totalDebt = stats.reduce((s, b) => s + b.totalDebt, 0);
  const totalDeliveries = stats.reduce((s, b) => s + b.cgDeliveries, 0);
  const totalBills = stats.reduce((s, b) => s + b.petsBills, 0);

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <View style={styles.brandRow}>
          <Image source={brandLogo} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={styles.brandTitle}>AkvoPura</Text>
            <Text style={styles.brandSub}>Owner Console</Text>
          </View>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Today across all branches</Text>
          <Text style={styles.totalValue}>Rs {totalCash.toLocaleString()}</Text>
          <View style={styles.totalSubRow}>
            <Text style={styles.totalSub}>{totalDeliveries} C/G deliveries</Text>
            <Text style={styles.totalSub}>•</Text>
            <Text style={styles.totalSub}>{totalBills} Pets bills</Text>
          </View>
          {totalDebt > 0 ? (
            <View style={styles.debtChip}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
              <Text style={styles.debtChipText}>
                Rs {totalDebt.toLocaleString()} outstanding
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.branchesHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Branches</Text>
            <Text style={styles.sectionSubtitle}>
              {stats.length === 0
                ? 'Add your first branch to get started'
                : ` — tap to drill in`}
            </Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={20} color={colors.danger} />
            <Text style={styles.errorMsg}>{error}</Text>
          </View>
        ) : null}

        {loading && stats.length === 0 ? (
          <View style={styles.centerPad}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : stats.length === 0 && !error ? (
          <Pressable
            onPress={() => navigation.navigate('ManageBranches')}
            style={({ pressed }) => [
              styles.emptyCard,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Ionicons name="add-circle" size={40} color={colors.primary} />
            <Text style={styles.emptyTitle}>Add your first branch</Text>
            <Text style={styles.emptySub}>
              You need at least one branch to start receiving deliveries and bills.
            </Text>
          </Pressable>
        ) : (
          stats.map((s) => (
            <BranchButton
              key={s.key}
              summary={s}
              onPress={() =>
                navigation.navigate('BranchOverview', { branch: s.key, name: s.name.en })
              }
            />
          ))
        )}

        {stats.length >= 2 ? (
          <Pressable
            onPress={() => navigation.navigate('Combined')}
            style={({ pressed }) => [
              styles.combinedBtn,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Ionicons name="git-compare-outline" size={22} color={colors.primaryDark} />
            <View style={{ flex: 1 }}>
              <Text style={styles.combinedTitle}>Compare all branches</Text>
              <Text style={styles.combinedSub}>Side-by-side numbers</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primaryDark} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => navigation.navigate('ManageBranches')}
          style={({ pressed }) => [
            styles.combinedBtn,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Ionicons name="business-outline" size={22} color={colors.primaryDark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.combinedTitle}>Manage branches</Text>
            <Text style={styles.combinedSub}>Add, edit, or deactivate branches</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primaryDark} />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Settings')}
          style={({ pressed }) => [
            styles.combinedBtn,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Ionicons name="people-outline" size={22} color={colors.primaryDark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.combinedTitle}>Managers & staff</Text>
            <Text style={styles.combinedSub}>Create a manager for any branch</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primaryDark} />
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function BranchButton({
  summary,
  onPress,
}: {
  summary: BranchSummary;
  onPress: () => void;
}) {
  const hasActivity = summary.cashCollectedToday > 0 || summary.cgDeliveries > 0 || summary.petsBills > 0;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.branchCard,
        hasActivity ? styles.branchCardLive : null,
        pressed ? styles.branchPressed : null,
      ]}
    >
      <View style={styles.branchHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.branchTitleRow}>
            <Text style={styles.branchName}>{summary.name.en}</Text>
            {hasActivity ? (
              <View style={styles.liveDot}>
                <View style={styles.liveDotInner} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            ) : (
              <View style={styles.idleChip}>
                <Text style={styles.idleText}>No activity today</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.primaryDark} />
      </View>

      <View style={styles.branchStatRow}>
        <Stat label="Cash" value={`Rs ${summary.cashCollectedToday.toLocaleString()}`} />
        <Stat label="Bills" value={summary.petsBills + summary.cgDeliveries} />
        <Stat
          label="Debt"
          value={`Rs ${summary.totalDebt.toLocaleString()}`}
          warn={summary.totalDebt > 0}
        />
      </View>
    </Pressable>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: number | string;
  warn?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, warn ? styles.statValueWarn : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  logo: { width: 56, height: 56 },
  brandTitle: {
    fontSize: fontSizes.heading,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  brandSub: { fontSize: fontSizes.sm, color: colors.textMuted },

  totalCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  totalLabel: { color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.body, fontWeight: '600' },
  totalValue: {
    color: colors.textInverse,
    fontSize: fontSizes.display,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  totalSubRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  totalSub: { color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.sm },
  debtChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  debtChipText: { color: colors.textInverse, fontSize: fontSizes.xs, fontWeight: '700' },

  branchesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  sectionSubtitle: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
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
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primaryLight,
    borderStyle: 'dashed',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: spacing.sm,
  },
  emptySub: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },

  branchCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  branchCardLive: {
    borderColor: colors.primary,
    borderLeftWidth: 6,
  },
  branchPressed: { opacity: 0.85 },
  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  branchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  branchName: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  liveDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.success + '22',
  },
  liveDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  liveText: { fontSize: 10, fontWeight: '900', color: colors.success },
  idleChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  idleText: { fontSize: 10, fontWeight: '700', color: colors.textMuted },

  branchStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  statValueWarn: { color: colors.danger },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  combinedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
  },
  combinedTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  combinedSub: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
});
