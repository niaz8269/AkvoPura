/**
 * CGDeliveryScreen — the core delivery flow.
 *
 * Each customer row shows:
 *   - name + today's running total (if delivered already)
 *   - Cans stepper (default = usualCans)
 *   - Gallons stepper (default = usualGallons)
 *   - "Paid in full" toggle (default ON; off = sale on credit)
 *   - swipe-to-confirm
 *
 * Confirming records the delivery, flashes the row green, then reopens steppers
 * for a possible second visit (multi-quantity-per-day support per spec).
 *
 * Top of screen: route tabs + undo-last-delivery button (5-second window).
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { QuantityStepper } from '../../components/QuantityStepper';
import { SwipeToConfirm } from '../../components/SwipeToConfirm';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useCGSalesman } from '../state';
import { RouteTabs } from '../components/RouteTabs';
import { CycleFilter, type CycleFilterValue } from '../components/CycleFilter';
import type { CGCustomer, CGRoute } from '../types';
import { generateAndShareBill, type BillItem } from '../../billing/pdf';
import { useAuth } from '../../auth/AuthContext';

const canIcon = require('../../../assets/brand/14ltr-can.webp');
const gallonIcon = require('../../../assets/brand/19ltr-gallon.webp');

export function CGDeliveryScreen() {
  const {
    customers,
    deliveries,
    deliveriesForCustomer,
    recordDelivery,
    undoLastDelivery,
    vanLoad,
  } = useCGSalesman();

  const [cycle, setCycle] = useState<CycleFilterValue>('all');
  const [route, setRoute] = useState<CGRoute>('hospital');

  const cycleFiltered = useMemo(
    () => (cycle === 'all' ? customers : customers.filter((c) => c.paymentCycle === cycle)),
    [customers, cycle]
  );

  const countByCycle = useMemo(
    () => ({
      all: customers.length,
      daily: customers.filter((c) => c.paymentCycle === 'daily').length,
      weekly: customers.filter((c) => c.paymentCycle === 'weekly').length,
    }),
    [customers]
  );

  const countByRoute = useMemo(
    () => ({
      hospital: cycleFiltered.filter((c) => c.route === 'hospital').length,
      bypass: cycleFiltered.filter((c) => c.route === 'bypass').length,
      others: cycleFiltered.filter((c) => c.route === 'others').length,
    }),
    [cycleFiltered]
  );

  const visible = cycleFiltered.filter((c) => c.route === route);

  return (
    <Screen padded={false}>
      <View style={styles.headerBar}>
        <View style={styles.headerStatRow}>
          <Text style={styles.headerStat}>On van:</Text>
          <Text style={styles.headerStatVal}>{vanLoad.filledCans}</Text>
          <Image source={canIcon} style={styles.headerIcon} resizeMode="contain" />
          <Text style={styles.headerStat}>·</Text>
          <Text style={styles.headerStatVal}>{vanLoad.filledGallons}</Text>
          <Image source={gallonIcon} style={styles.headerIcon} resizeMode="contain" />
        </View>
        {deliveries.length > 0 ? (
          <Pressable
            onPress={() => {
              const last = undoLastDelivery();
              if (last) Alert.alert('Undone', 'Last delivery was undone.');
            }}
            style={({ pressed }) => [
              styles.undoBtn,
              pressed ? styles.undoBtnPressed : null,
            ]}
          >
            <Text style={styles.undoText}>↶ Undo</Text>
          </Pressable>
        ) : null}
      </View>

      <CycleFilter selected={cycle} onSelect={setCycle} counts={countByCycle} />
      <RouteTabs selected={route} onSelect={setRoute} countByRoute={countByRoute} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
        {visible.map((c) => (
          <DeliveryRow
            key={c.id}
            customer={c}
            todaysCans={deliveriesForCustomer(c.id).reduce((s, d) => s + d.cansDelivered, 0)}
            todaysGallons={deliveriesForCustomer(c.id).reduce((s, d) => s + d.gallonsDelivered, 0)}
            onRecord={(input) => recordDelivery(input)}
          />
        ))}

        {visible.length === 0 ? (
          <Text style={styles.empty}>
            No {cycle === 'all' ? '' : cycle + ' '}customers on this route.
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

type DeliveryInput = Parameters<ReturnType<typeof useCGSalesman>['recordDelivery']>[0];
type DeliveryEntry = NonNullable<ReturnType<ReturnType<typeof useCGSalesman>['recordDelivery']>>;

function DeliveryRow({
  customer,
  todaysCans,
  todaysGallons,
  onRecord,
}: {
  customer: CGCustomer;
  todaysCans: number;
  todaysGallons: number;
  onRecord: (input: DeliveryInput) => DeliveryEntry | null;
}) {
  const { user } = useAuth();
  const [cans, setCans] = useState(customer.usualCans);
  const [gallons, setGallons] = useState(customer.usualGallons);
  const [confirmed, setConfirmed] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [lastEntry, setLastEntry] = useState<DeliveryEntry | null>(null);
  const [sharing, setSharing] = useState(false);

  // Delivery only records what was given. Payment is collected on the
  // Collect tab (with empties) — that's where the money flow lives.
  const billed = cans * customer.pricePerCan + gallons * customer.pricePerGallon;
  const canSwipe = cans + gallons > 0;

  // After a successful confirm, hold the green row + Share button for a while,
  // then reset steppers so the salesman can record another visit.
  useEffect(() => {
    if (!confirmed) return;
    const t = setTimeout(() => {
      setConfirmed(false);
      setLastEntry(null);
      setCans(customer.usualCans);
      setGallons(customer.usualGallons);
      setResetKey((k) => k + 1);
    }, 7000);
    return () => clearTimeout(t);
  }, [confirmed, customer.usualCans, customer.usualGallons]);

  const onConfirm = () => {
    const entry = onRecord({
      customerId: customer.id,
      cansDelivered: cans,
      gallonsDelivered: gallons,
      emptyCansCollected: 0,
      emptyGallonsCollected: 0,
      // Payment is captured on the Collect tab — delivery is goods-only.
      cashCollected: 0,
      bankCollected: 0,
    });
    if (entry) {
      setLastEntry(entry);
      setConfirmed(true);
    }
  };

  const onShare = async () => {
    if (!lastEntry) return;
    setSharing(true);
    try {
      const items: BillItem[] = [];
      if (lastEntry.cansDelivered > 0) {
        items.push({
          name: '14 L can',
          qty: lastEntry.cansDelivered,
          unitPrice: customer.pricePerCan,
        });
      }
      if (lastEntry.gallonsDelivered > 0) {
        items.push({
          name: '19 L gallon',
          qty: lastEntry.gallonsDelivered,
          unitPrice: customer.pricePerGallon,
        });
      }
      const ok = await generateAndShareBill({
        billNumber: lastEntry.id.slice(-6).toUpperCase(),
        dateTime: lastEntry.timestamp,
        customerName: customer.name,
        customerAddress: customer.address,
        customerPhone: customer.phone,
        branchName: user?.branch === 'shergarh' ? 'Shergarh' : 'Timergara',
        salesmanName: user?.name,
        items,
        paid: lastEntry.cashCollected,
        credit: lastEntry.amountBilled - lastEntry.cashCollected,
      });
      if (!ok) {
        Alert.alert('Sharing unavailable', 'This device does not support sharing files.');
      }
    } catch (err) {
      Alert.alert('Could not generate PDF', String(err));
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowName} numberOfLines={1}>
            {customer.name}
          </Text>
          {todaysCans + todaysGallons > 0 ? (
            <Text style={styles.rowHistory}>
              Already delivered today: {todaysCans} cans • {todaysGallons} gallons
            </Text>
          ) : (
            <Text style={styles.rowAddress} numberOfLines={1}>
              {customer.address}
            </Text>
          )}
        </View>
        <View style={styles.amountChip}>
          <Text style={styles.amountChipText}>Rs {billed.toLocaleString()}</Text>
        </View>
      </View>

      <QuantityStepper
        label="Cans"

        value={cans}
        onChange={setCans}
        icon={canIcon}
      />
      <QuantityStepper
        label="Gallons"

        value={gallons}
        onChange={setGallons}
        icon={gallonIcon}
      />

      <View style={styles.swipeWrap}>
        <SwipeToConfirm
          key={resetKey}
          labelEn="Swipe to deliver  ›››"

          doneLabelEn="Delivered ✓"

          done={confirmed}
          disabled={!canSwipe}
          onConfirm={onConfirm}
        />
      </View>

      {confirmed && lastEntry ? (
        <Pressable
          onPress={onShare}
          disabled={sharing}
          style={({ pressed }) => [
            styles.shareBtn,
            pressed ? { opacity: 0.85 } : null,
            sharing ? { opacity: 0.6 } : null,
          ]}
        >
          <Ionicons name="share-social" size={18} color={colors.textInverse} />
          <Text style={styles.shareBtnText}>
            {sharing ? 'Generating PDF…' : 'Share bill (PDF / WhatsApp)'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
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
  },
  headerStat: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  headerStatVal: {
    color: colors.primaryDark,
    fontWeight: '800',
    fontSize: 13,
  },
  headerStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIcon: { width: 14, height: 14 },
  undoBtn: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  undoBtnPressed: {
    backgroundColor: colors.warning + '33',
  },
  undoText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
  },
  scroll: { flex: 1 },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: 4,
    paddingBottom: spacing.sm,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xl,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rowName: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  rowAddress: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowHistory: {
    fontSize: fontSizes.xs,
    color: colors.success,
    fontWeight: '700',
    marginTop: 2,
  },
  amountChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.primary + '15',
    marginLeft: spacing.sm,
  },
  amountChipText: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  paidToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1.5,
  },
  paidToggleOn: {
    backgroundColor: colors.success + '15',
    borderColor: colors.success,
  },
  paidToggleOff: {
    backgroundColor: colors.warning + '15',
    borderColor: colors.warning,
  },
  paidPressed: { opacity: 0.85 },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkMark: {
    color: colors.textInverse,
    fontWeight: '900',
    fontSize: 16,
  },
  paidLabel: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: colors.text,
  },
  paidLabelUr: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  paymentBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  payLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  payInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    minHeight: 36,
  },
  payCurrency: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
  },
  payInput: {
    flex: 1,
    paddingVertical: 4,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.primaryDark,
    textAlign: 'right',
  },
  refInput: {
    marginTop: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    fontSize: fontSizes.sm,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  creditLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  creditValue: {
    fontSize: fontSizes.body,
    fontWeight: '900',
    color: colors.success,
  },
  creditValueDanger: { color: colors.danger },

  swipeWrap: {
    marginTop: spacing.sm,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    marginTop: spacing.md,
  },
  shareBtnText: {
    color: colors.textInverse,
    fontSize: fontSizes.sm,
    fontWeight: '800',
  },
});
