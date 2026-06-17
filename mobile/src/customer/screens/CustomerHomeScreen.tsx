/**
 * CustomerHomeScreen — landing for the customer portal.
 *
 * Shows: welcome card, outstanding balance, empties currently held, status
 * of any in-flight orders, quick CTA to place a new order, contact info
 * for the assigned route/branch.
 */

import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { useCustomerPortal } from '../state';

const brandLogo = require('../../../assets/brand/akvopura-brand.png');
const canIcon = require('../../../assets/brand/14ltr-can.webp');
const gallonIcon = require('../../../assets/brand/19ltr-gallon.webp');

type Nav = { navigate: (screen: string) => void };

export function CustomerHomeScreen({ navigation }: { navigation: Nav }) {
  const { user } = useAuth();
  const portal = useCustomerPortal();

  // Backend-sourced (B-20). Sums BOTH CG + Pets sides so a customer
  // who owes Rs 100 on cans and Rs 140 on Pets sees the real Rs 240.
  const cgRecord = portal.myCgRecord;
  const petRecord = portal.myPetRecord;

  const myOrders = user ? portal.ordersForUser(user.id) : [];
  const inFlight = myOrders.filter((o) =>
    ['pending', 'assigned', 'in_transit'].includes(o.status)
  );
  const mySubscriptions = user ? portal.subscriptionsForUser(user.id) : [];
  const activeSubs = mySubscriptions.filter((s) => s.active).length;

  const debt = (cgRecord?.outstandingDebt ?? 0) + (petRecord?.outstandingDebt ?? 0);
  const heldCans = cgRecord?.emptyCansHeld ?? 0;
  const heldGallons = cgRecord?.emptyGallonsHeld ?? 0;

  return (
    <Screen scroll>
      <View style={styles.brandRow}>
        <Image source={brandLogo} style={styles.logo} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <Text style={styles.welcome}>Welcome,</Text>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.name}
          </Text>
        </View>
      </View>

      <View style={[styles.balanceCard, debt > 0 ? styles.balanceCardDebt : null]}>
        <Text style={[styles.balanceLabel, debt > 0 ? styles.balanceLabelDebt : null]}>
          {debt > 0 ? 'You owe' : 'You are settled up'}
        </Text>
        <Text style={[styles.balanceLabelUr, debt > 0 ? styles.balanceLabelDebt : null]}>
          {debt > 0 ? '  ' : '  '}
        </Text>
        <Text style={[styles.balanceValue, debt > 0 ? styles.balanceValueDebt : null]}>
          Rs {debt.toLocaleString()}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Empties you're holding</Text>
      <View style={styles.emptyRow}>
        <EmptyStat icon={canIcon} value={heldCans} label="Empty cans" />
        <EmptyStat icon={gallonIcon} value={heldGallons} label="Empty gallons" />
      </View>
      {heldCans + heldGallons > 0 ? (
        <Text style={styles.note}>
          Please hand these to the salesman on the next visit so we can refill them.
        </Text>
      ) : null}

      <Pressable
        onPress={() => navigation.navigate('Order')}
        style={({ pressed }) => [
          styles.ctaCard,
          pressed ? { opacity: 0.9 } : null,
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.ctaTitle}>Place a new order</Text>
          <Text style={styles.ctaSub}>   — pets, cans, or gallons</Text>
        </View>
        <Ionicons name="arrow-forward-circle" size={32} color={colors.textInverse} />
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Subscriptions')}
        style={({ pressed }) => [
          styles.subsCard,
          pressed ? { opacity: 0.9 } : null,
        ]}
      >
        <Ionicons name="repeat-outline" size={22} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.subsTitle}>My subscriptions</Text>
          <Text style={styles.subsSub}>
            {activeSubs > 0
              ? `${activeSubs} active recurring order${activeSubs === 1 ? '' : 's'}`
              : 'Set up auto-orders for products you reorder regularly'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </Pressable>

      {inFlight.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orders in progress</Text>
          {inFlight.map((o) => (
            <View key={o.id} style={styles.orderRow}>
              <View
                style={[
                  styles.statusBadge,
                  o.status === 'in_transit' ? styles.statusInTransit : null,
                  o.status === 'assigned' ? styles.statusAssigned : null,
                ]}
              >
                <Text style={styles.statusText}>{labelForStatus(o.status)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderTotal}>Rs {o.totalAmount.toLocaleString()}</Text>
                <Text style={styles.orderItems}>
                  {o.items
                    .map((it) => `${it.qty} × ${niceProductName(it.productId)}`)
                    .join(', ')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.contactCard}>
        <Ionicons name="call-outline" size={22} color={colors.primaryDark} />
        <View style={{ flex: 1 }}>
          <Text style={styles.contactTitle}>Need help?</Text>
          <Text style={styles.contactSub}>
            File a complaint or chat with your salesman in the Complaints tab.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

function EmptyStat({
  icon,
  value,
  label,
}: {
  icon: ReturnType<typeof require>;
  value: number;
  label: string;
}) {
  return (
    <View style={[styles.emptyStat, value > 0 ? styles.emptyStatActive : null]}>
      <Image source={icon} style={styles.emptyIcon} resizeMode="contain" />
      <Text style={[styles.emptyValue, value > 0 ? styles.emptyValueActive : null]}>
        {value}
      </Text>
      <Text style={styles.emptyLabel}>{label}</Text>
    </View>
  );
}

function labelForStatus(s: string) {
  switch (s) {
    case 'pending':
      return 'Pending';
    case 'assigned':
      return 'Assigned';
    case 'in_transit':
      return 'On the way';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return s;
  }
}

function niceProductName(id: string) {
  switch (id) {
    case 'cans':
      return 'can';
    case 'gallons':
      return 'gallon';
    case 'pet600':
      return '600ml pack';
    case 'pet1500':
      return '1.5L pack';
    default:
      return id;
  }
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  logo: { width: 56, height: 56 },
  welcome: { fontSize: fontSizes.body, color: colors.textMuted },
  welcomeUr: { fontSize: fontSizes.sm, color: colors.textMuted },
  userName: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: spacing.xs,
  },

  balanceCard: {
    backgroundColor: colors.success + '15',
    borderRadius: radii.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    borderLeftWidth: 6,
    borderLeftColor: colors.success,
  },
  balanceCardDebt: {
    backgroundColor: colors.danger + '15',
    borderLeftColor: colors.danger,
  },
  balanceLabel: { fontSize: fontSizes.body, fontWeight: '600', color: colors.success },
  balanceLabelDebt: { color: colors.danger },
  balanceLabelUr: { fontSize: fontSizes.sm, color: colors.success },
  balanceValue: {
    fontSize: fontSizes.display,
    fontWeight: '900',
    color: colors.success,
    marginTop: spacing.sm,
  },
  balanceValueDebt: { color: colors.danger },

  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },
  emptyRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyStat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyStatActive: {
    backgroundColor: colors.warning + '15',
    borderColor: colors.warning,
  },
  emptyIcon: { width: 36, height: 36, marginBottom: spacing.xs },
  emptyValue: {
    fontSize: fontSizes.heading,
    fontWeight: '800',
    color: colors.textMuted,
  },
  emptyValueActive: { color: colors.warning },
  emptyLabel: { fontSize: fontSizes.xs, color: colors.textMuted },
  note: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },

  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginVertical: spacing.md,
  },
  ctaTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.textInverse,
  },
  ctaSub: { fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  subsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary + '15',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  subsTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  subsSub: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  section: { marginTop: spacing.md },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  statusInTransit: { backgroundColor: colors.info + '22' },
  statusAssigned: { backgroundColor: colors.warning + '22' },
  statusText: { fontSize: 10, fontWeight: '800', color: colors.primaryDark },
  orderTotal: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  orderItems: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  contactTitle: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.primaryDark },
  contactSub: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
});
