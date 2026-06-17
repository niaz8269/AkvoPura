/**
 * OwnerCombinedScreen — side-by-side comparison of both branches.
 *
 * For each KPI: two columns + a "winner" indicator (which branch is ahead).
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useOwnerData } from '../computed';
import type { BranchSummary } from '../types';

export function OwnerCombinedScreen() {
  const { timergara, shergarh } = useOwnerData();

  return (
    <Screen scroll>
      <Text style={styles.title}>Branch comparison</Text>
      <Text style={styles.intro}>
        Today's numbers across both branches. Shergarh figures are demo
        until a Shergarh salesman starts logging real activity.
      </Text>

      <View style={styles.headerRow}>
        <View style={styles.headerCol}>
          <Text style={styles.colName}>{timergara.name.en}</Text>
          <View style={[styles.miniBadge, styles.liveBadge]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <View style={styles.middleCol}>
          <Text style={styles.vs}>vs</Text>
        </View>
        <View style={styles.headerCol}>
          <Text style={styles.colName}>{shergarh.name.en}</Text>
          <View style={[styles.miniBadge, styles.demoBadge]}>
            <Text style={styles.demoText}>DEMO</Text>
          </View>
        </View>
      </View>

      <Block title="Today's cash" subtitle="  ">
        <CompareRow
          label="Cash collected"
          a={timergara.cashCollectedToday}
          b={shergarh.cashCollectedToday}
          format="rupees"
          higherIsBetter
        />
        <CompareRow
          label="Billed"
          a={timergara.amountBilledToday}
          b={shergarh.amountBilledToday}
          format="rupees"
          higherIsBetter
          last
        />
      </Block>

      <Block title="Pets sales" subtitle=" ">
        <CompareRow label="Bills" a={timergara.petsBills} b={shergarh.petsBills} higherIsBetter />
        <CompareRow
          label="600 ml packs"
          a={timergara.pet600PacksSold}
          b={shergarh.pet600PacksSold}
          higherIsBetter
        />
        <CompareRow
          label="1.5 L packs"
          a={timergara.pet1500PacksSold}
          b={shergarh.pet1500PacksSold}
          higherIsBetter
          last
        />
      </Block>

      <Block title="C/G activity" subtitle="/ ">
        <CompareRow
          label="Deliveries"
          a={timergara.cgDeliveries}
          b={shergarh.cgDeliveries}
          higherIsBetter
        />
        <CompareRow
          label="Cans delivered"
          a={timergara.cansDelivered}
          b={shergarh.cansDelivered}
          higherIsBetter
        />
        <CompareRow
          label="Gallons delivered"
          a={timergara.gallonsDelivered}
          b={shergarh.gallonsDelivered}
          higherIsBetter
        />
        <CompareRow
          label="Empty cans collected"
          a={timergara.emptyCansCollected}
          b={shergarh.emptyCansCollected}
          higherIsBetter
        />
        <CompareRow
          label="Empty gallons collected"
          a={timergara.emptyGallonsCollected}
          b={shergarh.emptyGallonsCollected}
          higherIsBetter
          last
        />
      </Block>

      <Block title="Customers & debt" subtitle="  ">
        <CompareRow
          label="Total customers"
          a={timergara.customerCount}
          b={shergarh.customerCount}
          higherIsBetter
        />
        <CompareRow
          label="Customers in debt"
          a={timergara.customersInDebt}
          b={shergarh.customersInDebt}
          warnHigher
        />
        <CompareRow
          label="At risk (30+ days)"
          a={timergara.customersAtRisk}
          b={shergarh.customersAtRisk}
          warnHigher
        />
        <CompareRow
          label="Total outstanding"
          a={timergara.totalDebt}
          b={shergarh.totalDebt}
          format="rupees"
          warnHigher
          last
        />
      </Block>
    </Screen>
  );
}

function Block({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.block}>
      <View style={{ marginBottom: spacing.sm }}>
        <Text style={styles.blockTitle}>{title}</Text>
        {subtitle ? <Text style={styles.blockSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.blockBody}>{children}</View>
    </View>
  );
}

function CompareRow({
  label,
  a,
  b,
  format = 'number',
  higherIsBetter,
  warnHigher,
  last,
}: {
  label: string;
  a: number;
  b: number;
  format?: 'number' | 'rupees';
  higherIsBetter?: boolean;
  warnHigher?: boolean;
  last?: boolean;
}) {
  const fmt = (n: number) =>
    format === 'rupees' ? `Rs ${n.toLocaleString()}` : n.toLocaleString();

  let aWins = false;
  let bWins = false;
  if (higherIsBetter && a !== b) {
    aWins = a > b;
    bWins = b > a;
  } else if (warnHigher && a !== b) {
    // For "bad" metrics, the lower number is the winner
    aWins = a < b;
    bWins = b < a;
  }

  return (
    <View style={[styles.compRow, last ? styles.compRowLast : null]}>
      <View style={styles.compCol}>
        <Text style={[styles.compValue, aWins ? styles.compWinner : null]}>
          {fmt(a)}
        </Text>
        {aWins ? (
          <Ionicons
            name="trophy"
            size={14}
            color={colors.success}
            style={{ marginTop: 2 }}
          />
        ) : null}
      </View>
      <View style={styles.compMid}>
        <Text style={styles.compLabel}>{label}</Text>
      </View>
      <View style={styles.compCol}>
        <Text style={[styles.compValue, bWins ? styles.compWinner : null]}>
          {fmt(b)}
        </Text>
        {bWins ? (
          <Ionicons
            name="trophy"
            size={14}
            color={colors.success}
            style={{ marginTop: 2 }}
          />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerCol: { flex: 1, alignItems: 'center' },
  middleCol: { paddingHorizontal: spacing.md },
  colName: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  vs: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  miniBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  liveBadge: { backgroundColor: colors.success + '22' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  liveText: { fontSize: 9, fontWeight: '900', color: colors.success },
  demoBadge: { backgroundColor: colors.surfaceMuted },
  demoText: { fontSize: 9, fontWeight: '900', color: colors.textMuted },

  block: { marginBottom: spacing.lg },
  blockTitle: { fontSize: fontSizes.body, fontWeight: '800', color: colors.primaryDark },
  blockSubtitle: { fontSize: fontSizes.xs, color: colors.textMuted },
  blockBody: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  compRowLast: { borderBottomWidth: 0 },
  compCol: { flex: 1, alignItems: 'center' },
  compMid: { flex: 1.4, alignItems: 'center', paddingHorizontal: spacing.xs },
  compValue: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  compWinner: {
    color: colors.success,
  },
  compLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
