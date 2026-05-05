/**
 * Customer aging report — groups customers with outstanding debt by how
 * long they have been inactive. Reused by Manager (Customers tab) and
 * Owner (Branch overview).
 *
 * Spec checklist item #28: "Customer aging report — bucket debtors by age."
 */

import React, { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useCGSalesman } from '../../cg/state';
import { usePetsSalesman } from '../../pets/state';
import { agingBucket, AGING_BUCKETS, type AgingBucket } from '../aging';
import { daysSince } from '../churn';

type DebtorRow = {
  id: string;
  type: 'Pets' | 'C/G';
  name: string;
  phone: string;
  area: string;
  debt: number;
  lastActivityAt?: number;
  bucket: AgingBucket;
};

export function AgingReportScreen() {
  const cg = useCGSalesman();
  const pets = usePetsSalesman();

  const debtors = useMemo<DebtorRow[]>(() => {
    const rows: DebtorRow[] = [];
    cg.customers.forEach((c) => {
      if (c.outstandingDebt <= 0) return;
      rows.push({
        id: 'cg-' + c.id,
        type: 'C/G',
        name: c.name,
        phone: c.phone,
        area: c.route,
        debt: c.outstandingDebt,
        lastActivityAt: c.lastActivityAt,
        bucket: agingBucket(c.lastActivityAt),
      });
    });
    pets.customers.forEach((c) => {
      if (c.outstandingDebt <= 0) return;
      rows.push({
        id: 'p-' + c.id,
        type: 'Pets',
        name: c.name,
        phone: c.phone,
        area: c.area,
        debt: c.outstandingDebt,
        lastActivityAt: c.lastActivityAt,
        bucket: agingBucket(c.lastActivityAt),
      });
    });
    return rows;
  }, [cg.customers, pets.customers]);

  const byBucket = useMemo(() => {
    const map: Record<AgingBucket, DebtorRow[]> = {
      current: [], d30_60: [], d60_90: [], d90_plus: [], never: [],
    };
    debtors.forEach((d) => map[d.bucket].push(d));
    Object.values(map).forEach((list) =>
      list.sort((a, b) => b.debt - a.debt)
    );
    return map;
  }, [debtors]);

  const totalDebt = debtors.reduce((s, d) => s + d.debt, 0);
  const overdueDebt = debtors
    .filter((d) => d.bucket !== 'current')
    .reduce((s, d) => s + d.debt, 0);

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total outstanding</Text>
          <Text style={styles.summaryValue}>Rs {totalDebt.toLocaleString()}</Text>
          <Text style={styles.summaryHint}>
            Across {debtors.length} debtor{debtors.length === 1 ? '' : 's'}
          </Text>
          {overdueDebt > 0 ? (
            <View style={styles.overduePill}>
              <Ionicons name="warning" size={14} color={colors.danger} />
              <Text style={styles.overdueText}>
                Rs {overdueDebt.toLocaleString()} overdue (30+ days inactive)
              </Text>
            </View>
          ) : null}
        </View>

        {debtors.length === 0 ? (
          <Text style={styles.empty}>No customers in debt right now.</Text>
        ) : (
          AGING_BUCKETS.map((b) => {
            const list = byBucket[b.key];
            if (list.length === 0) return null;
            const bucketTotal = list.reduce((s, d) => s + d.debt, 0);
            const tone = bucketTone(b.key);
            return (
              <View key={b.key} style={styles.bucket}>
                <View
                  style={[
                    styles.bucketHeader,
                    tone === 'danger'
                      ? styles.bucketHeaderDanger
                      : tone === 'warn'
                        ? styles.bucketHeaderWarn
                        : styles.bucketHeaderOk,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bucketTitle}>{b.label}</Text>
                    <Text style={styles.bucketRange}>{b.range}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.bucketAmount}>
                      Rs {bucketTotal.toLocaleString()}
                    </Text>
                    <Text style={styles.bucketCount}>
                      {list.length} customer{list.length === 1 ? '' : 's'}
                    </Text>
                  </View>
                </View>

                {list.map((d) => (
                  <DebtorCard key={d.id} debtor={d} />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

function DebtorCard({ debtor }: { debtor: DebtorRow }) {
  const days = daysSince(debtor.lastActivityAt);

  const callCustomer = () => {
    const cleaned = debtor.phone.replace(/[^\d+]/g, '');
    if (!cleaned) return;
    Linking.openURL(`tel:${cleaned}`);
  };

  return (
    <Pressable
      onPress={callCustomer}
      style={({ pressed }) => [styles.card, pressed ? { opacity: 0.85 } : null]}
    >
      <View
        style={[
          styles.typeChip,
          debtor.type === 'Pets' ? styles.typeChipPets : styles.typeChipCg,
        ]}
      >
        <Text style={styles.typeChipText}>{debtor.type}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName} numberOfLines={1}>{debtor.name}</Text>
        <Text style={styles.cardSub} numberOfLines={1}>
          {debtor.area} • {debtor.phone}
        </Text>
        <Text style={styles.cardActivity}>
          {days == null ? 'Never ordered' : `Last activity: ${days}d ago`}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.cardDebt}>Rs {debtor.debt.toLocaleString()}</Text>
        <View style={styles.callPill}>
          <Ionicons name="call" size={12} color={colors.primaryDark} />
          <Text style={styles.callPillText}>Call</Text>
        </View>
      </View>
    </Pressable>
  );
}

function bucketTone(b: AgingBucket): 'ok' | 'warn' | 'danger' {
  if (b === 'current') return 'ok';
  if (b === 'd30_60') return 'warn';
  return 'danger';
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, paddingBottom: spacing.xl },

  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryLabel: { color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.sm, fontWeight: '600' },
  summaryValue: {
    color: colors.textInverse,
    fontSize: fontSizes.display,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  summaryHint: { color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.xs, marginTop: 2 },
  overduePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: spacing.md,
  },
  overdueText: { fontSize: fontSizes.xs, fontWeight: '800', color: colors.danger },

  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xl,
  },

  bucket: { marginBottom: spacing.lg },
  bucketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  bucketHeaderOk: { backgroundColor: colors.success + '18' },
  bucketHeaderWarn: { backgroundColor: colors.warning + '22' },
  bucketHeaderDanger: { backgroundColor: colors.danger + '22' },
  bucketTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.text,
  },
  bucketRange: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  bucketAmount: {
    fontSize: fontSizes.body,
    fontWeight: '900',
    color: colors.text,
  },
  bucketCount: { fontSize: fontSizes.xs, color: colors.textMuted },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    minWidth: 44,
    alignItems: 'center',
  },
  typeChipPets: { backgroundColor: colors.accent + '22' },
  typeChipCg: { backgroundColor: colors.primary + '22' },
  typeChipText: { fontSize: 10, fontWeight: '800', color: colors.primaryDark },
  cardName: { fontSize: fontSizes.body, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  cardActivity: {
    fontSize: fontSizes.xs,
    color: colors.warning,
    fontWeight: '700',
    marginTop: 2,
  },
  cardDebt: { fontSize: fontSizes.body, fontWeight: '900', color: colors.danger },
  callPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight + '33',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    marginTop: 4,
  },
  callPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
  },
});
