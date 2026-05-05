/**
 * OwnerLandingScreen — main Owner home.
 *
 * Per spec: two prominent branch buttons (Timergara + Shergarh) + an
 * "Across all branches" summary card on top.
 */

import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useOwnerData } from '../computed';
import type { BranchKey, BranchSummary } from '../types';

const brandLogo = require('../../../assets/brand/akvopura-brand.png');

type Nav = {
  navigate: (screen: string, params?: { branch: BranchKey }) => void;
};

export function OwnerLandingScreen({ navigation }: { navigation: Nav }) {
  const { timergara, shergarh } = useOwnerData();

  const totalCash = timergara.cashCollectedToday + shergarh.cashCollectedToday;
  const totalDebt = timergara.totalDebt + shergarh.totalDebt;
  const totalDeliveries = timergara.cgDeliveries + shergarh.cgDeliveries;
  const totalBills = timergara.petsBills + shergarh.petsBills;

  return (
    <Screen scroll>
      <View style={styles.brandRow}>
        <Image source={brandLogo} style={styles.logo} resizeMode="contain" />
        <View>
          <Text style={styles.brandTitle}>AkvoPura</Text>
          <Text style={styles.brandSub}>Owner Console</Text>
        </View>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Today across all branches</Text>
        <Text style={styles.totalLabelUr}>آج تمام برانچوں میں</Text>
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

      <Text style={styles.sectionTitle}>Branches</Text>
      <Text style={styles.sectionSubtitle}>برانچیں — choose to drill in</Text>

      <BranchButton
        summary={timergara}
        onPress={() => navigation.navigate('BranchOverview', { branch: 'timergara' })}
        live
      />
      <BranchButton
        summary={shergarh}
        onPress={() => navigation.navigate('BranchOverview', { branch: 'shergarh' })}
      />

      <Pressable
        onPress={() => navigation.navigate('Combined')}
        style={({ pressed }) => [
          styles.combinedBtn,
          pressed ? { opacity: 0.85 } : null,
        ]}
      >
        <Ionicons name="git-compare-outline" size={22} color={colors.primaryDark} />
        <View style={{ flex: 1 }}>
          <Text style={styles.combinedTitle}>Compare both branches</Text>
          <Text style={styles.combinedSub}>دونوں برانچوں کا موازنہ</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.primaryDark} />
      </Pressable>
    </Screen>
  );
}

function BranchButton({
  summary,
  onPress,
  live,
}: {
  summary: BranchSummary;
  onPress: () => void;
  live?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.branchCard,
        live ? styles.branchCardLive : null,
        pressed ? styles.branchPressed : null,
      ]}
    >
      <View style={styles.branchHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.branchTitleRow}>
            <Text style={styles.branchName}>{summary.name.en}</Text>
            {live ? (
              <View style={styles.liveDot}>
                <View style={styles.liveDotInner} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            ) : (
              <View style={styles.demoChip}>
                <Text style={styles.demoText}>DEMO</Text>
              </View>
            )}
          </View>
          <Text style={styles.branchNameUr}>{summary.name.ur}</Text>
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
  totalLabelUr: { color: 'rgba(255,255,255,0.7)', fontSize: fontSizes.sm },
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

  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  sectionSubtitle: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginBottom: spacing.md,
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
  branchNameUr: { fontSize: fontSizes.sm, color: colors.primary, marginTop: 2 },
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
  demoChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  demoText: { fontSize: 10, fontWeight: '900', color: colors.textMuted },

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
