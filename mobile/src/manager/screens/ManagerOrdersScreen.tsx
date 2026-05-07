/**
 * ManagerOrdersScreen — orders inbox for the branch manager.
 *
 * Customers place orders from the Customer portal. This is where the manager
 * sees them, assigns to a salesman (Pets or Cans/Gallons depending on the
 * items), and walks the status forward (assigned → in-transit → delivered).
 *
 * Three tab sections: New (pending) / Active (assigned + in-transit) / Done
 * (delivered or cancelled).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useCustomerPortal } from '../../customer/state';
import { listUsers, type ApiUser } from '../../api/users';
import type {
  CustomerOrder,
  CustomerOrderItem,
  CustomerOrderStatus,
} from '../../customer/types';

type Tab = 'pending' | 'active' | 'done';

const TAB_LABELS: Record<Tab, string> = {
  pending: 'New',
  active: 'Active',
  done: 'Done',
};

const STATUS_BUCKET: Record<CustomerOrderStatus, Tab> = {
  pending: 'pending',
  assigned: 'active',
  in_transit: 'active',
  delivered: 'done',
  cancelled: 'done',
};

export function ManagerOrdersScreen() {
  const { orders, assignOrder, markInTransit, markDelivered, managerCancelOrder } =
    useCustomerPortal();
  const [tab, setTab] = useState<Tab>('pending');
  const [salesmen, setSalesmen] = useState<ApiUser[]>([]);

  // Pull all branch salesmen for the assignment dropdown.
  useEffect(() => {
    Promise.all([
      listUsers({ role: 'pets_salesman' }),
      listUsers({ role: 'cans_gallons_salesman' }),
    ])
      .then(([pets, cg]) => {
        setSalesmen([...pets, ...cg].filter((u) => u.active));
      })
      .catch(() => {
        setSalesmen([]);
      });
  }, []);

  const counts = useMemo(() => {
    const c = { pending: 0, active: 0, done: 0 };
    orders.forEach((o) => c[STATUS_BUCKET[o.status]]++);
    return c;
  }, [orders]);

  const visible = useMemo(
    () =>
      orders
        .filter((o) => STATUS_BUCKET[o.status] === tab)
        .sort((a, b) => b.placedAt - a.placedAt),
    [orders, tab]
  );

  return (
    <Screen padded={false}>
      <View style={styles.tabRow}>
        {(['pending', 'active', 'done'] as Tab[]).map((t) => {
          const active = t === tab;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={({ pressed }) => [
                styles.tab,
                active ? styles.tabActive : null,
                pressed && !active ? styles.tabPressed : null,
              ]}
            >
              <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>
                {TAB_LABELS[t]} · {counts[t]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
        {visible.length === 0 ? (
          <Text style={styles.empty}>No {TAB_LABELS[tab].toLowerCase()} orders.</Text>
        ) : (
          visible.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              salesmen={salesmen}
              onAssign={(salesmanId) => assignOrder(o.id, salesmanId)}
              onInTransit={() => markInTransit(o.id)}
              onDelivered={() => markDelivered(o.id)}
              onCancel={(note) => managerCancelOrder(o.id, note)}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function OrderCard({
  order,
  salesmen,
  onAssign,
  onInTransit,
  onDelivered,
  onCancel,
}: {
  order: CustomerOrder;
  salesmen: ApiUser[];
  onAssign: (salesmanId: string) => void;
  onInTransit: () => void;
  onDelivered: () => void;
  onCancel: (note?: string) => void;
}) {
  // Suggested salesman category based on items
  const hasPets = order.items.some((it) => it.productId === 'pet600' || it.productId === 'pet1500');
  const hasCG = order.items.some((it) => it.productId === 'cans' || it.productId === 'gallons');

  const candidates = useMemo(() => {
    return salesmen.filter((u) => {
      if (hasPets && !hasCG) return u.role === 'pets_salesman';
      if (hasCG && !hasPets) return u.role === 'cans_gallons_salesman';
      // Mixed → either type
      return u.role === 'pets_salesman' || u.role === 'cans_gallons_salesman';
    });
  }, [hasPets, hasCG, salesmen]);

  const assignedSalesman =
    order.assignedSalesmanName ??
    salesmen.find((u) => u.id === order.assignedSalesmanId)?.name;

  // Use the snapshotted name from the order; fall back to "Customer".
  const customerName = order.customerName ?? 'Customer';

  const meta = STATUS_META[order.status];

  return (
    <View style={[styles.card, { borderLeftColor: meta.color }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusChip, { backgroundColor: meta.color + '22' }]}>
          <Text style={[styles.statusChipText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <Text style={styles.timeText}>{formatTime(order.placedAt)}</Text>
      </View>

      <View style={styles.customerRow}>
        <Text style={styles.customer}>{customerName}</Text>
        {order.notes?.startsWith('From subscription') ? (
          <View style={styles.subBadge}>
            <Ionicons name="repeat" size={10} color={colors.primary} />
            <Text style={styles.subBadgeText}>Subscription</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.itemsBlock}>
        {order.items.map((it, i) => (
          <Text key={i} style={styles.itemLine}>
            • {it.qty} × {productLabel(it.productId)} @ Rs {it.unitPrice}
          </Text>
        ))}
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>Rs {order.totalAmount.toLocaleString()}</Text>
      </View>

      {order.preferredTime ? (
        <Text style={styles.metaLine}>⏰ {order.preferredTime}</Text>
      ) : null}
      {order.notes ? <Text style={styles.metaLine}>📝 {order.notes}</Text> : null}
      {order.managerNote ? (
        <Text style={[styles.metaLine, styles.managerNote]}>
          Cancelled: {order.managerNote}
        </Text>
      ) : null}

      {assignedSalesman ? (
        <View style={styles.assignedRow}>
          <Ionicons name="person-circle-outline" size={18} color={colors.primaryDark} />
          <Text style={styles.assignedText}>
            Assigned to <Text style={styles.assignedTextBold}>{assignedSalesman}</Text>
          </Text>
        </View>
      ) : null}

      {/* Action area */}
      {order.status === 'pending' ? (
        <View style={styles.assignBlock}>
          <Text style={styles.assignTitle}>Assign to salesman</Text>
          <View style={styles.assignPills}>
            {candidates.map((u) => (
              <Pressable
                key={u.id}
                onPress={() => onAssign(u.id)}
                style={({ pressed }) => [
                  styles.assignPill,
                  pressed ? { opacity: 0.85 } : null,
                ]}
              >
                <Ionicons name="person-outline" size={14} color={colors.primary} />
                <Text style={styles.assignPillText}>{u.name}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={() =>
              Alert.alert('Cancel order?', 'The customer will see this as cancelled.', [
                { text: 'No', style: 'cancel' },
                {
                  text: 'Cancel order',
                  style: 'destructive',
                  onPress: () => onCancel('Cancelled by manager'),
                },
              ])
            }
            style={({ pressed }) => [
              styles.cancelLink,
              pressed ? { opacity: 0.7 } : null,
            ]}
          >
            <Ionicons name="close-circle-outline" size={14} color={colors.danger} />
            <Text style={styles.cancelLinkText}>Cancel order</Text>
          </Pressable>
        </View>
      ) : null}

      {order.status === 'assigned' ? (
        <View style={styles.actionRow}>
          <Pressable
            onPress={() =>
              Alert.alert('Mark in-transit?', `Notify customer that ${assignedSalesman ?? 'salesman'} is on the way?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Yes', onPress: onInTransit },
              ])
            }
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionInfo,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Ionicons name="navigate-outline" size={16} color={colors.info} />
            <Text style={[styles.actionBtnText, { color: colors.info }]}>On the way</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              Alert.alert('Mark delivered?', `Confirm ${assignedSalesman ?? 'salesman'} delivered this order?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Mark delivered', onPress: onDelivered },
              ])
            }
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionSuccess,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
            <Text style={[styles.actionBtnText, { color: colors.success }]}>Delivered</Text>
          </Pressable>
        </View>
      ) : null}

      {order.status === 'in_transit' ? (
        <Pressable
          onPress={() =>
            Alert.alert('Mark delivered?', 'Confirm order has been delivered?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Mark delivered', onPress: onDelivered },
            ])
          }
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionSuccess,
            { alignSelf: 'stretch', marginTop: spacing.sm },
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
          <Text style={[styles.actionBtnText, { color: colors.success }]}>
            Mark delivered
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const STATUS_META: Record<CustomerOrderStatus, { label: string; color: string }> = {
  pending: { label: 'New', color: colors.warning },
  assigned: { label: 'Assigned', color: colors.info },
  in_transit: { label: 'On the way', color: colors.primary },
  delivered: { label: 'Delivered', color: colors.success },
  cancelled: { label: 'Cancelled', color: colors.danger },
};

function productLabel(id: CustomerOrderItem['productId']) {
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

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  tabPressed: { backgroundColor: colors.surfaceMuted },
  tabText: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  tabTextActive: { color: colors.textInverse },

  scroll: { flex: 1 },
  list: { paddingHorizontal: spacing.lg, paddingTop: 4, paddingBottom: spacing.sm },
  empty: {
    fontStyle: 'italic',
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  statusChipText: { fontSize: 10, fontWeight: '900' },
  timeText: { fontSize: fontSizes.xs, color: colors.textMuted },

  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  customer: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  subBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.primary + '15',
  },
  subBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  itemsBlock: { marginTop: spacing.xs, marginBottom: spacing.xs },
  itemLine: { fontSize: fontSizes.sm, color: colors.text, marginTop: 2 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
  totalLabel: { fontSize: fontSizes.sm, color: colors.textMuted },
  totalValue: { fontSize: fontSizes.body, fontWeight: '800', color: colors.primaryDark },
  metaLine: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  managerNote: { color: colors.danger, fontStyle: 'normal', fontWeight: '700' },

  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.md,
    marginTop: spacing.sm,
  },
  assignedText: { fontSize: fontSizes.xs, color: colors.text },
  assignedTextBold: { fontWeight: '800', color: colors.primaryDark },

  assignBlock: { marginTop: spacing.sm },
  assignTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  assignPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  assignPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  assignPillText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  cancelLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  cancelLinkText: { fontSize: 11, fontWeight: '700', color: colors.danger },

  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  actionInfo: { borderColor: colors.info, backgroundColor: colors.info + '10' },
  actionSuccess: { borderColor: colors.success, backgroundColor: colors.success + '10' },
  actionBtnText: { fontSize: 12, fontWeight: '800' },
});
