/**
 * ManagerEmployeeDetailScreen — single employee profile + attendance history.
 *
 * Header: name, role badge, status (active/inactive), branch.
 * Body: pay info, today's status with check-in/out controls, history list,
 * deactivate / reactivate button.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BilingualButton, Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useEmployees } from '../../employees/state';
import { ROLE_LABELS } from '../../employees/demoData';
import type { AttendanceEntry, Employee, EmploymentType } from '../../employees/types';

export function ManagerEmployeeDetailScreen({ route }: any) {
  const {
    employeeById,
    attendanceForEmployee,
    todayEntryForEmployee,
    totalsForEntry,
    checkIn,
    checkOut,
    setActive,
    updateEmployee,
  } = useEmployees();

  const employee = employeeById(route.params.employeeId);
  const [editingPay, setEditingPay] = useState(false);

  if (!employee) {
    return (
      <Screen>
        <Text style={styles.missing}>Employee not found.</Text>
      </Screen>
    );
  }

  const role = ROLE_LABELS[employee.role];
  const todayEntry = todayEntryForEmployee(employee.id);
  const history = attendanceForEmployee(employee.id);

  return (
    <Screen scroll>
      <EmployeeHeader employee={employee} />

      <View style={styles.payCard}>
        <View style={styles.payRow}>
          <Text style={styles.payLabel}>Role</Text>
          <Text style={styles.payValue}>{role.en}</Text>
        </View>
        <View style={styles.payRow}>
          <Text style={styles.payLabel}>Phone</Text>
          <Text style={styles.payValue}>{employee.phone}</Text>
        </View>
        <View style={styles.payRow}>
          <Text style={styles.payLabel}>Hired</Text>
          <Text style={styles.payValue}>{formatDate(employee.hiredAt)}</Text>
        </View>
        <Pressable
          onPress={() => setEditingPay(true)}
          style={({ pressed }) => [
            styles.payRow,
            styles.payRowLast,
            pressed ? { opacity: 0.7 } : null,
          ]}
        >
          <Text style={styles.payLabel}>Pay</Text>
          <View style={styles.payValueWrap}>
            <Text style={styles.payValue}>
              {employee.employmentType === 'hourly'
                ? `Rs ${employee.hourlyRate?.toLocaleString()}/hour`
                : `Rs ${employee.monthlySalary?.toLocaleString()}/month`}
            </Text>
            <Ionicons
              name="pencil"
              size={14}
              color={colors.primary}
              style={{ marginLeft: 6 }}
            />
          </View>
        </Pressable>
        {employee.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>📝 {employee.notes}</Text>
          </View>
        ) : null}
      </View>

      {editingPay ? (
        <PayEditor
          employee={employee}
          onCancel={() => setEditingPay(false)}
          onSave={(type, amount) => {
            updateEmployee(employee.id, {
              employmentType: type,
              monthlySalary: type === 'salaried' ? amount : undefined,
              hourlyRate: type === 'hourly' ? amount : undefined,
            });
            setEditingPay(false);
            Alert.alert(
              'Pay updated',
              type === 'hourly'
                ? `${employee.name} now earns Rs ${amount.toLocaleString()}/hour.`
                : `${employee.name} now earns Rs ${amount.toLocaleString()}/month.`
            );
          }}
        />
      ) : null}

      <Text style={styles.sectionTitle}>Today</Text>
      <TodayCard
        employee={employee}
        entry={todayEntry}
        totals={
          todayEntry ? totalsForEntry(todayEntry, employee) : { hours: 0, earnings: 0 }
        }
        onCheckIn={() => {
          checkIn(employee.id);
          Alert.alert('Checked in', `${employee.name} marked as IN.`);
        }}
        onCheckOut={() => {
          Alert.alert('Check out?', `Mark ${employee.name} as done for today?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Check out', onPress: () => checkOut(employee.id) },
          ]);
        }}
      />

      <Text style={styles.sectionTitle}>Attendance history</Text>
      {history.length === 0 ? (
        <Text style={styles.empty}>No attendance recorded yet.</Text>
      ) : (
        <View style={styles.historyCard}>
          {history
            .slice()
            .sort((a, b) => b.checkInAt - a.checkInAt)
            .map((entry, idx) => {
              const totals = totalsForEntry(entry, employee);
              return (
                <View
                  key={entry.id}
                  style={[
                    styles.historyRow,
                    idx === history.length - 1 ? styles.historyRowLast : null,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyDate}>{entry.date}</Text>
                    <Text style={styles.historySub}>
                      In {formatTime(entry.checkInAt)}
                      {entry.checkOutAt
                        ? ` · Out ${formatTime(entry.checkOutAt)} · ${totals.hours.toFixed(1)} h`
                        : ' · still in'}
                      {employee.employmentType === 'hourly' && totals.earnings > 0
                        ? ` · Rs ${Math.round(totals.earnings).toLocaleString()}`
                        : ''}
                    </Text>
                    {entry.note ? <Text style={styles.historyNote}>📝 {entry.note}</Text> : null}
                  </View>
                </View>
              );
            })}
        </View>
      )}

      <Pressable
        onPress={() => {
          const verb = employee.active ? 'Deactivate' : 'Reactivate';
          Alert.alert(
            `${verb} ${employee.name}?`,
            employee.active
              ? 'They will stop appearing in active employee lists and on the attendance screen.'
              : 'They will rejoin the active employee lists.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: verb,
                style: employee.active ? 'destructive' : 'default',
                onPress: () => setActive(employee.id, !employee.active),
              },
            ]
          );
        }}
        style={({ pressed }) => [
          styles.deactivateBtn,
          employee.active ? styles.deactivateBtnDanger : styles.deactivateBtnActive,
          pressed ? { opacity: 0.85 } : null,
        ]}
      >
        <Ionicons
          name={employee.active ? 'person-remove-outline' : 'person-add-outline'}
          size={18}
          color={employee.active ? colors.danger : colors.success}
        />
        <Text
          style={[
            styles.deactivateBtnText,
            { color: employee.active ? colors.danger : colors.success },
          ]}
        >
          {employee.active ? 'Deactivate employee' : 'Reactivate employee'}
        </Text>
      </Pressable>
    </Screen>
  );
}

function PayEditor({
  employee,
  onCancel,
  onSave,
}: {
  employee: Employee;
  onCancel: () => void;
  onSave: (type: EmploymentType, amount: number) => void;
}) {
  const [type, setType] = useState<EmploymentType>(employee.employmentType);
  const [amountStr, setAmountStr] = useState(
    String(
      employee.employmentType === 'hourly'
        ? employee.hourlyRate ?? 0
        : employee.monthlySalary ?? 0
    )
  );

  useEffect(() => {
    // When toggling type, pre-fill with the saved value for that type.
    if (type === 'hourly') {
      setAmountStr(String(employee.hourlyRate ?? 0));
    } else {
      setAmountStr(String(employee.monthlySalary ?? 0));
    }
  }, [type, employee.hourlyRate, employee.monthlySalary]);

  const amount = Number(amountStr) || 0;
  const valid = amount > 0;

  return (
    <View style={styles.editorCard}>
      <Text style={styles.editorTitle}>Edit pay</Text>
      <Text style={styles.editorSub}>
        Pay can change at any time. The new rate applies to future hours.
      </Text>

      <View style={styles.typeToggleRow}>
        <Pressable
          onPress={() => setType('salaried')}
          style={({ pressed }) => [
            styles.typeToggle,
            type === 'salaried' ? styles.typeToggleActive : null,
            pressed && type !== 'salaried' ? { opacity: 0.7 } : null,
          ]}
        >
          <Text
            style={[
              styles.typeToggleText,
              type === 'salaried' ? styles.typeToggleTextActive : null,
            ]}
          >
            Monthly salary
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setType('hourly')}
          style={({ pressed }) => [
            styles.typeToggle,
            type === 'hourly' ? styles.typeToggleActive : null,
            pressed && type !== 'hourly' ? { opacity: 0.7 } : null,
          ]}
        >
          <Text
            style={[
              styles.typeToggleText,
              type === 'hourly' ? styles.typeToggleTextActive : null,
            ]}
          >
            Hourly rate
          </Text>
        </Pressable>
      </View>

      <Text style={styles.amountLabel}>
        {type === 'hourly' ? 'Rs per hour' : 'Rs per month'}
      </Text>
      <View style={styles.amountInputRow}>
        <Text style={styles.amountCurrency}>Rs</Text>
        <TextInput
          value={amountStr}
          onChangeText={(t) => setAmountStr(t.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          style={styles.amountInput}
          maxLength={7}
          autoFocus
        />
        <Text style={styles.amountSuffix}>{type === 'hourly' ? '/hour' : '/month'}</Text>
      </View>

      <View style={styles.editorActions}>
        <BilingualButton
          label={{ en: 'Cancel', ur: 'منسوخ' }}
          variant="secondary"
          onPress={onCancel}
          style={{ flex: 1 }}
        />
        <View style={{ width: spacing.md }} />
        <BilingualButton
          label={{ en: 'Save pay', ur: 'محفوظ' }}
          onPress={() => onSave(type, amount)}
          disabled={!valid}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

function EmployeeHeader({ employee }: { employee: Employee }) {
  const role = ROLE_LABELS[employee.role];
  return (
    <View style={styles.headerCard}>
      <View style={styles.avatarLg}>
        <Ionicons name="person-outline" size={28} color={colors.primaryDark} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{employee.name}</Text>
        <Text style={styles.roleLine}>
          {role.en} · {employee.branch === 'shergarh' ? 'Shergarh' : 'Timergara'}
        </Text>
      </View>
      <View
        style={[
          styles.statusChip,
          employee.active ? styles.statusChipActive : styles.statusChipInactive,
        ]}
      >
        <Text
          style={[
            styles.statusChipText,
            { color: employee.active ? colors.success : colors.textMuted },
          ]}
        >
          {employee.active ? 'Active' : 'Inactive'}
        </Text>
      </View>
    </View>
  );
}

function TodayCard({
  employee,
  entry,
  totals,
  onCheckIn,
  onCheckOut,
}: {
  employee: Employee;
  entry: AttendanceEntry | undefined;
  totals: { hours: number; earnings: number };
  onCheckIn: () => void;
  onCheckOut: () => void;
}) {
  const isIn = entry && entry.checkOutAt === null;
  const isDone = entry && entry.checkOutAt !== null;

  return (
    <View style={styles.todayCard}>
      <View style={styles.todayStatusRow}>
        <View
          style={[
            styles.todayDot,
            {
              backgroundColor: isIn
                ? colors.success
                : isDone
                  ? colors.textMuted
                  : colors.danger,
            },
          ]}
        />
        <Text style={styles.todayStatusText}>
          {isIn
            ? `Checked in at ${formatTime(entry!.checkInAt)}`
            : isDone
              ? `Done — ${totals.hours.toFixed(1)} hours${
                  employee.employmentType === 'hourly'
                    ? `, Rs ${Math.round(totals.earnings).toLocaleString()}`
                    : ''
                }`
              : 'Not checked in today'}
        </Text>
      </View>

      {!isDone ? (
        <Pressable
          onPress={isIn ? onCheckOut : onCheckIn}
          style={({ pressed }) => [
            styles.todayActionBtn,
            isIn ? styles.todayActionOut : styles.todayActionIn,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Ionicons
            name={isIn ? 'exit-outline' : 'enter-outline'}
            size={18}
            color={colors.textInverse}
          />
          <Text style={styles.todayActionText}>{isIn ? 'Check out' : 'Check in'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function formatDate(ts: number) {
  const d = new Date(ts);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

const styles = StyleSheet.create({
  missing: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },

  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  avatarLg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },
  roleLine: { fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  statusChipActive: { backgroundColor: colors.success + '22' },
  statusChipInactive: { backgroundColor: colors.surfaceMuted },
  statusChipText: { fontSize: 11, fontWeight: '900' },

  payCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  payRowLast: { borderBottomWidth: 0 },
  payLabel: { fontSize: fontSizes.sm, color: colors.textMuted },
  payValue: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.primaryDark },
  payValueWrap: { flexDirection: 'row', alignItems: 'center' },

  editorCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  editorTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  editorSub: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeToggle: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  typeToggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  typeToggleText: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  typeToggleTextActive: { color: colors.textInverse },
  amountLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  amountCurrency: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.textMuted,
  },
  amountInput: {
    flex: 1,
    height: 44,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  amountSuffix: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    fontWeight: '700',
  },
  editorActions: {
    flexDirection: 'row',
  },
  notesBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.statusYellow + '55',
    borderRadius: radii.md,
  },
  notesText: { fontSize: fontSizes.sm, color: colors.text },

  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: spacing.sm,
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
  },

  todayCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  todayStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  todayDot: { width: 12, height: 12, borderRadius: 6 },
  todayStatusText: { fontSize: fontSizes.body, fontWeight: '700', color: colors.text },
  todayActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.md,
  },
  todayActionIn: { backgroundColor: colors.success },
  todayActionOut: { backgroundColor: colors.warning },
  todayActionText: { color: colors.textInverse, fontWeight: '900', fontSize: fontSizes.body },

  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  historyRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyRowLast: { borderBottomWidth: 0 },
  historyDate: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.primaryDark },
  historySub: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  historyNote: { fontSize: fontSizes.xs, color: colors.text, marginTop: 2 },

  deactivateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  deactivateBtnDanger: {
    borderColor: colors.danger,
    backgroundColor: colors.danger + '10',
  },
  deactivateBtnActive: {
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  deactivateBtnText: { fontSize: fontSizes.body, fontWeight: '800' },
});
