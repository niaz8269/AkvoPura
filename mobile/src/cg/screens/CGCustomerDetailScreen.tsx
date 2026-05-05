/**
 * CGCustomerDetailScreen — full history view for one Cans/Gallons customer.
 *
 * Shows: contact, route, current empties held, debt, all deliveries today,
 * all collections today. (Historical deliveries from previous days come
 * with the backend.)
 */

import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useCGSalesman } from '../state';
import type { PaymentCycle } from '../types';

const canIcon = require('../../../assets/brand/14ltr-can.webp');
const gallonIcon = require('../../../assets/brand/19ltr-gallon.webp');

type Route = { params: { customerId: string } };

export function CGCustomerDetailScreen({ route }: { route: Route }) {
  const { customerById, deliveriesForCustomer, collectionsForCustomer, setPaymentCycle } =
    useCGSalesman();
  const customer = customerById(route.params.customerId);

  if (!customer) {
    return (
      <Screen>
        <Text style={styles.missing}>Customer not found.</Text>
      </Screen>
    );
  }

  const deliveries = deliveriesForCustomer(customer.id);
  const collections = collectionsForCustomer(customer.id);

  const totalCansToday = deliveries.reduce((s, d) => s + d.cansDelivered, 0);
  const totalGallonsToday = deliveries.reduce((s, d) => s + d.gallonsDelivered, 0);
  const totalCashToday = deliveries.reduce((s, d) => s + d.cashCollected, 0);

  return (
    <Screen scroll>
      <View style={styles.headerCard}>
        <Text style={styles.name}>{customer.name}</Text>
        <Text style={styles.meta}>{customer.phone} • {customer.address}</Text>
        {customer.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notes}>{customer.notes}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.statRow}>
        <Stat icon={canIcon} label="Empty cans held" value={customer.emptyCansHeld} />
        <Stat icon={gallonIcon} label="Empty gallons held" value={customer.emptyGallonsHeld} />
      </View>

      <View
        style={[
          styles.debtCard,
          customer.outstandingDebt > 0 ? styles.debtCardActive : null,
        ]}
      >
        <Text style={styles.debtLabel}>Outstanding balance</Text>
        <Text
          style={[
            styles.debtValue,
            customer.outstandingDebt > 0 ? styles.debtValueActive : null,
          ]}
        >
          Rs {customer.outstandingDebt.toLocaleString()}
        </Text>
      </View>

      <Section title="Payment cycle" subtitle="ادائیگی کا چکر">
        <View style={styles.cycleRow}>
          <CycleOption
            value="daily"
            label="Daily"
            labelUr="روزانہ"
            sub="Pays on every visit"
            active={customer.paymentCycle === 'daily'}
            onPress={() => setPaymentCycle(customer.id, 'daily')}
          />
          <CycleOption
            value="weekly"
            label="Weekly"
            labelUr="ہفتہ وار"
            sub="Settles once a week"
            active={customer.paymentCycle === 'weekly'}
            onPress={() => setPaymentCycle(customer.id, 'weekly')}
          />
        </View>
      </Section>

      <Section title="Today's deliveries" subtitle="آج کی ڈیلیوریز">
        {deliveries.length === 0 ? (
          <Text style={styles.empty}>No deliveries yet today.</Text>
        ) : (
          <>
            {deliveries.map((d, idx) => (
              <View key={d.id} style={styles.entryRow}>
                <Text style={styles.entryIndex}>#{idx + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.entryLine}>
                    {d.cansDelivered} cans • {d.gallonsDelivered} gallons
                  </Text>
                  <Text style={styles.entrySub}>
                    Rs {d.amountBilled.toLocaleString()} billed • Rs{' '}
                    {d.cashCollected.toLocaleString()} cash
                  </Text>
                </View>
                <Text style={styles.entryTime}>{formatTime(d.timestamp)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total today</Text>
              <Text style={styles.totalValue}>
                {totalCansToday} cans • {totalGallonsToday} gallons • Rs{' '}
                {totalCashToday.toLocaleString()}
              </Text>
            </View>
          </>
        )}
      </Section>

      <Section title="Today's empty collections" subtitle="آج جمع کیے گئے خالی">
        {collections.length === 0 ? (
          <Text style={styles.empty}>No empties collected yet today.</Text>
        ) : (
          collections.map((c, idx) => (
            <View key={c.id} style={styles.entryRow}>
              <Text style={styles.entryIndex}>#{idx + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryLine}>
                  {c.cansCollected} cans • {c.gallonsCollected} gallons
                </Text>
              </View>
              <Text style={styles.entryTime}>{formatTime(c.timestamp)}</Text>
            </View>
          ))
        )}
      </Section>

      <Section title="Pricing" subtitle="قیمتیں">
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Per can</Text>
          <Text style={styles.priceValue}>Rs {customer.pricePerCan}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Per gallon</Text>
          <Text style={styles.priceValue}>Rs {customer.pricePerGallon}</Text>
        </View>
      </Section>
    </Screen>
  );
}

function CycleOption({
  value,
  label,
  labelUr,
  sub,
  active,
  onPress,
}: {
  value: PaymentCycle;
  label: string;
  labelUr: string;
  sub: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cycleOption,
        active ? styles.cycleOptionActive : null,
        pressed && !active ? { opacity: 0.85 } : null,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <View
        style={[
          styles.cycleRadio,
          active ? styles.cycleRadioActive : null,
        ]}
      >
        {active ? <View style={styles.cycleRadioInner} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cycleLabel, active ? styles.cycleLabelActive : null]}>
          {label}
        </Text>
        <Text style={[styles.cycleLabelUr, active ? styles.cycleLabelUrActive : null]}>
          {labelUr}
        </Text>
        <Text style={[styles.cycleSub, active ? styles.cycleSubActive : null]}>{sub}</Text>
      </View>
    </Pressable>
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

function Stat({
  icon,
  label,
  value,
}: {
  icon: ReturnType<typeof require>;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.statBox}>
      <Image source={icon} style={styles.statIcon} resizeMode="contain" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  missing: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  meta: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  notesBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.statusYellow + '55',
    borderRadius: radii.md,
  },
  notes: {
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statIcon: { width: 40, height: 40, marginBottom: spacing.xs },
  statValue: {
    fontSize: fontSizes.heading,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  debtCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 6,
    borderLeftColor: colors.border,
  },
  debtCardActive: {
    borderLeftColor: colors.danger,
  },
  debtLabel: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  debtValue: {
    fontSize: fontSizes.heading,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xs,
  },
  debtValueActive: {
    color: colors.danger,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  sectionSubtitle: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
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
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  entryIndex: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.primary,
    minWidth: 24,
  },
  entryLine: {
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: colors.text,
  },
  entrySub: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  entryTime: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1.5,
    borderTopColor: colors.primary,
  },
  totalLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  totalValue: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  priceLabel: { fontSize: fontSizes.body, color: colors.text },
  priceValue: { fontSize: fontSizes.body, fontWeight: '800', color: colors.primaryDark },
  cycleRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cycleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cycleOptionActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '15',
  },
  cycleRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleRadioActive: {
    borderColor: colors.accent,
  },
  cycleRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  cycleLabel: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.text,
  },
  cycleLabelActive: { color: colors.primaryDark },
  cycleLabelUr: { fontSize: fontSizes.xs, color: colors.textMuted },
  cycleLabelUrActive: { color: colors.primary },
  cycleSub: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  cycleSubActive: { color: colors.primaryDark },
});
