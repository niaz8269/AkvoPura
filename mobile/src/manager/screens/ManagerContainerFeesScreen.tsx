/**
 * ManagerContainerFeesScreen — charge customers for lost / damaged
 * cans or gallons. Per spec checklist item #14.
 *
 * Lists every CG customer currently holding empties. For each row the
 * manager picks how many cans + gallons to charge for; the system
 * multiplies by the per-unit fee (set in Owner Settings), removes the
 * containers from the customer's empties-held count, and adds the total
 * charge to their outstanding debt.
 */

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { QuantityStepper } from '../../components/QuantityStepper';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { useCGSalesman } from '../../cg/state';
import { usePricing } from '../../pricing/state';
import type { CGCustomer } from '../../cg/types';

export function ManagerContainerFeesScreen() {
  const { user } = useAuth();
  const { customers, chargeContainerLoss } = useCGSalesman();
  const { fees } = usePricing();

  const branchCustomers = useMemo(
    () =>
      customers.filter(
        (c) =>
          (!user?.branch || true /* branch info not on CG customer yet */) &&
          c.emptyCansHeld + c.emptyGallonsHeld > 0
      ),
    [customers, user?.branch]
  );

  return (
    <Screen padded={false}>
      <View style={styles.intro}>
        <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
        <Text style={styles.introText}>
          Charge a customer for cans/gallons they cannot return. Fees are set
          in Owner → Settings. Charging removes the empties from the customer
          and adds the total to their outstanding debt.
        </Text>
      </View>

      <View style={styles.feesBar}>
        <Text style={styles.feesText}>
          Per can: <Text style={styles.feesVal}>Rs {fees.lostCanFee.toLocaleString()}</Text>
          {'   ·   '}
          Per gallon: <Text style={styles.feesVal}>Rs {fees.lostGallonFee.toLocaleString()}</Text>
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.list}>
        {branchCustomers.length === 0 ? (
          <Text style={styles.empty}>
            No customers are currently holding empties.
          </Text>
        ) : (
          branchCustomers.map((c) => (
            <ChargeRow
              key={c.id}
              customer={c}
              perCan={fees.lostCanFee}
              perGallon={fees.lostGallonFee}
              onCharge={(cans, gallons, total) => {
                chargeContainerLoss(c.id, cans, gallons, total);
                Alert.alert(
                  'Charged',
                  `Rs ${total.toLocaleString()} added to ${c.name}'s balance.`
                );
              }}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function ChargeRow({
  customer,
  perCan,
  perGallon,
  onCharge,
}: {
  customer: CGCustomer;
  perCan: number;
  perGallon: number;
  onCharge: (cans: number, gallons: number, total: number) => void;
}) {
  const [cans, setCans] = useState(0);
  const [gallons, setGallons] = useState(0);
  const total = cans * perCan + gallons * perGallon;

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {customer.name}
          </Text>
          <Text style={styles.held}>
            Holding: {customer.emptyCansHeld} cans · {customer.emptyGallonsHeld} gallons
          </Text>
        </View>
      </View>

      <QuantityStepper
        label="Cans to charge"

        value={cans}
        onChange={setCans}
        max={customer.emptyCansHeld}
      />
      <QuantityStepper
        label="Gallons to charge"

        value={gallons}
        onChange={setGallons}
        max={customer.emptyGallonsHeld}
      />

      <View style={styles.totalLine}>
        <Text style={styles.totalLabel}>Charge total</Text>
        <Text style={styles.totalValue}>Rs {total.toLocaleString()}</Text>
      </View>

      <Pressable
        onPress={() => {
          if (cans + gallons === 0) return;
          Alert.alert(
            'Charge customer?',
            `Add Rs ${total.toLocaleString()} to ${customer.name}'s outstanding balance and remove ${cans} cans + ${gallons} gallons from their empties held.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Charge',
                style: 'destructive',
                onPress: () => onCharge(cans, gallons, total),
              },
            ]
          );
        }}
        disabled={cans + gallons === 0}
        style={({ pressed }) => [
          styles.chargeBtn,
          cans + gallons === 0 ? styles.chargeBtnDisabled : null,
          pressed && cans + gallons > 0 ? { opacity: 0.85 } : null,
        ]}
      >
        <Ionicons name="cash-outline" size={18} color={colors.textInverse} />
        <Text style={styles.chargeBtnText}>Apply charge</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: colors.primary + '10',
    margin: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  introText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.text,
    lineHeight: 20,
  },

  feesBar: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
  },
  feesText: { fontSize: fontSizes.xs, color: colors.textMuted },
  feesVal: { fontWeight: '900', color: colors.warning },

  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
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

  row: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  rowHeader: { marginBottom: spacing.sm },
  name: { fontSize: fontSizes.body, fontWeight: '800', color: colors.primaryDark },
  held: { fontSize: fontSizes.xs, color: colors.warning, fontWeight: '700', marginTop: 2 },

  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { fontSize: fontSizes.sm, color: colors.textMuted },
  totalValue: {
    fontSize: fontSizes.title,
    fontWeight: '900',
    color: colors.warning,
  },

  chargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.warning,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.md,
  },
  chargeBtnDisabled: {
    backgroundColor: colors.border,
  },
  chargeBtnText: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.textInverse,
  },
});
