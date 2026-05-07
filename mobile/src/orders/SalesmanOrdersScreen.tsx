/**
 * SalesmanOrdersScreen — orders the manager has assigned to this salesman.
 *
 * Shared by both Pets and CG salesman navigators. The list comes from
 * /orders, which the backend auto-scopes to the caller (assigned ones
 * only when the caller is a salesman).
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { Screen } from '../components';
import { colors, fontSizes, radii, spacing } from '../theme';
import { ApiError } from '../api/client';
import { listOrders } from '../api/orders';
import { useCustomerPortal } from '../customer/state';
import type { CustomerOrder, CustomerOrderStatus } from '../customer/types';

const PRODUCT_LABELS: Record<string, string> = {
  cans: 'Cans',
  gallons: 'Gallons',
  pet600: '600 ml packs',
  pet1500: '1.5 L packs',
};

const STATUS_TONE: Record<CustomerOrderStatus, 'warn' | 'success' | 'info' | 'danger' | 'muted'> = {
  pending: 'warn',
  assigned: 'info',
  in_transit: 'warn',
  delivered: 'success',
  cancelled: 'muted',
};

const STATUS_LABEL: Record<CustomerOrderStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_transit: 'In transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function SalesmanOrdersScreen() {
  const { markInTransit, markDelivered } = useCustomerPortal();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      // Backend auto-scopes for salesman role: returns only orders
      // assigned to me.
      const fresh = await listOrders();
      setOrders(fresh);
    } catch (e: unknown) {
      const msg =
        e instanceof ApiError
          ? e.code === 'network_error'
            ? 'Cannot reach the server. Check Wi-Fi.'
            : `Server error: ${e.message}`
          : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading && orders.length === 0) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your assigned orders…</Text>
        </View>
      </Screen>
    );
  }

  // Active orders first, then delivered/cancelled.
  const active = orders.filter(
    (o) => o.status === 'assigned' || o.status === 'in_transit',
  );
  const completed = orders.filter(
    (o) => o.status === 'delivered' || o.status === 'cancelled',
  );

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>My orders</Text>
        <Text style={styles.titleUr}>میرے آرڈرز</Text>
        <Text style={styles.subtitle}>
          {active.length} active · {completed.length} done today
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={20} color={colors.danger} />
            <Text style={styles.errorMsg}>{error}</Text>
          </View>
        ) : null}

        {orders.length === 0 ? (
          <Text style={styles.empty}>
            No orders assigned to you yet. The manager will assign new orders here.
          </Text>
        ) : null}

        {active.length > 0 ? (
          <Text style={styles.sectionLabel}>To do</Text>
        ) : null}
        {active.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            onInTransit={() => {
              Alert.alert('Mark in transit?', 'You are on your way.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Yes', onPress: () => markInTransit(o.id) },
              ]);
            }}
            onDelivered={() => {
              Alert.alert('Mark delivered?', 'This will close the order.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delivered',
                  style: 'default',
                  onPress: () => markDelivered(o.id),
                },
              ]);
            }}
          />
        ))}

        {completed.length > 0 ? (
          <Text style={styles.sectionLabel}>Completed</Text>
        ) : null}
        {completed.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </ScrollView>
    </Screen>
  );
}

function OrderCard({
  order,
  onInTransit,
  onDelivered,
}: {
  order: CustomerOrder;
  onInTransit?: () => void;
  onDelivered?: () => void;
}) {
  const tone = STATUS_TONE[order.status];
  const itemsLine = order.items
    .map((it) => `${it.qty} × ${PRODUCT_LABELS[it.productId] ?? it.productId}`)
    .join(' · ');

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.amount}>Rs {order.totalAmount.toLocaleString()}</Text>
          <Text style={styles.itemsLine}>{itemsLine}</Text>
        </View>
        <View style={[styles.statusChip, statusChipStyle(tone)]}>
          <Text style={[styles.statusChipText, statusChipTextStyle(tone)]}>
            {STATUS_LABEL[order.status]}
          </Text>
        </View>
      </View>

      {order.preferredTime ? (
        <Text style={styles.metaLine}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />{' '}
          Preferred: {order.preferredTime}
        </Text>
      ) : null}
      {order.notes ? (
        <Text style={styles.metaLine}>
          <Ionicons name="chatbubble-outline" size={12} color={colors.textMuted} />{' '}
          {order.notes}
        </Text>
      ) : null}

      {order.status === 'assigned' && onInTransit ? (
        <Pressable
          onPress={onInTransit}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionBtnPrimary,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Ionicons name="car" size={18} color={colors.textInverse} />
          <Text style={styles.actionBtnText}>Start delivery (in transit)</Text>
        </Pressable>
      ) : null}

      {order.status === 'in_transit' && onDelivered ? (
        <Pressable
          onPress={onDelivered}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionBtnSuccess,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Ionicons name="checkmark-circle" size={18} color={colors.textInverse} />
          <Text style={styles.actionBtnText}>Mark delivered</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function statusChipStyle(tone: 'warn' | 'success' | 'info' | 'danger' | 'muted') {
  switch (tone) {
    case 'success': return { backgroundColor: colors.success + '22' };
    case 'warn':    return { backgroundColor: colors.warning + '22' };
    case 'info':    return { backgroundColor: colors.info + '22' };
    case 'danger':  return { backgroundColor: colors.danger + '22' };
    case 'muted':   return { backgroundColor: colors.surfaceMuted };
  }
}
function statusChipTextStyle(tone: 'warn' | 'success' | 'info' | 'danger' | 'muted') {
  switch (tone) {
    case 'success': return { color: colors.success };
    case 'warn':    return { color: colors.warning };
    case 'info':    return { color: colors.info };
    case 'danger':  return { color: colors.danger };
    case 'muted':   return { color: colors.textMuted };
  }
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.textMuted, fontSize: fontSizes.sm },

  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },
  titleUr: { fontSize: fontSizes.body, color: colors.primary, marginTop: 2 },
  subtitle: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 4 },

  body: { padding: spacing.lg },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger + '18',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorMsg: { fontSize: fontSizes.sm, color: colors.danger, fontWeight: '700' },

  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xl,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  amount: { fontSize: fontSizes.heading, fontWeight: '900', color: colors.primaryDark },
  itemsLine: { fontSize: fontSizes.sm, color: colors.text, marginTop: 4 },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  statusChipText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  metaLine: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 6 },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.md,
  },
  actionBtnPrimary: { backgroundColor: colors.primary },
  actionBtnSuccess: { backgroundColor: colors.success },
  actionBtnText: { color: colors.textInverse, fontWeight: '800', fontSize: fontSizes.body },
});
