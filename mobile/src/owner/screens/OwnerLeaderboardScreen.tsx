/**
 * OwnerLeaderboardScreen — gamified salesman performance ranking.
 *
 * Per spec section "Analytics & Insights — Salesman leaderboard". Today's
 * performance ranked by cash collected. Trophy icons on top 3.
 */

import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useCGSalesman } from '../../cg/state';
import { usePetsSalesman } from '../../pets/state';
import { useAssignments } from '../../assignments/state';
import { buildLeaderboard, type SalesmanLeaderboardRow } from '../leaderboard';

const RANK_META: Record<number, { color: string; bg: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  1: { color: '#B58200', bg: '#FFF1C2', label: '1st', icon: 'trophy' },
  2: { color: '#5C6F77', bg: '#E5ECEF', label: '2nd', icon: 'medal' },
  3: { color: '#9C5A2A', bg: '#F4E0CC', label: '3rd', icon: 'medal' },
};

export function OwnerLeaderboardScreen() {
  const cg = useCGSalesman();
  const pets = usePetsSalesman();
  const assignments = useAssignments();

  const leaderboard = useMemo(() => {
    return buildLeaderboard({
      cgSalesman: assignments.cgSalesman(),
      petsSalesman: assignments.petsSalesman(),
      cgDeliveries: cg.deliveries,
      cgCollections: cg.collections,
      petsBills: pets.bills,
      petsReturns: pets.returns,
    });
  }, [cg.deliveries, cg.collections, pets.bills, pets.returns, assignments]);

  const totalCash = leaderboard.reduce((s, r) => s + r.cashCollected, 0);
  const topPerformer = leaderboard[0];

  return (
    <Screen scroll>
      <Text style={styles.title}>Salesman leaderboard</Text>
      <Text style={styles.intro}>
        Today's ranking by cash collected.
      </Text>

      {topPerformer && topPerformer.cashCollected > 0 ? (
        <View style={styles.heroCard}>
          <Ionicons name="trophy" size={28} color="#FFE680" />
          <View style={{ flex: 1 }}>
            <Text style={styles.heroLabel}>Today's leader</Text>
            <Text style={styles.heroName}>{topPerformer.user.name}</Text>
            <Text style={styles.heroSub}>
              Rs {topPerformer.cashCollected.toLocaleString()} collected ·{' '}
              {topPerformer.events} {topPerformer.type === 'pets' ? 'bills' : 'deliveries'}
            </Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Today's ranking</Text>
      {leaderboard.length === 0 ? (
        <Text style={styles.empty}>
          No salesmen assigned today. Set assignments in Manager → Van Load.
        </Text>
      ) : (
        leaderboard.map((row, idx) => (
          <LeaderboardRow
            key={row.user.id}
            row={row}
            rank={idx + 1}
            shareOfTotal={totalCash > 0 ? row.cashCollected / totalCash : 0}
          />
        ))
      )}
    </Screen>
  );
}

function LeaderboardRow({
  row,
  rank,
  shareOfTotal,
}: {
  row: SalesmanLeaderboardRow;
  rank: number;
  shareOfTotal: number;
}) {
  const meta = RANK_META[rank];
  return (
    <View style={styles.row}>
      <View style={styles.rankCol}>
        {meta ? (
          <View style={[styles.rankBadge, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.icon} size={20} color={meta.color} />
          </View>
        ) : (
          <View style={styles.rankNumber}>
            <Text style={styles.rankNumberText}>#{rank}</Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.rowHeader}>
          <Text style={styles.name} numberOfLines={1}>
            {row.user.name}
          </Text>
          <View
            style={[
              styles.typeChip,
              row.type === 'pets' ? styles.typeChipPets : styles.typeChipCg,
            ]}
          >
            <Text style={styles.typeChipText}>
              {row.type === 'pets' ? 'Pets' : 'C/G'}
            </Text>
          </View>
        </View>

        <Text style={styles.cashLine}>Rs {row.cashCollected.toLocaleString()}</Text>

        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.min(100, Math.max(2, shareOfTotal * 100))}%`,
                backgroundColor:
                  rank === 1 ? colors.success : rank === 2 ? colors.info : colors.primary,
              },
            ]}
          />
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="receipt-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>
              {row.events} {row.type === 'pets' ? 'bills' : 'deliveries'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="cube-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>{row.units} units</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>{row.customers} customers</Text>
          </View>
        </View>

        {row.amountBilled > row.cashCollected ? (
          <Text style={styles.creditLine}>
            Rs {(row.amountBilled - row.cashCollected).toLocaleString()} on credit
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSizes.heading, fontWeight: '800', color: colors.primaryDark },
  titleUr: { fontSize: fontSizes.body, color: colors.primary },
  intro: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginVertical: spacing.md,
    lineHeight: 20,
  },

  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.xs, fontWeight: '600' },
  heroName: {
    color: colors.textInverse,
    fontSize: fontSizes.title,
    fontWeight: '900',
    marginTop: 2,
  },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.sm, marginTop: 2 },

  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
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

  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  rankCol: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumberText: { fontSize: 14, fontWeight: '900', color: colors.textMuted },

  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  typeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  typeChipPets: { backgroundColor: colors.accent + '22' },
  typeChipCg: { backgroundColor: colors.primary + '22' },
  typeChipText: { fontSize: 10, fontWeight: '900', color: colors.primaryDark },

  cashLine: {
    fontSize: fontSizes.title,
    fontWeight: '900',
    color: colors.primaryDark,
    marginTop: 4,
  },

  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: 6,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: 6,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: fontSizes.xs, color: colors.textMuted },

  creditLine: {
    fontSize: fontSizes.xs,
    color: colors.warning,
    fontWeight: '700',
    marginTop: 4,
  },
});
