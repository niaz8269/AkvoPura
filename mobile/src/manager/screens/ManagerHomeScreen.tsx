/**
 * ManagerHomeScreen — today overview for the branch manager.
 *
 * Shows: branch name, alert badges (pending expenses, customers in debt),
 * today's combined cash + delivery stats from BOTH salesman types,
 * recent activity feed, and quick-action buttons.
 */

import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { useCGSalesman } from '../../cg/state';
import { usePetsSalesman } from '../../pets/state';
import { useManager } from '../state';
import { useCustomerPortal } from '../../customer/state';
import { useProduction } from '../../production/state';
import { generateAndShareDailyReport } from '../../analytics/dailyExport';
import { runningOutSoon } from '../../analytics/inventoryForecast';
import { strings } from '../../i18n/strings';
import { useBranchName } from '../../branches/useBranchNames';
import { HIGH_VALUE_THRESHOLD } from '../demoData';

const brandLogo = require('../../../assets/brand/akvopura-brand.png');

type Nav = { navigate: (screen: string) => void };

export function ManagerHomeScreen({ navigation }: { navigation: Nav }) {
  const { user } = useAuth();
  const cg = useCGSalesman();
  const pets = usePetsSalesman();
  const manager = useManager();
  const { pendingExpenses } = manager;
  const [exporting, setExporting] = useState(false);
  const { orders, complaints } = useCustomerPortal();
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const activeOrders = orders.filter(
    (o) => o.status === 'assigned' || o.status === 'in_transit'
  ).length;
  const openComplaints = complaints.filter((c) => c.status === 'open').length;
  const { batches, lowStock, rawMaterials } = useProduction();
  const runningOut = runningOutSoon(rawMaterials, batches, 7);
  const todayBatches = batches.filter((b) => {
    const d = new Date(b.loggedAt);
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }).length;
  const lowStockCount = lowStock().length;
  const customersHoldingEmpties = cg.customers.filter(
    (c) => c.emptyCansHeld + c.emptyGallonsHeld > 0
  ).length;

  const cgCash = cg.deliveries.reduce((s, d) => s + d.cashCollected, 0);
  const petsCash = pets.bills.reduce((s, b) => s + b.cashCollected, 0);
  const totalCash = cgCash + petsCash;

  const cgDeliveries = cg.deliveries.length;
  const petsBills = pets.bills.length;

  const cgDebt = cg.customers.reduce((s, c) => s + c.outstandingDebt, 0);
  const petsDebt = pets.customers.reduce((s, c) => s + c.outstandingDebt, 0);
  const totalDebt = cgDebt + petsDebt;

  const highValueExpenses = pendingExpenses.filter((e) => e.amount >= HIGH_VALUE_THRESHOLD).length;

  const nameForBranch = useBranchName();
  const branchName = nameForBranch(user?.branch);

  const exportDay = async () => {
    setExporting(true);
    try {
      const ok = await generateAndShareDailyReport({
        branchName,
        cgCustomers: cg.customers,
        petCustomers: pets.customers,
        deliveries: cg.deliveries,
        collections: cg.collections,
        bills: pets.bills,
        returns: pets.returns,
        expenses: manager.expenses,
      });
      if (!ok) {
        Alert.alert('Sharing unavailable', 'This device does not support file sharing.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      Alert.alert('Export failed', msg);
    } finally {
      setExporting(false);
    }
  };

  const recentActivity = useMemo(() => {
    type Item = { id: string; kind: string; line: string; time: number };
    const items: Item[] = [];
    cg.deliveries.slice(-5).forEach((d) => {
      const c = cg.customerById(d.customerId);
      items.push({
        id: 'a-' + d.id,
        kind: 'CG delivery',
        line: `${c?.name ?? 'Customer'} — ${d.cansDelivered} cans, ${d.gallonsDelivered} gallons`,
        time: d.timestamp,
      });
    });
    pets.bills.slice(-5).forEach((b) => {
      const c = pets.customerById(b.customerId);
      items.push({
        id: 'a-' + b.id,
        kind: 'Pets bill',
        line: `${c?.name ?? 'Customer'} — ${b.pet600Packs} × 600ml, ${b.pet1500Packs} × 1.5L`,
        time: b.timestamp,
      });
    });
    return items.sort((a, b) => b.time - a.time).slice(0, 8);
  }, [cg.deliveries, pets.bills, cg.customerById, pets.customerById]);

  return (
    <Screen scroll>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Image source={brandLogo} style={styles.logo} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={styles.branchTitle}>
              {branchName || 'Branch'} Branch
            </Text>
            <Text style={styles.branchSub}>
              Manager: {user?.name}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cashCard}>
        <Text style={styles.cashLabel}>Cash collected today</Text>
        <Text style={styles.cashValue}>Rs {totalCash.toLocaleString()}</Text>
        <View style={styles.cashSplit}>
          <Text style={styles.cashSplitText}>
            Pets Rs {petsCash.toLocaleString()} • Cans/Gallons Rs {cgCash.toLocaleString()}
          </Text>
        </View>
        <Pressable
          onPress={exporting ? undefined : exportDay}
          style={({ pressed }) => [
            styles.exportBtn,
            pressed ? { opacity: 0.85 } : null,
          ]}
          accessibilityLabel="Export day report"
        >
          <Ionicons
            name={exporting ? 'hourglass-outline' : 'share-outline'}
            size={16}
            color={colors.primaryDark}
          />
          <Text style={styles.exportBtnText}>
            {exporting ? 'Generating PDF…' : 'Export day as PDF'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.kpiRow}>
        <Kpi label="Pets bills" value={petsBills} />
        <Kpi label="C/G deliveries" value={cgDeliveries} />
      </View>

      <Pressable
        onPress={() => navigation.navigate('Trips')}
        style={({ pressed }) => [
          styles.assignmentsCard,
          pressed ? { opacity: 0.85 } : null,
        ]}
      >
        <View style={styles.assignmentsHeader}>
          <Text style={styles.assignmentsTitle}>Trips & assignments</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
        </View>
        <Text style={styles.assignmentsSub}>
          Assign trips to salesmen, see who's on the road, review closed trips.
        </Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Production')}
        style={({ pressed }) => [
          styles.productionCard,
          pressed ? { opacity: 0.85 } : null,
        ]}
      >
        <View style={styles.productionHeader}>
          <Text style={styles.productionTitle}>Production today</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
        </View>
        <View style={styles.productionRow}>
          <View style={styles.productionItem}>
            <Ionicons name="hammer-outline" size={16} color={colors.primary} />
            <Text style={styles.productionValue}>{todayBatches}</Text>
            <Text style={styles.productionLabel}>batches</Text>
          </View>
          <View style={styles.productionDivider} />
          <View style={styles.productionItem}>
            <Ionicons
              name="alert-circle-outline"
              size={16}
              color={lowStockCount > 0 ? colors.danger : colors.textMuted}
            />
            <Text
              style={[
                styles.productionValue,
                lowStockCount > 0 ? { color: colors.danger } : null,
              ]}
            >
              {lowStockCount}
            </Text>
            <Text style={styles.productionLabel}>low stock</Text>
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('ContainerFees')}
        style={({ pressed }) => [
          styles.feesLink,
          pressed ? { opacity: 0.85 } : null,
        ]}
      >
        <Ionicons name="cash-outline" size={20} color={colors.warning} />
        <View style={{ flex: 1 }}>
          <Text style={styles.feesLinkTitle}>Lost / damaged container fees</Text>
          <Text style={styles.feesLinkSub}>
            {customersHoldingEmpties} customer{customersHoldingEmpties === 1 ? '' : 's'} currently holding empties
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
      </Pressable>

      {pendingOrders > 0 || activeOrders > 0 || openComplaints > 0 || lowStockCount > 0 || runningOut.length > 0 || pendingExpenses.length > 0 || totalDebt > 0 ? (
        <View style={styles.alertSection}>
          {pendingOrders > 0 || activeOrders > 0 ? (
            <Pressable
              onPress={() => navigation.navigate('Orders')}
              style={({ pressed }) => [
                styles.alertCard,
                pendingOrders > 0 ? styles.alertWarn : styles.alertInfo,
                pressed ? styles.alertPressed : null,
              ]}
            >
              <Ionicons
                name="cart-outline"
                size={28}
                color={pendingOrders > 0 ? colors.warning : colors.info}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>
                  {pendingOrders > 0
                    ? `${pendingOrders} new customer order${pendingOrders === 1 ? '' : 's'}`
                    : `${activeOrders} order${activeOrders === 1 ? '' : 's'} in progress`}
                </Text>
                <Text style={styles.alertSub}>
                  {pendingOrders > 0
                    ? 'Tap to assign to a salesman'
                    : 'Tap to update status'}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={pendingOrders > 0 ? colors.warning : colors.info}
              />
            </Pressable>
          ) : null}

          {lowStockCount > 0 ? (
            <Pressable
              onPress={() => navigation.navigate('Production')}
              style={({ pressed }) => [
                styles.alertCard,
                styles.alertDanger,
                pressed ? styles.alertPressed : null,
              ]}
            >
              <Ionicons name="warning-outline" size={28} color={colors.danger} />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>
                  {lowStockCount} raw material{lowStockCount === 1 ? '' : 's'} low
                </Text>
                <Text style={styles.alertSub}>Tap to receive stock</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.danger} />
            </Pressable>
          ) : null}

          {runningOut.length > 0 ? (
            <Pressable
              onPress={() => navigation.navigate('Production')}
              style={({ pressed }) => [
                styles.alertCard,
                styles.alertWarn,
                pressed ? styles.alertPressed : null,
              ]}
            >
              <Ionicons name="trending-down-outline" size={28} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>
                  {runningOut.length} material{runningOut.length === 1 ? '' : 's'} running out soon
                </Text>
                <Text style={styles.alertSub}>
                  {runningOut
                    .slice(0, 2)
                    .map((f) => `${f.name} ~${f.daysRemaining}d`)
                    .join(' · ')}
                  {runningOut.length > 2 ? '…' : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.warning} />
            </Pressable>
          ) : null}

          {openComplaints > 0 ? (
            <Pressable
              onPress={() => navigation.navigate('Complaints')}
              style={({ pressed }) => [
                styles.alertCard,
                styles.alertWarn,
                pressed ? styles.alertPressed : null,
              ]}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>
                  {openComplaints} open complaint{openComplaints === 1 ? '' : 's'}
                </Text>
                <Text style={styles.alertSub}>Tap to review and resolve</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.warning} />
            </Pressable>
          ) : null}

          {pendingExpenses.length > 0 ? (
            <Pressable
              onPress={() => navigation.navigate('Expenses')}
              style={({ pressed }) => [
                styles.alertCard,
                styles.alertWarn,
                pressed ? styles.alertPressed : null,
              ]}
            >
              <Ionicons name="alert-circle-outline" size={28} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>
                  {pendingExpenses.length} pending expense
                  {pendingExpenses.length === 1 ? '' : 's'}
                </Text>
                <Text style={styles.alertSub}>
                  Awaiting your approval
                  {highValueExpenses > 0
                    ? ` • ${highValueExpenses} high-value item${
                        highValueExpenses === 1 ? '' : 's'
                      }`
                    : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.warning} />
            </Pressable>
          ) : null}

          {totalDebt > 0 ? (
            <Pressable
              onPress={() => navigation.navigate('Customers')}
              style={({ pressed }) => [
                styles.alertCard,
                styles.alertDanger,
                pressed ? styles.alertPressed : null,
              ]}
            >
              <Ionicons name="cash-outline" size={28} color={colors.danger} />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>
                  Rs {totalDebt.toLocaleString()} outstanding
                </Text>
                <Text style={styles.alertSub}>Across customers in debt</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.danger} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          {recentActivity.length > 0 ? (
            <Pressable
              onPress={() => navigation.navigate('Trips')}
              style={({ pressed }) => [
                styles.viewAllBtn,
                pressed ? { opacity: 0.7 } : null,
              ]}
              accessibilityLabel="View full activity feed"
            >
              <Text style={styles.viewAllText}>View all</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.sectionBody}>
          {recentActivity.length === 0 ? (
            <Text style={styles.empty}>No deliveries yet today.</Text>
          ) : (
            recentActivity.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => navigation.navigate('Trips')}
                style={({ pressed }) => [
                  styles.activityRow,
                  pressed ? { backgroundColor: colors.surfaceMuted } : null,
                ]}
                accessibilityLabel={`Open trips — ${a.line}`}
              >
                <View
                  style={[
                    styles.activityKindChip,
                    a.kind === 'Pets bill' ? styles.chipPets : styles.chipCg,
                  ]}
                >
                  <Text style={styles.activityKindText}>{a.kind}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityLine} numberOfLines={1}>
                    {a.line}
                  </Text>
                </View>
                <Text style={styles.activityTime}>{formatTime(a.time)}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.textMuted}
                  style={{ marginLeft: 4 }}
                />
              </Pressable>
            ))
          )}
        </View>
      </View>
    </Screen>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logo: { width: 52, height: 52 },
  branchTitle: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  branchSub: { fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },

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
    marginTop: spacing.sm,
  },
  cashSplit: { marginTop: spacing.sm },
  cashSplitText: { color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.sm },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  exportBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.primaryDark,
  },

  kpiRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  kpi: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: fontSizes.display,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  kpiLabel: { fontSize: fontSizes.xs, color: colors.textMuted, textAlign: 'center' },

  alertSection: { marginBottom: spacing.md, gap: spacing.sm },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderLeftWidth: 6,
  },
  alertWarn: {
    backgroundColor: colors.warning + '15',
    borderLeftColor: colors.warning,
  },
  alertInfo: {
    backgroundColor: colors.info + '15',
    borderLeftColor: colors.info,
  },
  alertDanger: {
    backgroundColor: colors.danger + '15',
    borderLeftColor: colors.danger,
  },
  alertPressed: { opacity: 0.85 },
  alertTitle: { fontSize: fontSizes.body, fontWeight: '800', color: colors.text },
  alertSub: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },

  section: { marginTop: spacing.md },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionBody: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  empty: {
    fontStyle: 'italic',
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    paddingVertical: spacing.sm,
    textAlign: 'center',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityKindChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    minWidth: 76,
    alignItems: 'center',
  },
  chipPets: { backgroundColor: colors.accent + '22' },
  chipCg: { backgroundColor: colors.primary + '22' },
  activityKindText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  activityLine: { fontSize: fontSizes.sm, color: colors.text },
  activityTime: { fontSize: fontSizes.xs, color: colors.textMuted },

  assignmentsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  assignmentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  assignmentsTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  assignmentsSub: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 4,
  },
  assignmentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  assignmentDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  assignmentLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  assignmentName: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 1,
  },

  productionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  productionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  productionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  productionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productionItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  productionDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  productionValue: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  productionLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },

  feesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.warning + '12',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  feesLinkTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  feesLinkSub: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
});
