/**
 * OwnerSettingsScreen — currently just product pricing.
 *
 * Each product gets its own card with a +/- stepper for fine adjustment plus
 * Save / Reset to defaults. Future settings (commissions, reorder thresholds,
 * etc.) will land here as additional sections.
 */

import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BilingualButton, Screen } from '../../components';
import { QuantityStepper } from '../../components/QuantityStepper';
import { colors, fontSizes, radii, spacing } from '../../theme';
import {
  PRODUCT_LABELS,
  type ProductPriceKey,
  usePricing,
} from '../../pricing/state';

export function OwnerSettingsScreen() {
  const { prices, setPrice, resetPrices } = usePricing();

  return (
    <Screen scroll>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.titleUr}>ترتیبات</Text>
      <Text style={styles.intro}>
        Set the default price for each product. Per-customer custom prices (set
        on a customer's record) override these defaults at bill time.
      </Text>

      <Text style={styles.sectionTitle}>Default product prices</Text>
      <Text style={styles.sectionSub}>پروڈکٹس کی قیمتیں</Text>

      {(Object.keys(prices) as ProductPriceKey[]).map((key) => (
        <PriceCard
          key={key}
          productKey={key}
          value={prices[key]}
          onSave={(v) => setPrice(key, v)}
        />
      ))}

      <View style={{ marginTop: spacing.lg }}>
        <BilingualButton
          label={{ en: 'Reset all to defaults', ur: 'سب کو ڈیفالٹ پر کریں' }}
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
    </Screen>
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
          <Text style={styles.productNameUr}>{label.ur}</Text>
          <Text style={styles.productDesc}>{label.description}</Text>
        </View>
        <View style={styles.priceChip}>
          <Text style={styles.priceChipText}>Rs {value.toLocaleString()}</Text>
        </View>
      </View>

      <QuantityStepper
        label="New price (Rs)"
        labelUr="نئی قیمت"
        value={draft}
        onChange={setDraft}
        max={5000}
      />

      {dirty ? (
        <View style={styles.actionRow}>
          <BilingualButton
            label={{ en: 'Save', ur: 'محفوظ کریں' }}
            onPress={() => {
              onSave(draft);
              Alert.alert('Saved', `${label.en} default is now Rs ${draft.toLocaleString()}.`);
            }}
            style={{ flex: 1 }}
          />
          <View style={{ width: spacing.md }} />
          <BilingualButton
            label={{ en: 'Discard', ur: 'منسوخ' }}
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
  titleUr: { fontSize: fontSizes.body, color: colors.primary },
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
  productNameUr: { fontSize: fontSizes.sm, color: colors.primary },
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
});
