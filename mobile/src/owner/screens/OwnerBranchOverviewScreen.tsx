/**
 * OwnerBranchOverviewScreen — drill-down for one branch.
 *
 * Shows: cash card, sales breakdown (Pets vs C/G), inventory snapshot,
 * customer / debt summary, expense status counts.
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useOwnerData } from '../computed';
import { useEmployees } from '../../employees/state';
import type { BranchKey, BranchSummary } from '../types';

type Route = { params: { branch: BranchKey } };

export function OwnerBranchOverviewScreen({ route }: { route: Route }) {
  const { timergara, shergarh } = useOwnerData();
  const summary = route.params.branch === 'timergara' ? timergara : shergarh;
  const isLive = route.params.branch === 'timergara';

  const { employeesByBranch, todayEntryForEmployee, totalsForEntry } = useEmployees();
  const branchEmployees = employeesByBranch(route.params.branch);
  const activeEmployees = branchEmployees.filter((e) => e.active);

  let inCount = 0;
  let doneCount = 0;
  let absentCount = 0;
  let monthlyPayroll = 0;
  let hourlyEarningsToday = 0;

  activeEmployees.forEach((e) => {
    const entry = todayEntryForEmployee(e.id);
    if (!entry) absentCount++;
    else if (entry.checkOutAt === null) inCount++;
    else doneCount++;

    if (e.employmentType === 'salaried' && e.monthlySalary) {
      monthlyPayroll += e.monthlySalary;
    }
    if (e.employmentType === 'hourly' && entry?.checkOutAt) {
      hourlyEarningsToday += totalsForEntry(entry, e).earnings;
    }
  });

  return (
    <Screen scroll>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.branchName}>{summary.name.en} Branch</Text>
            <Text style={styles.branchNameUr}>{summary.name.ur} برانچ</Text>
          </View>
          {isLive ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          ) : (
            <View style={styles.demoBadge}>
              <Text style={styles.demoText}>DEMO</Text>
            </View>
          )}
        </View>
        {!isLive ? (
          <Text style={styles.demoNote}>
            Synthetic numbers — real Shergarh data lights up once a Shergarh
            salesman starts logging activity.
          </Text>
        ) : null}
      </View>

      <View style={styles.cashCard}>
        <Text style={styles.cashLabel}>Cash collected today</Text>
        <Text style={styles.cashValue}>
          Rs {summary.cashCollectedToday.toLocaleString()}
        </Text>
        {summary.amountBilledToday !== summary.cashCollectedToday ? (
          <Text style={styles.cashSub}>
            Billed Rs {summary.amountBilledToday.toLocaleString()} • Credit Rs{' '}
            {(summary.amountBilledToday - summary.cashCollectedToday).toLocaleString()}
          </Text>
        ) : null}
      </View>

      <Section title="Pets sales" subtitle="پیٹس فروخت">
        <Row label="Bills today" value={summary.petsBills} />
        <Row label="600 ml packs" value={summary.pet600PacksSold} />
        <Row label="1.5 L packs" value={summary.pet1500PacksSold} last />
      </Section>

      <Section title="Cans / Gallons activity" subtitle="کین / گیلن سرگرمی">
        <Row label="Deliveries" value={summary.cgDeliveries} />
        <Row label="Cans delivered" value={summary.cansDelivered} />
        <Row label="Gallons delivered" value={summary.gallonsDelivered} />
        <Row label="Empty cans returned" value={summary.emptyCansCollected} />
        <Row label="Empty gallons returned" value={summary.emptyGallonsCollected} last />
      </Section>

      <Section title="Customers" subtitle="کسٹمرز">
        <Row label="Total customers" value={summary.customerCount} />
        <Row
          label="In debt"
          value={summary.customersInDebt}
          warn={summary.customersInDebt > 0}
        />
        <Row
          label="Total outstanding"
          value={`Rs ${summary.totalDebt.toLocaleString()}`}
          warn={summary.totalDebt > 0}
          last
        />
      </Section>

      <Section title="Employees" subtitle="ملازمین">
        <Row label="Total active" value={activeEmployees.length} />
        <Row
          label="In today"
          value={inCount}
          success={inCount > 0}
        />
        <Row
          label="Done today"
          value={doneCount}
        />
        <Row
          label="Absent today"
          value={absentCount}
          warn={absentCount > 0}
        />
        <Row
          label="Monthly payroll"
          value={`Rs ${monthlyPayroll.toLocaleString()}`}
        />
        {hourlyEarningsToday > 0 ? (
          <Row
            label="Hourly earned today"
            value={`Rs ${Math.round(hourlyEarningsToday).toLocaleString()}`}
            last
          />
        ) : (
          <Row label="Hourly earned today" value="—" last />
        )}
      </Section>

      <Section title="Expenses" subtitle="اخراجات">
        <Row label="Pending (manager inbox)" value={summary.pendingExpenses} />
        <Row label="Approved" value={summary.expensesApproved} success />
        <Row label="Rejected" value={summary.expensesRejected} />
        <Row
          label="Forwarded to Owner"
          value={summary.forwardedToOwner}
          warn={summary.forwardedToOwner > 0}
        />
        <Row
          label="Approved total"
          value={`Rs ${summary.expenseTotalApproved.toLocaleString()}`}
          last
        />
      </Section>
    </Screen>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  warn,
  success,
  last,
}: {
  label: string;
  value: number | string;
  warn?: boolean;
  success?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last ? styles.rowLast : null]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          warn ? styles.rowValueWarn : null,
          success ? styles.rowValueSuccess : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

// Suppress unused imports if any
void Ionicons;

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  branchName: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },
  branchNameUr: { fontSize: fontSizes.sm, color: colors.primary, marginTop: 2 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.success + '22',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  liveText: { fontSize: 10, fontWeight: '900', color: colors.success },
  demoBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  demoText: { fontSize: 10, fontWeight: '900', color: colors.textMuted },
  demoNote: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },

  cashCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  cashLabel: { color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.body, fontWeight: '600' },
  cashValue: {
    color: colors.textInverse,
    fontSize: fontSizes.display,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  cashSub: { color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.sm, marginTop: spacing.sm },

  section: { marginBottom: spacing.lg },
  sectionHeader: { marginBottom: spacing.sm },
  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  sectionSubtitle: { fontSize: fontSizes.xs, color: colors.textMuted },
  sectionBody: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: fontSizes.sm, color: colors.text, flex: 1 },
  rowValue: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  rowValueWarn: { color: colors.danger },
  rowValueSuccess: { color: colors.success },
});
