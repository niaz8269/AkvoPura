/**
 * CustomerOrderScreen — place a new order.
 *
 * Catalog list with +/- steppers, live total, optional preferred-time and
 * notes, swipe to submit. After submit shows a confirmation receipt and
 * resets to a fresh empty cart.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '../../components';
import { QuantityStepper } from '../../components/QuantityStepper';
import { SwipeToConfirm } from '../../components/SwipeToConfirm';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { useCustomerPortal } from '../state';

export function CustomerOrderScreen() {
  const { user } = useAuth();
  const portal = useCustomerPortal();

  const [qtys, setQtys] = useState<Record<string, number>>({
    cans: 0,
    gallons: 0,
    pet600: 0,
    pet1500: 0,
  });
  const [preferredTime, setPreferredTime] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [lastReceipt, setLastReceipt] = useState<{ total: number; items: number } | null>(
    null
  );

  const total = useMemo(
    () =>
      portal.catalog.reduce((s, p) => s + (qtys[p.id] ?? 0) * p.defaultPrice, 0),
    [qtys, portal.catalog]
  );

  const itemCount = Object.values(qtys).reduce((s, v) => s + v, 0);

  useEffect(() => {
    if (!confirmed) return;
    const t = setTimeout(() => {
      setConfirmed(false);
      setQtys({ cans: 0, gallons: 0, pet600: 0, pet1500: 0 });
      setPreferredTime('');
      setNotes('');
      setResetKey((k) => k + 1);
    }, 2400);
    return () => clearTimeout(t);
  }, [confirmed]);

  const onConfirm = () => {
    if (!user) return;
    const items = portal.catalog
      .filter((p) => (qtys[p.id] ?? 0) > 0)
      .map((p) => ({
        productId: p.id,
        qty: qtys[p.id] ?? 0,
        unitPrice: p.defaultPrice,
      }));
    const order = portal.placeOrder({
      customerUserId: user.id,
      items,
      preferredTime: preferredTime.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setLastReceipt({ total: order.totalAmount, items: items.length });
    setConfirmed(true);
  };

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Place an order</Text>
          <Text style={styles.titleUr}>آرڈر کریں</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {portal.catalog.map((p) => {
            const v = qtys[p.id] ?? 0;
            const lineTotal = v * p.defaultPrice;
            return (
              <View key={p.id} style={styles.productCard}>
                <View style={styles.productHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{p.nameEn}</Text>
                    <Text style={styles.productNameUr}>{p.nameUr}</Text>
                  </View>
                  <Text style={styles.productPrice}>Rs {p.defaultPrice}</Text>
                </View>
                <Text style={styles.productDesc}>{p.description}</Text>
                <QuantityStepper
                  label={`Quantity (Rs ${lineTotal.toLocaleString()})`}
                  value={v}
                  onChange={(n) => setQtys((q) => ({ ...q, [p.id]: n }))}
                />
              </View>
            );
          })}

          <View style={styles.optionsCard}>
            <Text style={styles.optionLabel}>Preferred delivery time (optional)</Text>
            <TextInput
              value={preferredTime}
              onChangeText={setPreferredTime}
              placeholder="e.g. Before 6 PM today"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.optionLabel}>Notes for salesman (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Ring the bell at gate"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.notesInput]}
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.totalCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalLabelUr}>کل</Text>
            </View>
            <Text style={styles.totalValue}>Rs {total.toLocaleString()}</Text>
          </View>

          <SwipeToConfirm
            key={resetKey}
            labelEn={`Swipe to place order  (${itemCount} item${
              itemCount === 1 ? '' : 's'
            })`}
            labelUr="آرڈر کرنے کے لیے سوائپ کریں"
            doneLabelEn="Order placed ✓"
            doneLabelUr="آرڈر ہو گیا"
            done={confirmed}
            disabled={total === 0 || confirmed}
            onConfirm={onConfirm}
            style={styles.swipe}
          />

          {confirmed && lastReceipt ? (
            <View style={styles.receiptCard}>
              <Text style={styles.receiptTitle}>✓ Order placed</Text>
              <Text style={styles.receiptLine}>
                {lastReceipt.items} item{lastReceipt.items === 1 ? '' : 's'} • Rs{' '}
                {lastReceipt.total.toLocaleString()}
              </Text>
              <Text style={styles.receiptHint}>
                Manager will assign a salesman. Track in History tab.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

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

  productCard: {
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
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productName: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  productNameUr: { fontSize: fontSizes.sm, color: colors.primary, marginTop: 2 },
  productPrice: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.text,
  },
  productDesc: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },

  optionsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  optionLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSizes.body,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },

  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.xl,
    marginVertical: spacing.md,
  },
  totalLabel: { color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.body, fontWeight: '600' },
  totalLabelUr: { color: 'rgba(255,255,255,0.7)', fontSize: fontSizes.sm },
  totalValue: {
    color: colors.textInverse,
    fontSize: fontSizes.heading,
    fontWeight: '900',
  },

  swipe: { marginTop: spacing.sm },

  receiptCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.statusGreen + '22',
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.success,
    alignItems: 'center',
  },
  receiptTitle: {
    fontSize: fontSizes.title,
    fontWeight: '900',
    color: colors.success,
  },
  receiptLine: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  receiptHint: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
