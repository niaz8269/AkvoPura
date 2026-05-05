/**
 * ManagerAttendanceScreen — today's attendance for the branch.
 *
 * Each row shows an employee, their current state (Absent / In / Done), and
 * a primary action button that toggles between Check in / Check out / Done.
 * Hourly employees show a live earnings preview when checked in.
 */

import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { useEmployees } from '../../employees/state';
import { ROLE_LABELS } from '../../employees/demoData';
import type { AttendanceEntry, Employee } from '../../employees/types';

export function ManagerAttendanceScreen() {
  const { user } = useAuth();
  const {
    employees,
    todayEntryForEmployee,
    totalsForEntry,
    checkIn,
    checkOut,
  } = useEmployees();

  const branchEmployees = useMemo(
    () =>
      employees
        .filter((e) => e.active && (!user?.branch || e.branch === user.branch))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [employees, user?.branch]
  );

  // Summary counts
  const totals = useMemo(() => {
    let inCount = 0;
    let doneCount = 0;
    let absentCount = 0;
    let earningsToday = 0;
    branchEmployees.forEach((e) => {
      const entry = todayEntryForEmployee(e.id);
      if (!entry) {
        absentCount++;
      } else if (entry.checkOutAt === null) {
        inCount++;
      } else {
        doneCount++;
      }
      if (entry?.checkOutAt) {
        earningsToday += totalsForEntry(entry, e).earnings;
      }
    });
    return { inCount, doneCount, absentCount, earningsToday };
  }, [branchEmployees, todayEntryForEmployee, totalsForEntry]);

  return (
    <Screen padded={false}>
      <View style={styles.headerBar}>
        <Text style={styles.headerStat}>
          <Text style={[styles.headerStatVal, { color: colors.success }]}>{totals.inCount}</Text> in ·{' '}
          <Text style={[styles.headerStatVal, { color: colors.textMuted }]}>{totals.doneCount}</Text> done ·{' '}
          <Text style={[styles.headerStatVal, { color: colors.danger }]}>{totals.absentCount}</Text> absent
        </Text>
        {totals.earningsToday > 0 ? (
          <Text style={styles.headerEarnings}>
            Hourly Rs <Text style={styles.headerEarningsVal}>{Math.round(totals.earningsToday).toLocaleString()}</Text>
          </Text>
        ) : null}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
        {branchEmployees.length === 0 ? (
          <Text style={styles.empty}>No active employees at this branch.</Text>
        ) : (
          branchEmployees.map((e) => {
            const entry = todayEntryForEmployee(e.id);
            const totalsLive =
              entry && entry.checkOutAt === null && e.employmentType === 'hourly' && e.hourlyRate
                ? {
                    hours: (Date.now() - entry.checkInAt) / 3_600_000,
                    earnings:
                      ((Date.now() - entry.checkInAt) / 3_600_000) * (e.hourlyRate ?? 0),
                  }
                : entry
                  ? totalsForEntry(entry, e)
                  : { hours: 0, earnings: 0 };
            return (
              <AttendanceRow
                key={e.id}
                employee={e}
                entry={entry}
                hours={totalsLive.hours}
                earnings={totalsLive.earnings}
                onCheckIn={() => {
                  checkIn(e.id);
                  Alert.alert('Checked in', `${e.name} marked as IN.`);
                }}
                onCheckOut={() => {
                  Alert.alert(
                    'Check out?',
                    `Mark ${e.name} as done for today?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Check out',
                        onPress: () => checkOut(e.id),
                      },
                    ]
                  );
                }}
              />
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

function AttendanceRow({
  employee,
  entry,
  hours,
  earnings,
  onCheckIn,
  onCheckOut,
}: {
  employee: Employee;
  entry: AttendanceEntry | undefined;
  hours: number;
  earnings: number;
  onCheckIn: () => void;
  onCheckOut: () => void;
}) {
  const role = ROLE_LABELS[employee.role];
  const isIn = entry && entry.checkOutAt === null;
  const isDone = entry && entry.checkOutAt !== null;

  let statusBadge: { bg: string; color: string; label: string };
  if (isIn) statusBadge = { bg: colors.success + '22', color: colors.success, label: 'IN' };
  else if (isDone) statusBadge = { bg: colors.textMuted + '22', color: colors.textMuted, label: 'DONE' };
  else statusBadge = { bg: colors.danger + '15', color: colors.danger, label: 'ABSENT' };

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Ionicons name="person-outline" size={18} color={colors.primaryDark} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {employee.name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {role.en}
        </Text>
        {entry ? (
          <Text style={styles.times}>
            In {formatTime(entry.checkInAt)}
            {entry.checkOutAt
              ? ` · Out ${formatTime(entry.checkOutAt)}`
              : ' · still in'}
            {hours > 0 ? ` · ${hours.toFixed(1)} h` : ''}
            {employee.employmentType === 'hourly' && earnings > 0
              ? ` · Rs ${Math.round(earnings).toLocaleString()}`
              : ''}
          </Text>
        ) : (
          <Text style={styles.notInYet}>Not checked in today</Text>
        )}
      </View>

      <View style={styles.rightCol}>
        <View style={[styles.statusPill, { backgroundColor: statusBadge.bg }]}>
          <Text style={[styles.statusPillText, { color: statusBadge.color }]}>
            {statusBadge.label}
          </Text>
        </View>

        {isDone ? null : isIn ? (
          <Pressable
            onPress={onCheckOut}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionOut,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Ionicons name="exit-outline" size={14} color={colors.warning} />
            <Text style={[styles.actionText, { color: colors.warning }]}>Out</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onCheckIn}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionIn,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Ionicons name="enter-outline" size={14} color={colors.success} />
            <Text style={[styles.actionText, { color: colors.success }]}>In</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 32,
    gap: spacing.sm,
  },
  headerStat: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  headerStatVal: { fontWeight: '900' },
  headerEarnings: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  headerEarningsVal: { color: colors.primaryDark, fontWeight: '900' },

  scroll: { flex: 1 },
  list: { paddingHorizontal: spacing.lg, paddingTop: 4, paddingBottom: spacing.sm },
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
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: fontSizes.body, fontWeight: '800', color: colors.primaryDark },
  sub: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  times: { fontSize: fontSizes.xs, color: colors.text, marginTop: 2 },
  notInYet: { fontSize: fontSizes.xs, color: colors.danger, fontWeight: '600', marginTop: 2 },

  rightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    minWidth: 56,
    alignItems: 'center',
  },
  statusPillText: { fontSize: 10, fontWeight: '900' },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1.5,
  },
  actionIn: { borderColor: colors.success, backgroundColor: colors.success + '10' },
  actionOut: { borderColor: colors.warning, backgroundColor: colors.warning + '10' },
  actionText: { fontSize: 12, fontWeight: '800' },
});
