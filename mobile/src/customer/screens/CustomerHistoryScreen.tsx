/**
 * CustomerHistoryScreen — past orders + actual deliveries/bills.
 *
 * Two sections: "Orders" (what the customer requested) and "Bills" (what
 * the salesman actually delivered, drawn from the CG provider).
 * Pending orders can be cancelled here.
 */

import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { useCGSalesman } from '../../cg/state';
import { useCustomerPortal } from '../state';
import type { CustomerOrder, CustomerOrderStatus } from '../types';

export function CustomerHistoryScreen() {
  const { user } = useAuth();
  const cg = useCGSalesman();
  const portal = useCustomerPortal();

  const myOrders = user ? portal.ordersForUser(user.id) : [];

  const myDeliveries = user?.linkedCgCustomerId
    ? cg.deliveriesForCustomer(user.linkedCgCustomerId)
    : [];

  const orderedOrders = [...myOrders].sort((a, b) => b.placedAt - a.placedAt);
  const orderedDeliveries = [...myDeliveries].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.titleUr}>تاریخ</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <SectionTitle text="Your orders" subtitle="آپ کے آرڈر" />
        {orderedOrders.length === 0 ? (
          <Empty text="No orders yet. Tap Order to place one." />
        ) : (
          orderedOrders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onCancel={() => {
                Alert.alert(
                  'Cancel order?',
                  `Cancel this Rs ${o.totalAmount.toLocaleString()} order?`,
                  [
                    { text: 'Keep', style: 'cancel' },
                    {
                      text: 'Cancel order',
                      style: 'destructive',
                      onPress: () => portal.cancelOrder(o.id),
                    },
                  ]
                );
              }}
            />
          ))
        )}

        <SectionTitle text="Bills you've received" subtitle="آپ کے بل" />
        {orderedDeliveries.length === 0 ? (
          <Empty text="No deliveries logged yet." />
        ) : (
          orderedDeliveries.map((d) => (
            <View key={d.id} style={styles.billRow}>
              <View style={styles.billIcon}>
                <Ionicons name="receipt-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.billLine}>
                  {d.cansDelivered} cans • {d.gallonsDelivered} gallons
                </Text>
                <Text style={styles.billSub}>
                  Rs {d.amountBilled.toLocaleString()} billed •{' '}
                  {d.cashCollected < d.amountBilled
                    ? `Rs ${(d.amountBilled - d.cashCollected).toLocaleString()} on credit`
                    : 'Paid in full'}
                </Text>
              </View>
              <Text style={styles.billTime}>{formatDateTime(d.timestamp)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function OrderCard({
  order,
  onCancel,
}: {
  order: CustomerOrder;
  onCancel: () => void;
}) {
  const meta = STATUS_META[order.status];
  return (
    <View style={[styles.orderCard, { borderLeftColor: meta.color }]}>
      <View style={styles.orderHeader}>
        <View style={[styles.statusChip, { backgroundColor: meta.color + '22' }]}>
          <Text style={[styles.statusChipText, { color: meta.color }]}>
            {meta.label}
          </Text>
        </View>
        <Text style={styles.orderTime}>{formatDateTime(order.placedAt)}</Text>
      </View>
      <Text style={styles.orderTotal}>Rs {order.totalAmount.toLocaleString()}</Text>
      {order.items.map((it, i) => (
        <Text key={i} style={styles.orderItem}>
          • {it.qty} × {productLabel(it.productId)} @ Rs {it.unitPrice}
        </Text>
      ))}
      {order.preferredTime ? (
        <Text style={styles.orderMeta}>
          ⏰ Preferred: {order.preferredTime}
        </Text>
      ) : null}
      {order.notes ? <Text style={styles.orderMeta}>📝 {order.notes}</Text> : null}

      {order.status === 'pending' ? (
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [
            styles.cancelBtn,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
          <Text style={styles.cancelText}>Cancel order</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function SectionTitle({ text, subtitle }: { text: string; subtitle: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.sectionTitle}>{text}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

function productLabel(id: string) {
  switch (id) {
    case 'cans':
      return '14L can';
    case 'gallons':
      return '19L gallon';
    case 'pet600':
      return '600ml pack';
    case 'pet1500':
      return '1.5L pack';
    default:
      return id;
  }
}

function formatDateTime(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const same =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (same) {
    return `Today ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

const STATUS_META: Record<CustomerOrderStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: colors.textMuted },
  assigned: { label: 'Assigned', color: colors.warning },
  in_transit: { label: 'On the way', color: colors.info },
  delivered: { label: 'Delivered', color: colors.success },
  cancelled: { label: 'Cancelled', color: colors.danger },
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },
  titleUr: { fontSize: fontSizes.body, color: colors.primary },

  body: { padding: spacing.lg, paddingBottom: spacing.xxxl },

  sectionTitleWrap: { marginTop: spacing.md, marginBottom: spacing.sm },
  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  sectionSubtitle: { fontSize: fontSizes.xs, color: colors.textMuted },
  empty: {
    fontStyle: 'italic',
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    paddingVertical: spacing.lg,
    textAlign: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
  },

  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  statusChipText: { fontSize: 10, fontWeight: '900' },
  orderTime: { fontSize: fontSizes.xs, color: colors.textMuted },
  orderTotal: {
    fontSize: fontSizes.title,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  orderItem: { fontSize: fontSizes.sm, color: colors.text, marginTop: 4 },
  orderMeta: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.danger,
    marginTop: spacing.md,
  },
  cancelText: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.danger },

  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  billIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  billLine: { fontSize: fontSizes.body, fontWeight: '700', color: colors.text },
  billSub: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  billTime: { fontSize: fontSizes.xs, color: colors.textMuted },
});
