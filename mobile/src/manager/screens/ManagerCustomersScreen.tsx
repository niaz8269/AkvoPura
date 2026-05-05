/**
 * ManagerCustomersScreen — combined master list of all customers (Pets + CG).
 *
 * Search across both, filter by type or by debt-owing, summary cards on top.
 * Tapping a customer doesn't open detail yet — comes in a later slice when
 * customer CRUD ships.
 */

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useCGSalesman } from '../../cg/state';
import { usePetsSalesman } from '../../pets/state';

type Filter = 'all' | 'pets' | 'cg' | 'debt';

type UnifiedCustomer = {
  id: string;
  type: 'Pets' | 'C/G';
  name: string;
  area: string;
  phone: string;
  debt: number;
  emptiesHeld?: number;
};

export function ManagerCustomersScreen() {
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
    }));
    const g: UnifiedCustomer[] = cg.customers.map((c) => ({
      id: 'cg-' + c.id,
      type: 'C/G',
      name: c.name,
      area: c.route,
      phone: c.phone,
      debt: c.outstandingDebt,
      emptiesHeld: c.emptyCansHeld + c.emptyGallonsHeld,
    }));
    return [...p, ...g];
  }, [pets.customers, cg.customers]);

  const filtered = useMemo(() => {
    let list = all;
    if (filter === 'pets') list = list.filter((c) => c.type === 'Pets');
    else if (filter === 'cg') list = list.filter((c) => c.type === 'C/G');
    else if (filter === 'debt') list = list.filter((c) => c.debt > 0);

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

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Customers</Text>
        <Text style={styles.titleUr}>کسٹمرز</Text>

        <View style={styles.kpiRow}>
          <KpiCard label="Total" value={all.length} />
          <KpiCard
            label="In debt"
            value={inDebtCount}
            highlight={inDebtCount > 0 ? 'warn' : undefined}
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
          {(['all', 'pets', 'cg', 'debt'] as Filter[]).map((f) => {
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

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>No matching customers.</Text>
        ) : (
          filtered.map((c) => (
            <View key={c.id} style={[styles.row, c.debt > 0 ? styles.rowDebt : null]}>
              <View style={[styles.typeChip, c.type === 'Pets' ? styles.typeChipPets : styles.typeChipCg]}>
                <Text style={styles.typeChipText}>{c.type}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {c.name}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {c.area} • {c.phone}
                </Text>
                {c.emptiesHeld && c.emptiesHeld > 0 ? (
                  <Text style={styles.empties}>Empties held: {c.emptiesHeld}</Text>
                ) : null}
              </View>
              {c.debt > 0 ? (
                <View style={styles.debtBlock}>
                  <Text style={styles.debtAmount}>Rs {c.debt.toLocaleString()}</Text>
                  <Text style={styles.debtLabel}>owed</Text>
                </View>
              ) : null}
            </View>
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
};

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
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },
  titleUr: { fontSize: fontSizes.body, color: colors.primary, marginBottom: spacing.md },
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
  filterPillText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  filterPillTextActive: { color: colors.textInverse },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
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
});
