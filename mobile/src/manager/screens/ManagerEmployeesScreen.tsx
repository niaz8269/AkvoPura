/**
 * ManagerEmployeesScreen — branch employee directory.
 *
 * Lists every employee at this manager's branch, filterable by role.
 * Tapping a row pushes to ManagerEmployeeDetailScreen.
 */

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { useEmployees } from '../../employees/state';
import { ROLE_LABELS } from '../../employees/demoData';
import type { Employee, EmployeeRole } from '../../employees/types';

type RoleFilter = 'all' | EmployeeRole;

const FILTER_LABELS: Record<RoleFilter, string> = {
  all: 'All',
  manager: 'Manager',
  pets_salesman: 'Pets',
  cans_gallons_salesman: 'C/G',
  production_worker: 'Production',
  driver: 'Driver',
  helper: 'Helper',
  other: 'Other',
};

const FILTER_ORDER: RoleFilter[] = [
  'all',
  'pets_salesman',
  'cans_gallons_salesman',
  'production_worker',
  'driver',
  'helper',
];

type Nav = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigate: (screen: string, params?: any) => void;
};

export function ManagerEmployeesScreen({ navigation }: { navigation: Nav }) {
  const { user } = useAuth();
  const { employees, todayEntryForEmployee } = useEmployees();
  const [filter, setFilter] = useState<RoleFilter>('all');
  const [query, setQuery] = useState('');

  const branchEmployees = useMemo(
    () => employees.filter((e) => !user?.branch || e.branch === user.branch),
    [employees, user?.branch]
  );

  const visible = useMemo(() => {
    let list = branchEmployees;
    if (filter !== 'all') list = list.filter((e) => e.role === filter);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) => e.name.toLowerCase().includes(q) || e.phone.includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [branchEmployees, filter, query]);

  const activeCount = branchEmployees.filter((e) => e.active).length;

  return (
    <Screen padded={false}>
      <View style={styles.headerBar}>
        <Text style={styles.headerStat}>
          <Text style={styles.headerStatVal}>{activeCount}</Text> active ·{' '}
          <Text style={styles.headerStatVal}>{branchEmployees.length}</Text> total
        </Text>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or phone"
        placeholderTextColor={colors.textMuted}
        style={styles.search}
        autoCorrect={false}
      />

      <View style={styles.filterRow}>
        {FILTER_ORDER.map((f) => {
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
              <Text style={[styles.filterText, active ? styles.filterTextActive : null]}>
                {FILTER_LABELS[f]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
        <Pressable
          onPress={() => navigation.navigate('StaffAccounts')}
          style={({ pressed }) => [
            styles.staffLink,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Ionicons name="key-outline" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.staffLinkTitle}>Staff accounts</Text>
            <Text style={styles.staffLinkSub}>Who can log into the app (live from server)</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
        </Pressable>

        {visible.length === 0 ? (
          <Text style={styles.empty}>No employees match this filter.</Text>
        ) : (
          visible.map((e) => (
            <EmployeeRow
              key={e.id}
              employee={e}
              checkedIn={!!todayEntryForEmployee(e.id) && todayEntryForEmployee(e.id)?.checkOutAt === null}
              checkedOut={!!todayEntryForEmployee(e.id)?.checkOutAt}
              onPress={() => navigation.navigate('EmployeeDetail', { employeeId: e.id })}
            />
          ))
        )}
      </ScrollView>

      {/* Floating "+" button to add a new employee */}
      <Pressable
        onPress={() => navigation.navigate('AddEmployee')}
        style={({ pressed }) => [
          styles.fab,
          pressed ? { opacity: 0.85 } : null,
        ]}
        accessibilityLabel="Add employee"
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </Pressable>
    </Screen>
  );
}

function EmployeeRow({
  employee,
  checkedIn,
  checkedOut,
  onPress,
}: {
  employee: Employee;
  checkedIn: boolean;
  checkedOut: boolean;
  onPress: () => void;
}) {
  const role = ROLE_LABELS[employee.role];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !employee.active ? styles.rowInactive : null,
        pressed ? { opacity: 0.85 } : null,
      ]}
    >
      <View style={styles.avatar}>
        <Ionicons name="person-outline" size={20} color={colors.primaryDark} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.rowHeader}>
          <Text style={styles.name} numberOfLines={1}>
            {employee.name}
          </Text>
          {!employee.active ? (
            <View style={styles.inactiveChip}>
              <Text style={styles.inactiveChipText}>Inactive</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.sub} numberOfLines={1}>
          {role.en} · {employee.phone}
        </Text>
        <Text style={styles.pay}>
          {employee.employmentType === 'hourly'
            ? `Rs ${employee.hourlyRate?.toLocaleString()}/hour`
            : `Rs ${employee.monthlySalary?.toLocaleString()}/month`}
        </Text>
      </View>
      {employee.active ? (
        <View
          style={[
            styles.statusBadge,
            checkedIn
              ? styles.statusIn
              : checkedOut
                ? styles.statusOut
                : styles.statusAbsent,
          ]}
        >
          <Text style={styles.statusText}>
            {checkedIn ? 'In' : checkedOut ? 'Done' : 'Absent'}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 32,
  },
  headerStat: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  headerStatVal: { color: colors.primaryDark, fontWeight: '800' },
  search: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    marginHorizontal: spacing.lg,
    marginTop: 6,
    marginBottom: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    fontSize: fontSizes.sm,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
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
  filterText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  filterTextActive: { color: colors.textInverse },

  scroll: { flex: 1 },
  list: { paddingHorizontal: spacing.lg, paddingTop: 4, paddingBottom: spacing.sm },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xl,
  },
  staffLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary + '12',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  staffLinkTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  staffLinkSub: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowInactive: { opacity: 0.55 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  sub: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  pay: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    minWidth: 50,
    alignItems: 'center',
  },
  statusIn: { backgroundColor: colors.success + '22' },
  statusOut: { backgroundColor: colors.textMuted + '22' },
  statusAbsent: { backgroundColor: colors.danger + '22' },
  statusText: { fontSize: 10, fontWeight: '900', color: colors.text },
  inactiveChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  inactiveChipText: { fontSize: 10, fontWeight: '800', color: colors.textMuted },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
