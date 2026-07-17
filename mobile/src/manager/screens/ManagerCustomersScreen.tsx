/**
 * ManagerCustomersScreen — combined master list of all customers (Pets + CG).
 *
 * Search across both, filter by type or by debt-owing, summary cards on top.
 * Tapping a customer doesn't open detail yet — comes in a later slice when
 * customer CRUD ships.
 */

import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useCGSalesman } from '../../cg/state';
import { usePetsSalesman } from '../../pets/state';
import type { PaymentCycle } from '../../cg/types';
import { classifyChurn, daysSince } from '../../analytics/churn';

type Filter = 'all' | 'pets' | 'cg' | 'debt' | 'at_risk';

type UnifiedCustomer = {
  id: string;
  cgId?: string;                  // present only for CG rows
  type: 'Pets' | 'C/G';
  name: string;
  area: string;
  phone: string;
  debt: number;
  emptiesHeld?: number;
  paymentCycle?: PaymentCycle;
  lastActivityAt?: number;
};

type Nav = { navigate: (screen: string) => void };

export function ManagerCustomersScreen({ navigation }: { navigation: Nav }) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = insets.bottom + 24;
  const cg = useCGSalesman();
  const pets = usePetsSalesman();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const all = useMemo<UnifiedCustomer[]>(() => {
    const p: UnifiedCustomer[] = pets.customers.map((c) => ({
      id: 'p-' + c.id,
      type: 'Pets',
      name: c.name,
      area: c.area,
      phone: c.phone,
      debt: c.outstandingDebt,
      lastActivityAt: c.lastActivityAt,
    }));
    const g: UnifiedCustomer[] = cg.customers.map((c) => ({
      id: 'cg-' + c.id,
      cgId: c.id,
      type: 'C/G',
      name: c.name,
      area: c.route,
      phone: c.phone,
      debt: c.outstandingDebt,
      emptiesHeld: c.emptyCansHeld + c.emptyGallonsHeld,
      paymentCycle: c.paymentCycle,
      lastActivityAt: c.lastActivityAt,
    }));
    return [...p, ...g];
  }, [pets.customers, cg.customers]);

  const editCycle = (cgId: string, name: string, current: PaymentCycle) => {
    Alert.alert(
      `Payment cycle for ${name}`,
      `Currently: ${current === 'daily' ? 'Daily' : 'Weekly'}. Change to:`,
      [
        {
          text: current === 'daily' ? 'Keep Daily' : 'Switch to Daily',
          onPress: () => cg.setPaymentCycle(cgId, 'daily'),
        },
        {
          text: current === 'weekly' ? 'Keep Weekly' : 'Switch to Weekly',
          onPress: () => cg.setPaymentCycle(cgId, 'weekly'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const filtered = useMemo(() => {
    let list = all;
    if (filter === 'pets') list = list.filter((c) => c.type === 'Pets');
    else if (filter === 'cg') list = list.filter((c) => c.type === 'C/G');
    else if (filter === 'debt') list = list.filter((c) => c.debt > 0);
    else if (filter === 'at_risk')
      list = list.filter((c) => {
        const r = classifyChurn(c.lastActivityAt);
        return r === 'at_risk' || r === 'never';
      });

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.area.toLowerCase().includes(q) ||
          c.phone.includes(q)
      );
    }

    // Sort: debt-bearing first, by amount desc; then by name
    return [...list].sort((a, b) => {
      if (a.debt !== b.debt) return b.debt - a.debt;
      return a.name.localeCompare(b.name);
    });
  }, [all, query, filter]);

  const totalDebt = all.reduce((s, c) => s + c.debt, 0);
  const inDebtCount = all.filter((c) => c.debt > 0).length;
  const atRiskCount = all.filter((c) => {
    const r = classifyChurn(c.lastActivityAt);
    return r === 'at_risk' || r === 'never';
  }).length;

  const openAddCustomer = () =>
    Alert.alert('Add new customer', 'Which type?', [
      { text: 'Cans / Gallons', onPress: () => navigation.navigate('AddCGCustomer') },
      { text: 'Pets', onPress: () => navigation.navigate('AddPetCustomer') },
      { text: 'Cancel', style: 'cancel' },
    ]);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Customers</Text>
          </View>
          <Pressable
            onPress={openAddCustomer}
            style={({ pressed }) => [
              styles.addBtn,
              pressed ? { opacity: 0.85 } : null,
            ]}
            accessibilityLabel="Add customer"
          >
            <Ionicons name="add" size={18} color={colors.textInverse} />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>

        <View style={styles.kpiRow}>
          <KpiCard label="Total" value={all.length} />
          <KpiCard
            label="In debt"
            value={inDebtCount}
            highlight={inDebtCount > 0 ? 'warn' : undefined}
          />
          <KpiCard
            label="At risk"
            value={atRiskCount}
            highlight={atRiskCount > 0 ? 'danger' : undefined}
          />
          <KpiCard
            label="Total owed"
            value={`Rs ${totalDebt.toLocaleString()}`}
            highlight={totalDebt > 0 ? 'danger' : undefined}
            wide
          />
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, area, phone"
          placeholderTextColor={colors.textMuted}
          style={styles.search}
          autoCorrect={false}
        />

        <View style={styles.filterRow}>
          {(['all', 'pets', 'cg', 'debt', 'at_risk'] as Filter[]).map((f) => {
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
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + spacing.lg }]}
      >
        <Pressable
          onPress={() => navigation.navigate('AgingReport')}
          style={({ pressed }) => [
            styles.agingLink,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Ionicons name="stats-chart" size={20} color={colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={styles.agingLinkTitle}>Aging report</Text>
            <Text style={styles.agingLinkSub}>Debtors grouped by inactivity</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
        </Pressable>

        {filtered.length === 0 ? (
          <Text style={styles.empty}>No matching customers.</Text>
        ) : (
          filtered.map((c) => (
            <CustomerRow
              key={c.id}
              customer={c}
              onEditCycle={
                c.cgId && c.paymentCycle
                  ? () => editCycle(c.cgId!, c.name, c.paymentCycle!)
                  : undefined
              }
            />
          ))
        )}
      </ScrollView>

    </Screen>
  );
}

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  pets: 'Pets',
  cg: 'C/G',
  debt: 'In debt',
  at_risk: 'At risk',
};

function CustomerRow({
  customer,
  onEditCycle,
}: {
  customer: UnifiedCustomer;
  onEditCycle?: () => void;
}) {
  const churn = classifyChurn(customer.lastActivityAt);
  const days = daysSince(customer.lastActivityAt);
  const churnBadge =
    churn === 'never' ? (
      <View style={[styles.churnBadge, styles.churnBadgeRisk]}>
        <Text style={[styles.churnBadgeText, styles.churnBadgeTextRisk]}>
          Never ordered
        </Text>
      </View>
    ) : churn === 'at_risk' ? (
      <View style={[styles.churnBadge, styles.churnBadgeRisk]}>
        <Text style={[styles.churnBadgeText, styles.churnBadgeTextRisk]}>
          At risk · {days}d
        </Text>
      </View>
    ) : churn === 'borderline' ? (
      <View style={[styles.churnBadge, styles.churnBadgeBorder]}>
        <Text style={[styles.churnBadgeText, styles.churnBadgeTextBorder]}>
          {days}d ago
        </Text>
      </View>
    ) : null;

  const body = (
    <>
      <View
        style={[
          styles.typeChip,
          customer.type === 'Pets' ? styles.typeChipPets : styles.typeChipCg,
        ]}
      >
        <Text style={styles.typeChipText}>{customer.type}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {customer.name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {customer.area} • {customer.phone}
        </Text>
        {customer.emptiesHeld && customer.emptiesHeld > 0 ? (
          <Text style={styles.empties}>Empties held: {customer.emptiesHeld}</Text>
        ) : null}
        {churnBadge}
      </View>
      {customer.paymentCycle ? (
        <View
          style={[
            styles.cycleBadge,
            customer.paymentCycle === 'daily'
              ? styles.cycleBadgeDaily
              : styles.cycleBadgeWeekly,
          ]}
        >
          <Text
            style={[
              styles.cycleBadgeText,
              customer.paymentCycle === 'daily'
                ? styles.cycleBadgeTextDaily
                : styles.cycleBadgeTextWeekly,
            ]}
          >
            {customer.paymentCycle === 'daily' ? 'Daily' : 'Weekly'}
          </Text>
        </View>
      ) : null}
      {customer.debt > 0 ? (
        <View style={styles.debtBlock}>
          <Text style={styles.debtAmount}>Rs {customer.debt.toLocaleString()}</Text>
          <Text style={styles.debtLabel}>owed</Text>
        </View>
      ) : null}
    </>
  );

  if (onEditCycle) {
    return (
      <Pressable
        onPress={onEditCycle}
        style={({ pressed }) => [
          styles.row,
          customer.debt > 0 ? styles.rowDebt : null,
          pressed ? { opacity: 0.85 } : null,
        ]}
      >
        {body}
      </Pressable>
    );
  }

  return (
    <View style={[styles.row, customer.debt > 0 ? styles.rowDebt : null]}>{body}</View>
  );
}

function KpiCard({
  label,
  value,
  highlight,
  wide,
}: {
  label: string;
  value: number | string;
  highlight?: 'warn' | 'danger';
  wide?: boolean;
}) {
  return (
    <View
      style={[
        styles.kpi,
        wide ? styles.kpiWide : null,
        highlight === 'warn' ? styles.kpiWarn : null,
        highlight === 'danger' ? styles.kpiDanger : null,
      ]}
    >
      <Text
        style={[
          styles.kpiValue,
          highlight === 'warn' ? styles.kpiValueWarn : null,
          highlight === 'danger' ? styles.kpiValueDanger : null,
        ]}
      >
        {value}
      </Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
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
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  kpi: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  kpiWide: { flex: 2 },
  kpiWarn: { backgroundColor: colors.warning + '15' },
  kpiDanger: { backgroundColor: colors.danger + '15' },
  kpiValue: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  kpiValueWarn: { color: colors.warning },
  kpiValueDanger: { color: colors.danger },
  kpiLabel: { fontSize: fontSizes.xs, color: colors.textMuted },
  search: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSizes.body,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
  filterPillText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  filterPillTextActive: { color: colors.textInverse },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xl,
  },
  row: {
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
  rowDebt: { borderLeftWidth: 5, borderLeftColor: colors.danger },
  typeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    minWidth: 44,
    alignItems: 'center',
  },
  typeChipPets: { backgroundColor: colors.accent + '22' },
  typeChipCg: { backgroundColor: colors.primary + '22' },
  typeChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  name: { fontSize: fontSizes.body, fontWeight: '700', color: colors.text },
  sub: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  empties: {
    fontSize: fontSizes.xs,
    color: colors.warning,
    fontWeight: '700',
    marginTop: 2,
  },
  debtBlock: { alignItems: 'flex-end' },
  debtAmount: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.danger,
  },
  debtLabel: { fontSize: 10, color: colors.danger },
  cycleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    marginLeft: spacing.xs,
  },
  cycleBadgeDaily: { backgroundColor: colors.accent + '22' },
  cycleBadgeWeekly: { backgroundColor: colors.warning + '22' },
  cycleBadgeText: { fontSize: 10, fontWeight: '900' },
  cycleBadgeTextDaily: { color: colors.accent },
  cycleBadgeTextWeekly: { color: colors.warning },
  churnBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    marginTop: 4,
  },
  churnBadgeRisk: { backgroundColor: colors.danger + '22' },
  churnBadgeBorder: { backgroundColor: colors.warning + '22' },
  churnBadgeText: { fontSize: 10, fontWeight: '800' },
  churnBadgeTextRisk: { color: colors.danger },
  churnBadgeTextBorder: { color: colors.warning },
  agingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.danger + '12',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  agingLinkTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  agingLinkSub: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  addBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.textInverse,
  },
});
