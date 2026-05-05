/**
 * CGCollectionScreen — separate sheet for picking up empty containers.
 *
 * Per spec: empties are often picked up on a different visit than the delivery,
 * so this is its own screen. Auto-filters customers who are currently holding
 * empties (others are hidden — nothing to collect).
 *
 * Each row: customer + +/- counters for cans/gallons + swipe-to-confirm.
 * Top of screen shows running totals collected today.
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
import type { CGCustomer } from '../types';

const canIcon = require('../../../assets/brand/14ltr-can.webp');
const gallonIcon = require('../../../assets/brand/19ltr-gallon.webp');

export function CGCollectionScreen() {
  const {
    customers,
    collections,
    recordCollection,
    undoLastCollection,
    vanLoad,
  } = useCGSalesman();

  const customersWithEmpties = useMemo(
    () => customers.filter((c) => c.emptyCansHeld + c.emptyGallonsHeld > 0),
    [customers]
  );

  const totalCansCollected = collections.reduce((s, c) => s + c.cansCollected, 0);
  const totalGallonsCollected = collections.reduce((s, c) => s + c.gallonsCollected, 0);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Collect Empties</Text>
            <Text style={styles.titleUr}>خالی جمع کریں</Text>
          </View>
          <View style={styles.headerStats}>
            <Text style={styles.headerStatLabel}>Today collected</Text>
            <Text style={styles.headerStatValue}>
              {totalCansCollected}🥫 · {totalGallonsCollected}💧
            </Text>
          </View>
        </View>

        <View style={styles.subStatRow}>
          <Text style={styles.subStat}>
            On van empties: {vanLoad.emptyCansAboard} cans · {vanLoad.emptyGallonsAboard} gallons
          </Text>
        </View>

        {collections.length > 0 ? (
          <Pressable
            onPress={() => {
              const last = undoLastCollection();
              if (last) Alert.alert('Undone', 'Last collection was undone.');
            }}
            style={({ pressed }) => [
              styles.undoBtn,
              pressed ? styles.undoBtnPressed : null,
            ]}
          >
            <Text style={styles.undoText}>↶ Undo last collection</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {customersWithEmpties.length === 0 ? (
          <Text style={styles.empty}>
            No customers are holding empties right now. Nothing to collect.
          </Text>
        ) : (
          customersWithEmpties.map((c) => (
            <CollectionRow
              key={c.id}
              customer={c}
              onRecord={(cans, gallons) =>
                recordCollection({
                  customerId: c.id,
                  cansCollected: cans,
                  gallonsCollected: gallons,
                })
              }
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function CollectionRow({
  customer,
  onRecord,
}: {
  customer: CGCustomer;
  onRecord: (cans: number, gallons: number) => void;
}) {
  const [cans, setCans] = useState(customer.emptyCansHeld);
  const [gallons, setGallons] = useState(customer.emptyGallonsHeld);
  const [confirmed, setConfirmed] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Whenever held quantities change (after a previous collection), refresh defaults.
  useEffect(() => {
    if (!confirmed) {
      setCans(customer.emptyCansHeld);
      setGallons(customer.emptyGallonsHeld);
    }
  }, [customer.emptyCansHeld, customer.emptyGallonsHeld, confirmed]);

  // Auto-reset after a successful confirmation.
  useEffect(() => {
    if (!confirmed) return;
    const t = setTimeout(() => {
      setConfirmed(false);
      setResetKey((k) => k + 1);
    }, 1400);
    return () => clearTimeout(t);
  }, [confirmed]);

  const canSwipe = cans + gallons > 0;

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowName} numberOfLines={1}>
            {customer.name}
          </Text>
          <Text style={styles.rowHeld}>
            Holding: {customer.emptyCansHeld} cans • {customer.emptyGallonsHeld} gallons
          </Text>
        </View>
      </View>

      <QuantityStepper
        label="Cans to collect"
        labelUr="کین جمع کرنے ہیں"
        value={cans}
        onChange={setCans}
        max={customer.emptyCansHeld}
        icon={canIcon}
      />
      <QuantityStepper
        label="Gallons to collect"
        labelUr="گیلن جمع کرنے ہیں"
        value={gallons}
        onChange={setGallons}
        max={customer.emptyGallonsHeld}
        icon={gallonIcon}
      />

      <View style={styles.swipeWrap}>
        <SwipeToConfirm
          key={resetKey}
          labelEn="Swipe to collect  ›››"
          labelUr="جمع کرنے کے لیے سوائپ کریں"
          doneLabelEn="Collected ✓"
          doneLabelUr="جمع ہو گیا"
          done={confirmed}
          disabled={!canSwipe}
          onConfirm={() => {
            onRecord(cans, gallons);
            setConfirmed(true);
          }}
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
  title: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },
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
  subStatRow: { marginTop: spacing.sm },
  subStat: { fontSize: fontSizes.xs, color: colors.textMuted },
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
  undoText: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.warning },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
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
  rowHeader: { marginBottom: spacing.sm },
  rowName: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  rowHeld: {
    fontSize: fontSizes.xs,
    color: colors.warning,
    fontWeight: '700',
    marginTop: 2,
  },
  swipeWrap: { marginTop: spacing.md },
});
