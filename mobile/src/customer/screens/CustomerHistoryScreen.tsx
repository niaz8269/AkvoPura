/**
 * CustomerHistoryScreen — past orders + actual deliveries/bills.
 *
 * Two sections: "Orders" (what the customer requested) and "Bills" (what
 * the salesman actually delivered). Bills mix both CG deliveries and
 * Pets bills, sorted newest-first. Pending orders can be cancelled here.
 *
 * All data comes from the backend self-service endpoints (B-20):
 * /orders/mine, /cg/deliveries/mine, /pets/bills/mine. Pull-to-refresh
 * calls portal.refreshMyData() to get up-to-date balances.
 */

import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { useCustomerPortal } from '../state';
import type { CustomerOrder, CustomerOrderStatus } from '../types';
import { generateAndShareBill, type BillItem } from '../../billing/pdf';
import type { CGCustomer, DeliveryEntry } from '../../cg/types';
import type { BillEntry, PetCustomer } from '../../pets/types';

/** Unified bill-feed item — discriminated union for sort + render. */
type FeedItem =
  | { kind: 'cg'; ts: number; row: DeliveryEntry }
  | { kind: 'pet'; ts: number; row: BillEntry };

export function CustomerHistoryScreen() {
  const { user } = useAuth();
  const portal = useCustomerPortal();

  const myOrders = user ? portal.ordersForUser(user.id) : [];

  const cgRecord = portal.myCgRecord;
  const petRecord = portal.myPetRecord;
  const myCgDeliveries = portal.myCgDeliveries;
  const myPetBills = portal.myPetBills;

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([portal.refreshOrders(), portal.refreshMyData()]);
    } finally {
      setRefreshing(false);
    }
  }, [portal]);

  const orderedOrders = [...myOrders].sort((a, b) => b.placedAt - a.placedAt);

  // Merge CG + Pets bills, sorted newest first.
  const feed: FeedItem[] = [
    ...myCgDeliveries.map<FeedItem>((d) => ({ kind: 'cg', ts: d.timestamp, row: d })),
    ...myPetBills.map<FeedItem>((b) => ({ kind: 'pet', ts: b.timestamp, row: b })),
  ].sort((a, b) => b.ts - a.ts);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.titleUr}>تاریخ</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
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
        {feed.length === 0 ? (
          <Empty text="No bills yet. Bills appear here once a delivery is completed." />
        ) : (
          feed.map((item) =>
            item.kind === 'cg' ? (
              <CGBillRow
                key={`cg-${item.row.id}`}
                delivery={item.row}
                customer={cgRecord ?? undefined}
                branch={user?.branch}
              />
            ) : (
              <PetBillRow
                key={`pet-${item.row.id}`}
                bill={item.row}
                customer={petRecord ?? undefined}
                branch={user?.branch}
              />
            )
          )
        )}
      </ScrollView>
    </Screen>
  );
}

