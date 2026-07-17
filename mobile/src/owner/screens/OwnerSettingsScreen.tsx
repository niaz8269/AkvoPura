/**
 * OwnerSettingsScreen — currently just product pricing.
 *
 * Each product gets its own card with a +/- stepper for fine adjustment plus
 * Save / Reset to defaults. Future settings (commissions, reorder thresholds,
 * etc.) will land here as additional sections.
 */

import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BilingualButton, Screen } from '../../components';
import { QuantityStepper } from '../../components/QuantityStepper';
import { colors, fontSizes, radii, spacing } from '../../theme';
import {
  FEE_LABELS,
  PRODUCT_LABELS,
  type ContainerFees,
  type ProductPriceKey,
  usePricing,
} from '../../pricing/state';
import { ApiError } from '../../api/client';
import { runSubscriptionsCronApi } from '../../api/subscriptions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function OwnerSettingsScreen({ navigation }: { navigation: any }) {
  const { prices, fees, setPrice, setFee, resetPrices } = usePricing();

  return (
    <Screen scroll>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.intro}>
        Set the default price for each product. Per-customer custom prices (set
        on a customer's record) override these defaults at bill time.
      </Text>

      <Text style={styles.sectionTitle}>Account</Text>

      <Pressable
        onPress={() => navigation.navigate('ChangeMyPassword')}
        style={({ pressed }) => [
          styles.linkCard,
          pressed ? { opacity: 0.85 } : null,
        ]}
      >
        <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.linkTitle}>Account settings</Text>
          <Text style={styles.linkSub}>Change your username or password</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('ManageManagers')}
        style={({ pressed }) => [
          styles.linkCard,
          pressed ? { opacity: 0.85 } : null,
        ]}
      >
        <Ionicons name="people-outline" size={20} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.linkTitle}>Branch managers</Text>
          <Text style={styles.linkSub}>Add, edit, deactivate, or reset password for managers</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('ExpenseAnalytics')}
        style={({ pressed }) => [
          styles.linkCard,
          pressed ? { opacity: 0.85 } : null,
        ]}
      >
        <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.linkTitle}>Expense analytics</Text>
          <Text style={styles.linkSub}>Daily / weekly / monthly / yearly breakdown by category</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
      </Pressable>

      <View style={styles.switchHint}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
        <Text style={styles.switchHintText}>
          To view a branch as its Manager or Salesman, open <Text style={{ fontWeight: '800' }}>Branches</Text> and tap a branch card.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Default product prices</Text>
      <Text style={styles.sectionSub}>  </Text>

      {(Object.keys(prices) as ProductPriceKey[]).map((key) => (
        <PriceCard
          key={key}
          productKey={key}
          value={prices[key]}
          onSave={(v) => setPrice(key, v)}
        />
      ))}

      <Text style={styles.sectionTitle}>Lost / damaged container fees</Text>
      <Text style={styles.sectionSub}>/   </Text>

      {(Object.keys(fees) as Array<keyof ContainerFees>).map((key) => (
        <FeeCard
          key={key}
          feeKey={key}
          value={fees[key]}
          onSave={(v) => setFee(key, v)}
        />
      ))}

      <View style={{ marginTop: spacing.lg }}>
        <BilingualButton
          label={{ en: 'Reset all to defaults' }}
          variant="secondary"
          onPress={() => {
            Alert.alert(
              'Reset all prices?',
              'This sets every product back to its built-in default. Per-customer overrides are not touched.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => resetPrices(),
                },
              ]
            );
          }}
        />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>
        Maintenance
      </Text>
      <Text style={styles.sectionSub}> </Text>
      <View style={styles.maintCard}>
        <Text style={styles.maintTitle}>Subscription orders</Text>
        <Text style={styles.maintDesc}>
          Subscriptions normally generate today's orders automatically at
          6 AM. Tap below to run that job now — useful for testing a new
          subscription or recovering after server downtime. Safe to repeat:
          subscriptions already generated today are skipped.
        </Text>
        <RunCronButton />
      </View>
    </Screen>
  );
}


