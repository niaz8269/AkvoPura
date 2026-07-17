/**
 * CustomerCard — colored card for the Cans/Gallons salesman's customer list.
 *
 * Color encodes status (white / yellow / red / green) per spec.
 * Tap → opens customer detail.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, radii, spacing } from '../../theme';
import { todayLocalDate } from '../../api/cgCustomers';
import type { CGCardStatus, CGCustomer } from '../types';

type Props = {
  customer: CGCustomer;
  status: CGCardStatus;
  onPress: () => void;
  /** Total delivered today across all visits — shown when status is green. */
  todaysCansDelivered?: number;
  todaysGallonsDelivered?: number;
};

export function CustomerCard({
  customer,
  status,
  onPress,
  todaysCansDelivered,
  todaysGallonsDelivered,
}: Props) {
  const palette = STATUS_PALETTE[status];

  const showHeldRow = customer.emptyCansHeld + customer.emptyGallonsHeld > 0;
  const showDebtRow = customer.outstandingDebt > 0;
  const showDeliveredRow =
    status === 'green' &&
    ((todaysCansDelivered ?? 0) > 0 || (todaysGallonsDelivered ?? 0) > 0);

  // Next-visit intent applies only when the stored date is today. Anything
  // older is stale — the salesman skipped a day or the customer never got
  // visited and we don't want to act on outdated instructions.
  const nvFresh = customer.nextVisitDate === todayLocalDate();
  const nvSkip = nvFresh && customer.nextVisitSkip === true;
  const nvCustom =
    nvFresh &&
    !nvSkip &&
    (customer.nextVisitCans != null || customer.nextVisitGallons != null);
  const nvNoteOnly = nvFresh && !nvSkip && !nvCustom && (customer.nextVisitNote?.length ?? 0) > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed ? styles.pressed : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${customer.name}, status ${status}`}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: palette.text }]} numberOfLines={1}>
            {customer.name}
          </Text>
          <Text style={[styles.address, { color: palette.muted }]} numberOfLines={1}>
            {customer.address}
          </Text>
        </View>
        <View
          style={[
            styles.cycleBadge,
            customer.paymentCycle === 'daily'
              ? styles.cycleBadgeDaily
              : styles.cycleBadgeWeekly,
          ]}
        >
          <Text style={styles.cycleBadgeText}>
            {customer.paymentCycle === 'daily' ? 'D' : 'W'}
          </Text>
        </View>
        <View style={[styles.dot, { backgroundColor: palette.dot }]} />
      </View>

      {nvSkip ? (
        <View style={styles.nvChipSkip}>
          <Text style={styles.nvChipSkipText}>SKIP TODAY</Text>
          {customer.nextVisitNote ? (
            <Text style={styles.nvNote}>{customer.nextVisitNote}</Text>
          ) : null}
        </View>
      ) : nvCustom ? (
        <View style={styles.nvChipCustom}>
          <Text style={styles.nvChipCustomText}>
            Wants {customer.nextVisitCans ?? customer.usualCans} cans ·{' '}
            {customer.nextVisitGallons ?? customer.usualGallons} gallons
          </Text>
          {customer.nextVisitNote ? (
            <Text style={styles.nvNote}>{customer.nextVisitNote}</Text>
          ) : null}
        </View>
      ) : nvNoteOnly ? (
        <View style={styles.nvChipNote}>
          <Text style={styles.nvChipNoteText}>Note: {customer.nextVisitNote}</Text>
        </View>
      ) : null}

      {showDeliveredRow ? (
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: palette.text }]}>Delivered today</Text>
          <Text style={[styles.statusValue, { color: palette.text }]}>
            {todaysCansDelivered ?? 0} cans • {todaysGallonsDelivered ?? 0} gallons
          </Text>
        </View>
      ) : null}

      {showHeldRow ? (
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: palette.text }]}>Empties held</Text>
          <Text style={[styles.statusValue, { color: palette.text }]}>
            {customer.emptyCansHeld} cans • {customer.emptyGallonsHeld} gallons
          </Text>
        </View>
      ) : null}

      {showDebtRow ? (
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: palette.text }]}>Outstanding</Text>
          <Text style={[styles.statusValue, { color: palette.text, fontWeight: '800' }]}>
            Rs {customer.outstandingDebt.toLocaleString()}
          </Text>
        </View>
      ) : null}

      {!showHeldRow && !showDebtRow && !showDeliveredRow ? (
        <Text style={[styles.cleanLabel, { color: palette.muted }]}>
          Clean · No dues, no empties
        </Text>
      ) : null}
    </Pressable>
  );
}

type Palette = { bg: string; border: string; text: string; muted: string; dot: string };

const STATUS_PALETTE: Record<CGCardStatus, Palette> = {
  white: {
    bg: colors.statusWhite,
    border: colors.border,
    text: colors.text,
    muted: colors.textMuted,
    dot: colors.border,
  },
  yellow: {
    bg: colors.statusYellow,
    border: '#D9A82F',
    text: '#3F2E00',
    muted: '#6B5300',
    dot: '#B7891F',
  },
  orange: {
    bg: colors.statusOrange,
    border: '#C26D1F',
    text: colors.textInverse,
    muted: 'rgba(255,255,255,0.9)',
    dot: '#FFFFFF',
  },
  red: {
    bg: colors.statusRed,
    border: '#A83A33',
    text: colors.textInverse,
    muted: 'rgba(255,255,255,0.85)',
    dot: '#FFFFFF',
  },
  green: {
    bg: colors.statusGreen,
    border: '#2A9C56',
    text: colors.textInverse,
    muted: 'rgba(255,255,255,0.9)',
    dot: '#FFFFFF',
  },
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: fontSizes.body,
    fontWeight: '800',
  },
  address: {
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: spacing.sm,
  },
  cycleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    marginLeft: spacing.sm,
    minWidth: 24,
    alignItems: 'center',
  },
  cycleBadgeDaily: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  cycleBadgeWeekly: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  cycleBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  statusLabel: {
    fontSize: fontSizes.sm,
  },
  statusValue: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  cleanLabel: {
    fontSize: fontSizes.sm,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  nvChipSkip: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.md,
    backgroundColor: colors.danger,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  nvChipSkipText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  nvChipCustom: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.md,
    backgroundColor: colors.warning,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  nvChipCustomText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '900',
  },
  nvChipNote: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.md,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  nvChipNoteText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  nvNote: {
    color: colors.textInverse,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