function CGBillRow({
  delivery,
  customer,
  branch,
}: {
  delivery: DeliveryEntry;
  customer?: CGCustomer;
  branch?: string;
}) {
  const [sharing, setSharing] = useState(false);

  const onShare = async () => {
    if (!customer) return;
    setSharing(true);
    try {
      const items: BillItem[] = [];
      if (delivery.cansDelivered > 0) {
        items.push({
          name: '14 L can',
          qty: delivery.cansDelivered,
          unitPrice: customer.pricePerCan,
        });
      }
      if (delivery.gallonsDelivered > 0) {
        items.push({
          name: '19 L gallon',
          qty: delivery.gallonsDelivered,
          unitPrice: customer.pricePerGallon,
        });
      }
      const ok = await generateAndShareBill({
        billNumber: delivery.id.slice(-6).toUpperCase(),
        dateTime: delivery.timestamp,
        customerName: customer.name,
        customerAddress: customer.address,
        customerPhone: customer.phone,
        branchName: branch === 'shergarh' ? 'Shergarh' : 'Timergara',
        items,
        paid: delivery.cashCollected,
        credit: delivery.amountBilled - delivery.cashCollected,
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
    <View style={styles.billRow}>
      <View style={styles.billIcon}>
        <Ionicons name="receipt-outline" size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.billLine}>
          {delivery.cansDelivered} cans • {delivery.gallonsDelivered} gallons
        </Text>
        <Text style={styles.billSub}>
          Rs {delivery.amountBilled.toLocaleString()} billed •{' '}
          {delivery.cashCollected < delivery.amountBilled
            ? `Rs ${(delivery.amountBilled - delivery.cashCollected).toLocaleString()} on credit`
            : 'Paid in full'}
        </Text>
        <Text style={styles.billTime}>{formatDateTime(delivery.timestamp)}</Text>
      </View>
      <Pressable
        onPress={onShare}
        disabled={sharing || !customer}
        style={({ pressed }) => [
          styles.billShareBtn,
          pressed ? { opacity: 0.7 } : null,
          sharing ? { opacity: 0.5 } : null,
        ]}
        accessibilityLabel="Share bill PDF"
      >
        <Ionicons name="share-social" size={18} color={colors.primary} />
      </Pressable>
    </View>
  );
}

function PetBillRow({
  bill,
  customer,
  branch,
}: {
  bill: BillEntry;
  customer?: PetCustomer;
  branch?: string;
}) {
  const [sharing, setSharing] = useState(false);
  const credit = bill.amountBilled - bill.cashCollected - bill.bankCollected;

  const onShare = async () => {
    if (!customer) return;
    setSharing(true);
    try {
      const items: BillItem[] = [];
      // Reconstruct unit prices from the snapshotted subtotal so the
      // PDF matches what was actually billed even if pricing has
      // changed since.
      const total600 = bill.pet600Packs;
      const total1500 = bill.pet1500Packs;
      // Fall back to current pricing if we can't infer (e.g., one of
      // the qty fields is 0).
      const price600 =
        total600 > 0 && total1500 === 0
          ? bill.subtotal / total600
          : (customer.pricePet600 ?? 0);
      const price1500 =
        total1500 > 0 && total600 === 0
          ? bill.subtotal / total1500
          : (customer.pricePet1500 ?? 0);
      if (total600 > 0) {
        items.push({ name: '600 ml pack', qty: total600, unitPrice: Math.round(price600) });
      }
      if (total1500 > 0) {
        items.push({ name: '1.5 L pack', qty: total1500, unitPrice: Math.round(price1500) });
      }
      const ok = await generateAndShareBill({
        billNumber: bill.id.slice(-6).toUpperCase(),
        dateTime: bill.timestamp,
        customerName: customer.name,
        customerAddress: customer.address,
        customerPhone: customer.phone,
        branchName: branch === 'shergarh' ? 'Shergarh' : 'Timergara',
        items,
        paid: bill.cashCollected + bill.bankCollected,
        credit: Math.max(0, credit),
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
    <View style={styles.billRow}>
      <View style={styles.billIcon}>
        <Ionicons name="receipt-outline" size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.billLine}>
          {bill.pet600Packs > 0 ? `${bill.pet600Packs} × 600ml ` : ''}
          {bill.pet1500Packs > 0 ? `${bill.pet1500Packs} × 1.5L` : ''}
        </Text>
        <Text style={styles.billSub}>
          Rs {bill.amountBilled.toLocaleString()} billed •{' '}
          {credit > 0
            ? `Rs ${credit.toLocaleString()} on credit`
            : 'Paid in full'}
          {bill.discount > 0 ? ` • Rs ${bill.discount} discount` : ''}
        </Text>
        <Text style={styles.billTime}>{formatDateTime(bill.timestamp)}</Text>
      </View>
      <Pressable
        onPress={onShare}
        disabled={sharing || !customer}
        style={({ pressed }) => [
          styles.billShareBtn,
          pressed ? { opacity: 0.7 } : null,
          sharing ? { opacity: 0.5 } : null,
        ]}
        accessibilityLabel="Share bill PDF"
      >
        <Ionicons name="share-social" size={18} color={colors.primary} />
      </Pressable>
    </View>
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
    paddingTop: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },
  titleUr: { fontSize: fontSizes.body, color: colors.primary },

  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },

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
  billTime: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  billShareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '15',
    borderWidth: 1.5,
    borderColor: colors.primary + '55',
  },
});
