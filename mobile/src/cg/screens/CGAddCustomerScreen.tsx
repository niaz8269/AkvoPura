/**
 * CGAddCustomerScreen — manual entry for a new Cans/Gallons customer.
 *
 * Both Manager and CG Salesman can land here. Per-customer prices are
 * editable only for owner/manager — salesmen see the owner-set defaults
 * read-only (CG prices are fixed, per business rules).
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
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BilingualButton, Screen } from '../../components';
import { QuantityStepper } from '../../components/QuantityStepper';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { useCGSalesman } from '../state';
import { usePricing } from '../../pricing/state';
import type { CGRoute, PaymentCycle } from '../types';

type Nav = { goBack: () => void };

const ROUTES: { key: CGRoute; label: string }[] = [
  { key: 'hospital', label: 'Hospital' },
  { key: 'bypass', label: 'Bypass' },
  { key: 'others', label: 'Others' },
];

const CYCLES: { key: PaymentCycle; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
];

export function CGAddCustomerScreen({ navigation }: { navigation: Nav }) {
  const { user } = useAuth();
  const { addCustomer } = useCGSalesman();
  const { prices } = usePricing();

  const isManagerOrOwner = user?.role === 'manager' || user?.role === 'owner';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [route, setRoute] = useState<CGRoute>('hospital');
  const [paymentCycle, setPaymentCycle] = useState<PaymentCycle>('daily');
  const [usualCans, setUsualCans] = useState(0);
  const [usualGallons, setUsualGallons] = useState(0);
  const [pricePerCan, setPricePerCan] = useState(prices.can);
  const [pricePerGallon, setPricePerGallon] = useState(prices.gallon);
  const [notes, setNotes] = useState('');

  const valid =
    name.trim().length > 0 &&
    phone.trim().length > 0 &&
    address.trim().length > 0 &&
    pricePerCan > 0 &&
    pricePerGallon > 0;

  const submit = () => {
    const created = addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      route,
      paymentCycle,
      usualCans,
      usualGallons,
      pricePerCan,
      pricePerGallon,
      notes: notes.trim() || undefined,
    });
    Alert.alert('Customer added', `${created.name} added to ${route} route.`);
    navigation.goBack();
  };

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.fieldLabel}>Name *</Text>
          <Text style={styles.fieldLabelUr}>نام</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Karim Tea Stall"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.fieldLabel}>Phone *</Text>
          <Text style={styles.fieldLabelUr}>فون نمبر</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="0300-1234567"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            keyboardType="phone-pad"
          />

          <Text style={styles.fieldLabel}>Address *</Text>
          <Text style={styles.fieldLabelUr}>پتہ</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="e.g. Bypass Road, near tyre shop"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { minHeight: 50, textAlignVertical: 'top' }]}
            multiline
          />

          <Text style={styles.fieldLabel}>Route</Text>
          <View style={styles.segmentRow}>
            {ROUTES.map((r) => {
              const active = r.key === route;
              return (
                <Pressable
                  key={r.key}
                  onPress={() => setRoute(r.key)}
                  style={({ pressed }) => [
                    styles.segment,
                    active ? styles.segmentActive : null,
                    pressed && !active ? { opacity: 0.7 } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      active ? styles.segmentTextActive : null,
                    ]}
                  >
                    {r.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Payment cycle</Text>
          <View style={styles.segmentRow}>
            {CYCLES.map((c) => {
              const active = c.key === paymentCycle;
              return (
                <Pressable
                  key={c.key}
                  onPress={() => setPaymentCycle(c.key)}
                  style={({ pressed }) => [
                    styles.segment,
                    active ? styles.segmentActive : null,
                    pressed && !active ? { opacity: 0.7 } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      active ? styles.segmentTextActive : null,
                    ]}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Usual order</Text>
          <View style={{ marginTop: spacing.sm }}>
            <QuantityStepper
              label="Usual cans / visit"
              value={usualCans}
              onChange={setUsualCans}
            />
          </View>
          <View style={{ marginTop: spacing.md }}>
            <QuantityStepper
              label="Usual gallons / visit"
              value={usualGallons}
              onChange={setUsualGallons}
            />
          </View>

          <Text style={styles.sectionTitle}>Pricing</Text>
          {!isManagerOrOwner ? (
            <View style={styles.lockedNote}>
              <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
              <Text style={styles.lockedNoteText}>
                Cans / gallons prices are set by the manager. Defaults will apply.
              </Text>
            </View>
          ) : null}

          <View style={styles.priceRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Per can (Rs)</Text>
              <TextInput
                value={String(pricePerCan)}
                onChangeText={(t) =>
                  setPricePerCan(Math.max(0, Number(t.replace(/[^0-9]/g, '')) || 0))
                }
                keyboardType="number-pad"
                style={[styles.input, !isManagerOrOwner ? styles.inputLocked : null]}
                editable={isManagerOrOwner}
              />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Per gallon (Rs)</Text>
              <TextInput
                value={String(pricePerGallon)}
                onChangeText={(t) =>
                  setPricePerGallon(Math.max(0, Number(t.replace(/[^0-9]/g, '')) || 0))
                }
                keyboardType="number-pad"
                style={[styles.input, !isManagerOrOwner ? styles.inputLocked : null]}
                editable={isManagerOrOwner}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Deliver before 9 AM"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { minHeight: 50, textAlignVertical: 'top' }]}
            multiline
          />

          <BilingualButton
            label={{ en: 'Add customer', ur: 'کسٹمر شامل کریں' }}
            onPress={submit}
            disabled={!valid}
            style={{ marginTop: spacing.lg }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, paddingBottom: spacing.xl },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
    marginTop: spacing.md,
  },
  fieldLabelUr: { fontSize: fontSizes.xs, color: colors.primary, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: fontSizes.body,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  inputLocked: {
    backgroundColor: colors.border + '40',
    color: colors.textMuted,
  },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 4 },
  segment: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
  },
  segmentActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  segmentText: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.primaryDark },
  segmentTextActive: { color: colors.textInverse },
  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: spacing.lg,
  },
  lockedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  lockedNoteText: {
    flex: 1,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  priceRow: { flexDirection: 'row', marginTop: spacing.sm },
});
