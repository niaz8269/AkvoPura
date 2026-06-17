/**
 * PetsCustomerDetailScreen — full history view for one Pets customer.
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { usePetsSalesman } from '../state';

type Route = { params: { customerId: string } };

export function PetsCustomerDetailScreen({ route }: { route: Route }) {
  const { customerById, billsForCustomer, returnsForCustomer, priceFor } =
    usePetsSalesman();
  const customer = customerById(route.params.customerId);

  if (!customer) {
    return (
      <Screen>
        <Text style={styles.missing}>Customer not found.</Text>
      </Screen>
    );
  }

  const bills = billsForCustomer(customer.id);
  const rets = returnsForCustomer(customer.id);

  const cans600Today = bills.reduce((s, b) => s + b.pet600Packs, 0);
  const cans1500Today = bills.reduce((s, b) => s + b.pet1500Packs, 0);
  const cashToday = bills.reduce((s, b) => s + b.cashCollected, 0);
  const billedToday = bills.reduce((s, b) => s + b.amountBilled, 0);
  const refundsToday = rets.reduce((s, r) => s + r.refundAmount, 0);

  return (
    <Screen scroll>
      <View style={styles.headerCard}>
        <Text style={styles.name}>{customer.name}</Text>
        <Text style={styles.meta}>{customer.phone} • {customer.address}</Text>
        <Text style={styles.area}>Area: {customer.area}</Text>
        {customer.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notes}>{customer.notes}</Text>
          </View>
        ) : null}
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

      <Section title="Today's bills" subtitle="  ">
        {bills.length === 0 ? (
          <Text style={styles.empty}>No bills today.</Text>
        ) : (
          <>
            {bills.map((b, idx) => (
              <View key={b.id} style={styles.entryRow}>
                <Text style={styles.entryIndex}>#{idx + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.entryLine}>
                    {b.pet600Packs} × 600ml • {b.pet1500Packs} × 1.5L
                  </Text>
                  <Text style={styles.entrySub}>
                    Rs {b.amountBilled.toLocaleString()} billed • Rs{' '}
                    {b.cashCollected.toLocaleString()} cash
                  </Text>
                </View>
                <Text style={styles.entryTime}>{formatTime(b.timestamp)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {cans600Today} × 600ml • {cans1500Today} × 1.5L • Rs{' '}
                {cashToday.toLocaleString()}/{billedToday.toLocaleString()}
              </Text>
            </View>
          </>
        )}
      </Section>

      <Section title="Today's returns" subtitle="  ">
        {rets.length === 0 ? (
          <Text style={styles.empty}>No returns today.</Text>
        ) : (
          <>
            {rets.map((r, idx) => (
              <View key={r.id} style={styles.entryRow}>
                <Text style={styles.entryIndex}>#{idx + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.entryLine}>
                    {r.pet600Packs} × 600ml • {r.pet1500Packs} × 1.5L
                  </Text>
                  <Text style={styles.entrySub}>
                    Refund Rs {r.refundAmount.toLocaleString()}
                    {r.reason ? ` • ${r.reason}` : ''}
                  </Text>
                </View>
                <Text style={styles.entryTime}>{formatTime(r.timestamp)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total refund</Text>
              <Text style={styles.totalValue}>Rs {refundsToday.toLocaleString()}</Text>
            </View>
          </>
        )}
      </Section>

      <Section title="Pricing" subtitle="">
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>600 ml pack</Text>
          <Text style={styles.priceValue}>Rs {priceFor(customer, 'pet600')}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>1.5 L pack</Text>
          <Text style={styles.priceValue}>Rs {priceFor(customer, 'pet1500')}</Text>
        </View>
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
      <View style={{ marginBottom: spacing.sm }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.sectionBody}>{children}</View>
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
  name: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },
  meta: { fontSize: fontSizes.sm, color: colors.textMuted, marginTop: spacing.xs },
  area: { fontSize: fontSizes.xs, color: colors.primary, marginTop: spacing.xs, fontWeight: '700' },
  notesBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.statusYellow + '55',
    borderRadius: radii.md,
  },
  notes: { fontSize: fontSizes.sm, color: colors.text },
  debtCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 6,
    borderLeftColor: colors.border,
  },
  debtCardActive: { borderLeftColor: colors.danger },
  debtLabel: { fontSize: fontSizes.sm, color: colors.textMuted },
  debtValue: {
    fontSize: fontSizes.heading,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xs,
  },
  debtValueActive: { color: colors.danger },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSizes.body, fontWeight: '800', color: colors.primaryDark },
  sectionSubtitle: { fontSize: fontSizes.xs, color: colors.textMuted },
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
  entryLine: { fontSize: fontSizes.body, fontWeight: '600', color: colors.text },
  entrySub: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  entryTime: { fontSize: fontSizes.xs, color: colors.textMuted },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1.5,
    borderTopColor: colors.primary,
  },
  totalLabel: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.primaryDark },
  totalValue: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.primaryDark },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  priceLabel: { fontSize: fontSizes.body, color: colors.text },
  priceValue: { fontSize: fontSizes.body, fontWeight: '800', color: colors.primaryDark },
});