function RunCronButton() {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await runSubscriptionsCronApi();
      Alert.alert(
        'Done',
        res.count === 0
          ? 'No subscriptions were due today (or all already generated).'
          : `Generated ${res.count} order${res.count === 1 ? '' : 's'} from today's subscriptions. Check the Manager order inbox.`,
      );
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message || e.code : 'Unknown error';
      Alert.alert('Could not run', msg);
    } finally {
      setBusy(false);
    }
  };
  return (
    <BilingualButton
      label={{
        en: busy ? 'Running…' : "Generate today's subscription orders",
      }}
      onPress={run}
      disabled={busy}
      style={{ marginTop: spacing.md }}
    />
  );
}

function FeeCard({
  feeKey,
  value,
  onSave,
}: {
  feeKey: keyof ContainerFees;
  value: number;
  onSave: (v: number) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const dirty = draft !== value;
  const label = FEE_LABELS[feeKey];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.productName}>{label.en}</Text>
          <Text style={styles.productDesc}>{label.description}</Text>
        </View>
        <View style={[styles.priceChip, { backgroundColor: colors.warning + '15' }]}>
          <Text style={[styles.priceChipText, { color: colors.warning }]}>
            Rs {value.toLocaleString()}
          </Text>
        </View>
      </View>

      <QuantityStepper
        label="New fee (Rs)"

        value={draft}
        onChange={setDraft}
        max={5000}
      />

      {dirty ? (
        <View style={styles.actionRow}>
          <BilingualButton
            label={{ en: 'Save' }}
            onPress={() => {
              onSave(draft);
              Alert.alert('Saved', `${label.en} fee is now Rs ${draft.toLocaleString()}.`);
            }}
            style={{ flex: 1 }}
          />
          <View style={{ width: spacing.md }} />
          <BilingualButton
            label={{ en: 'Discard' }}
            variant="secondary"
            onPress={() => setDraft(value)}
            style={{ flex: 1 }}
          />
        </View>
      ) : null}
    </View>
  );
}

function PriceCard({
  productKey,
  value,
  onSave,
}: {
  productKey: ProductPriceKey;
  value: number;
  onSave: (v: number) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const dirty = draft !== value;
  const label = PRODUCT_LABELS[productKey];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.productName}>{label.en}</Text>
          <Text style={styles.productDesc}>{label.description}</Text>
        </View>
        <View style={styles.priceChip}>
          <Text style={styles.priceChipText}>Rs {value.toLocaleString()}</Text>
        </View>
      </View>

      <QuantityStepper
        label="New price (Rs)"

        value={draft}
        onChange={setDraft}
        max={5000}
      />

      {dirty ? (
        <View style={styles.actionRow}>
          <BilingualButton
            label={{ en: 'Save' }}
            onPress={() => {
              onSave(draft);
              Alert.alert('Saved', `${label.en} default is now Rs ${draft.toLocaleString()}.`);
            }}
            style={{ flex: 1 }}
          />
          <View style={{ width: spacing.md }} />
          <BilingualButton
            label={{ en: 'Discard' }}
            variant="secondary"
            onPress={() => setDraft(value)}
            style={{ flex: 1 }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSizes.heading, fontWeight: '800', color: colors.primaryDark },
  intro: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginVertical: spacing.md,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: spacing.md,
  },
  sectionSub: { fontSize: fontSizes.xs, color: colors.textMuted, marginBottom: spacing.md },

  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  linkTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  linkSub: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  productName: { fontSize: fontSizes.body, fontWeight: '800', color: colors.primaryDark },
  productDesc: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  priceChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.primary + '15',
  },
  priceChipText: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  maintCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  maintTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  maintDesc: {
    fontSize: fontSizes.sm,
    color: colors.text,
    lineHeight: 20,
    marginTop: 4,
  },
  switchHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  switchHintText: {
    flex: 1,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
