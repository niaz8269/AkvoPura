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
  View,
} from 'react-native';

import { Screen } from '../../components';
import { QuantityStepper } from '../../components/QuantityStepper';
import { SwipeToConfirm } from '../../components/SwipeToConfirm';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useCGSalesman } from '../state';
import { RouteTabs } from '../components/RouteTabs';
import type { CGCustomer, CGRoute } from '../types';

const canIcon = require('../../../assets/brand/14ltr-can.webp');
const gallonIcon = require('../../../assets/brand/19ltr-gallon.webp');

export function CGDeliveryScreen() {
  const {
    customers,
    customersByRoute,
    deliveries,
    deliveriesForCustomer,
    recordDelivery,
    undoLastDelivery,
    vanLoad,
  } = useCGSalesman();

  const [route, setRoute] = useState<CGRoute>('hospital');

  const countByRoute = useMemo(
    () => ({
      hospital: customers.filter((c) => c.route === 'hospital').length,
      bypass: customers.filter((c) => c.route === 'bypass').length,
      others: customers.filter((c) => c.route === 'others').length,
    }),
    [customers]
  );

  const visible = customersByRoute(route);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Deliver</Text>
            <Text style={styles.titleUr}>ڈیلیور کریں</Text>
          </View>
          <View style={styles.headerStats}>
            <Text style={styles.headerStatLabel}>On van</Text>
            <Text style={styles.headerStatValue}>
              {vanLoad.filledCans}🥫 · {vanLoad.filledGallons}💧
            </Text>
          </View>
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
            <Text style={styles.undoText}>↶ Undo last delivery</Text>
          </Pressable>
        ) : null}
      </View>

      <RouteTabs selected={route} onSelect={setRoute} countByRoute={countByRoute} />

      <ScrollView contentContainerStyle={styles.list}>
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
          <Text style={styles.empty}>No customers on this route.</Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

type DeliveryInput = Parameters<ReturnType<typeof useCGSalesman>['recordDelivery']>[0];

function DeliveryRow({
  customer,
  todaysCans,
  todaysGallons,
  onRecord,
}: {
  customer: CGCustomer;
  todaysCans: number;
  todaysGallons: number;
  onRecord: (input: DeliveryInput) => void;
}) {
  const [cans, setCans] = useState(customer.usualCans);
  const [gallons, setGallons] = useState(customer.usualGallons);
  const [paid, setPaid] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const billed = cans * customer.pricePerCan + gallons * customer.pricePerGallon;
  const canSwipe = cans + gallons > 0;

  // After a successful confirm, briefly show the green row, then reset steppers
  // so the salesman can record another visit to the same customer.
  useEffect(() => {
    if (!confirmed) return;
    const t = setTimeout(() => {
      setConfirmed(false);
      setCans(customer.usualCans);
      setGallons(customer.usualGallons);
      setPaid(true);
      setResetKey((k) => k + 1);
    }, 1600);
    return () => clearTimeout(t);
  }, [confirmed, customer.usualCans, customer.usualGallons]);

  const onConfirm = () => {
    onRecord({
      customerId: customer.id,
      cansDelivered: cans,
      gallonsDelivered: gallons,
      emptyCansCollected: 0,
      emptyGallonsCollected: 0,
      cashCollected: paid ? billed : 0,
    });
    setConfirmed(true);
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
        labelUr="کین"
        value={cans}
        onChange={setCans}
        icon={canIcon}
      />
      <QuantityStepper
        label="Gallons"
        labelUr="گیلن"
        value={gallons}
        onChange={setGallons}
        icon={gallonIcon}
      />

      <Pressable
        onPress={() => setPaid((p) => !p)}
        style={({ pressed }) => [
          styles.paidToggle,
          paid ? styles.paidToggleOn : styles.paidToggleOff,
          pressed ? styles.paidPressed : null,
        ]}
      >
        <View style={[styles.checkBox, paid ? styles.checkBoxOn : null]}>
          {paid ? <Text style={styles.checkMark}>✓</Text> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.paidLabel}>
            {paid ? 'Paid in full' : 'On credit (no cash collected)'}
          </Text>
          <Text style={styles.paidLabelUr}>
            {paid ? 'پوری ادائیگی ہوگئی' : 'ادھار (نقدی نہیں)'}
          </Text>
        </View>
      </Pressable>

      <View style={styles.swipeWrap}>
        <SwipeToConfirm
          key={resetKey}
          labelEn="Swipe to deliver  ›››"
          labelUr="ڈیلیور کرنے کے لیے سوائپ کریں"
          doneLabelEn="Delivered ✓"
          doneLabelUr="ڈیلیور ہو گیا"
          done={confirmed}
          disabled={!canSwipe}
          onConfirm={onConfirm}
        />
      </View>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  titleUr: { fontSize: fontSizes.body, color: colors.primary },
  headerStats: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  headerStatLabel: { fontSize: fontSizes.xs, color: colors.textMuted },
  headerStatValue: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  undoBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  undoBtnPressed: {
    backgroundColor: colors.warning + '33',
  },
  undoText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.warning,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
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
    padding: spacing.lg,
    marginBottom: spacing.lg,
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
  swipeWrap: {
    marginTop: spacing.sm,
  },
});
