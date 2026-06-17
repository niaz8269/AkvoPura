/**
 * CustomerSubscriptionsScreen — recurring orders for regular customers
 * (hospitals, offices, restaurants).
 *
 * The customer picks products + quantities + frequency (Daily / Weekly +
 * weekday). Saved subscriptions are listed; tap "Run now" to manually
 * create today's order from a subscription (real auto-scheduling lands
 * with the backend slice).
 */

import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BilingualButton, Screen } from '../../components';
import { QuantityStepper } from '../../components/QuantityStepper';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { useCustomerPortal } from '../state';
import type {
  CustomerOrderItem,
  Subscription,
  SubscriptionFrequency,
} from '../types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CustomerSubscriptionsScreen() {
  const { user } = useAuth();
  const {
    subscriptionsForUser,
    createSubscription,
    cancelSubscription,
    runSubscriptionNow,
  } = useCustomerPortal();

  const myList = user ? subscriptionsForUser(user.id) : [];
  const active = myList.filter((s) => s.active);
  const inactive = myList.filter((s) => !s.active);

  const [creating, setCreating] = useState(false);

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.intro}>
            <Ionicons name="repeat" size={18} color={colors.primary} />
            <Text style={styles.introText}>
              Set up recurring orders for products you reorder regularly. Saves
              you from manually placing the same order every visit.
            </Text>
          </View>

          {!creating ? (
            <Pressable
              onPress={() => setCreating(true)}
              style={({ pressed }) => [
                styles.createBtn,
                pressed ? { opacity: 0.85 } : null,
              ]}
            >
              <Ionicons name="add-circle" size={22} color={colors.textInverse} />
              <Text style={styles.createBtnText}>New subscription</Text>
            </Pressable>
          ) : (
            <NewSubscriptionForm
              onCancel={() => setCreating(false)}
              onCreate={async (items, frequency, weekday, notes) => {
                if (!user) return;
                try {
                  await createSubscription({
                    customerUserId: user.id,
                    items,
                    frequency,
                    weekday,
                    notes,
                  });
                  setCreating(false);
                  Alert.alert(
                    'Subscription saved',
                    frequency === 'daily'
                      ? 'A new order will be created for you every day at 6 AM.'
                      : `A new order will be created for you every ${WEEKDAYS[weekday ?? 1]} morning. Tap "Run now" any time for an extra one.`,
                  );
                } catch (e: unknown) {
                  Alert.alert(
                    'Could not save',
                    e instanceof Error ? e.message : 'Unknown error',
                  );
                }
              }}
            />
          )}

          <Text style={styles.sectionTitle}>
            Active ({active.length})
          </Text>
          {active.length === 0 ? (
            <Text style={styles.empty}>No active subscriptions yet.</Text>
          ) : (
            active.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                subscription={sub}
                onRun={async () => {
                  const order = await runSubscriptionNow(sub.id);
                  if (order) {
                    Alert.alert(
                      'Order placed',
                      `Today's order from this subscription is on its way to the manager.`
                    );
                  }
                }}
                onCancel={() => {
                  Alert.alert(
                    'Cancel subscription?',
                    'You can always create a new one. Past orders from this subscription stay in History.',
                    [
                      { text: 'Keep', style: 'cancel' },
                      {
                        text: 'Cancel',
                        style: 'destructive',
                        onPress: () => cancelSubscription(sub.id),
                      },
                    ]
                  );
                }}
              />
            ))
          )}

          {inactive.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Cancelled ({inactive.length})</Text>
              {inactive.map((sub) => (
                <SubscriptionCard key={sub.id} subscription={sub} />
              ))}
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function NewSubscriptionForm({
  onCreate,
  onCancel,
}: {
  onCreate: (
    items: CustomerOrderItem[],
    frequency: SubscriptionFrequency,
    weekday: number | undefined,
    notes: string | undefined
  ) => void | Promise<void>;
  onCancel: () => void;
}) {
  const { catalog } = useCustomerPortal();
  const [qtys, setQtys] = useState<Record<string, number>>({
    cans: 0,
    gallons: 0,
    pet600: 0,
    pet1500: 0,
  });
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('weekly');
  const [weekday, setWeekday] = useState(1); // Mon

  const totalItems = Object.values(qtys).reduce((s, v) => s + v, 0);
  const total = catalog.reduce(
    (s, p) => s + (qtys[p.id] ?? 0) * p.defaultPrice,
    0
  );

  const submit = () => {
    const items = catalog
      .filter((p) => (qtys[p.id] ?? 0) > 0)
      .map((p) => ({
        productId: p.id,
        qty: qtys[p.id] ?? 0,
        unitPrice: p.defaultPrice,
      }));
    if (items.length === 0) return;
    onCreate(items, frequency, frequency === 'weekly' ? weekday : undefined, undefined);
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>New subscription</Text>

      <Text style={styles.fieldLabel}>Frequency</Text>
      <View style={styles.freqRow}>
        <Pressable
          onPress={() => setFrequency('daily')}
          style={({ pressed }) => [
            styles.freqPill,
            frequency === 'daily' ? styles.freqPillActive : null,
            pressed && frequency !== 'daily' ? { opacity: 0.7 } : null,
          ]}
        >
          <Text
            style={[
              styles.freqText,
              frequency === 'daily' ? styles.freqTextActive : null,
            ]}
          >
            Daily
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFrequency('weekly')}
          style={({ pressed }) => [
            styles.freqPill,
            frequency === 'weekly' ? styles.freqPillActive : null,
            pressed && frequency !== 'weekly' ? { opacity: 0.7 } : null,
          ]}
        >
          <Text
            style={[
              styles.freqText,
              frequency === 'weekly' ? styles.freqTextActive : null,
            ]}
          >
            Weekly
          </Text>
        </Pressable>
      </View>

      {frequency === 'weekly' ? (
        <>
          <Text style={styles.fieldLabel}>Day of week</Text>
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((label, idx) => {
              const active = idx === weekday;
              return (
                <Pressable
                  key={idx}
                  onPress={() => setWeekday(idx)}
                  style={({ pressed }) => [
                    styles.weekdayPill,
                    active ? styles.weekdayPillActive : null,
                    pressed && !active ? { opacity: 0.7 } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.weekdayText,
                      active ? styles.weekdayTextActive : null,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Products</Text>
      {catalog.map((p) => (
        <View key={p.id} style={{ marginBottom: 4 }}>
          <QuantityStepper
            label={`${p.nameEn} (Rs ${p.defaultPrice})`}
            value={qtys[p.id] ?? 0}
            onChange={(n) => setQtys((q) => ({ ...q, [p.id]: n }))}
          />
        </View>
      ))}

      <View style={styles.totalLine}>
        <Text style={styles.totalLabel}>Per-run total</Text>
        <Text style={styles.totalValue}>Rs {total.toLocaleString()}</Text>
      </View>

      <View style={styles.formActions}>
        <BilingualButton
          label={{ en: 'Cancel' }}
          variant="secondary"
          onPress={onCancel}
          style={{ flex: 1 }}
        />
        <View style={{ width: spacing.md }} />
        <BilingualButton
          label={{ en: 'Save subscription' }}
          onPress={submit}
          disabled={totalItems === 0}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

function SubscriptionCard({
  subscription,
  onRun,
  onCancel,
}: {
  subscription: Subscription;
  onRun?: () => void;
  onCancel?: () => void;
}) {
  const summary =
    subscription.frequency === 'daily'
      ? 'Every day'
      : `Every ${WEEKDAYS[subscription.weekday ?? 1]}`;

  return (
    <View
      style={[
        styles.subCard,
        !subscription.active ? styles.subCardInactive : null,
      ]}
    >
      <View style={styles.subHeader}>
        <View style={styles.freqChip}>
          <Ionicons name="repeat" size={12} color={colors.primary} />
          <Text style={styles.freqChipText}>{summary}</Text>
        </View>
        {!subscription.active ? (
          <View style={styles.cancelledChip}>
            <Text style={styles.cancelledChipText}>Cancelled</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.subTotal}>Rs {subscription.totalAmount.toLocaleString()}</Text>
      {subscription.items.map((it, i) => (
        <Text key={i} style={styles.subItem}>
          • {it.qty} × {productLabel(it.productId)}
        </Text>
      ))}

      {subscription.lastRunAt ? (
        <Text style={styles.subMeta}>
          Last run {formatDateTime(subscription.lastRunAt)}
        </Text>
      ) : (
        <Text style={styles.subMeta}>Not run yet</Text>
      )}

      {subscription.active && onRun && onCancel ? (
        <View style={styles.subActions}>
          <Pressable
            onPress={onRun}
            style={({ pressed }) => [
              styles.subActionBtn,
              styles.subActionRun,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Ionicons name="play" size={14} color={colors.success} />
            <Text style={[styles.subActionText, { color: colors.success }]}>Run now</Text>
          </Pressable>
          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [
              styles.subActionBtn,
              styles.subActionCancel,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Ionicons name="close-circle-outline" size={14} color={colors.danger} />
            <Text style={[styles.subActionText, { color: colors.danger }]}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

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

function formatDateTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },

  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: colors.primary + '10',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  introText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.text,
    lineHeight: 20,
  },

  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  createBtnText: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.textInverse,
  },

  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  formTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  freqRow: { flexDirection: 'row', gap: spacing.sm },
  freqPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  freqPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  freqText: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.primaryDark },
  freqTextActive: { color: colors.textInverse },
  weekdayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  weekdayPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
  },
  weekdayPillActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  weekdayText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  weekdayTextActive: { color: colors.textInverse },

  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { fontSize: fontSizes.sm, color: colors.textMuted },
  totalValue: { fontSize: fontSizes.title, fontWeight: '900', color: colors.primaryDark },
  formActions: { flexDirection: 'row' },

  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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

  subCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  subCardInactive: { opacity: 0.55, borderLeftColor: colors.textMuted },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  freqChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.primary + '15',
  },
  freqChipText: { fontSize: 11, fontWeight: '800', color: colors.primary },
  cancelledChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  cancelledChipText: { fontSize: 10, fontWeight: '900', color: colors.textMuted },

  subTotal: {
    fontSize: fontSizes.title,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  subItem: { fontSize: fontSizes.sm, color: colors.text, marginTop: 2 },
  subMeta: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  subActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  subActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  subActionRun: { borderColor: colors.success, backgroundColor: colors.success + '10' },
  subActionCancel: { borderColor: colors.danger, backgroundColor: colors.danger + '10' },
  subActionText: { fontSize: 12, fontWeight: '800' },
});
