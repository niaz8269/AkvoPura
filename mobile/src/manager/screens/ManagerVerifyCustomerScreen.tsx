/**
 * ManagerVerifyCustomerScreen — approve a pending customer registration.
 *
 * Fields shown depend on the customer's pending kind:
 *   - 'cg': address + route (hospital/bypass/others) + payment cycle (daily/weekly)
 *     + optional price overrides for cans + gallons
 *   - 'pets': address + area (free text) + optional 600ml / 1.5L price overrides
 *
 * On success, the user becomes verified and a linked CGCustomer or
 * PetCustomer record is created on the backend.
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
import { colors, fontSizes, radii, spacing } from '../../theme';
import { verifyCustomer, type ApiUser } from '../../api/users';
import { ApiError } from '../../api/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Route = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Nav = any;

type CgRouteValue = 'hospital' | 'bypass' | 'others';
type CycleValue = 'daily' | 'weekly';

const CG_ROUTE_LABELS: Record<CgRouteValue, string> = {
  hospital: 'Hospital',
  bypass: 'Bypass',
  others: 'Others',
};

const CYCLE_LABELS: Record<CycleValue, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
};

export function ManagerVerifyCustomerScreen({ route, navigation }: { route: Route; navigation: Nav }) {
  const user = route.params.user as ApiUser;
  const isCG = user.pendingCustomerKind === 'cg';

  const [address, setAddress] = useState('');
  const [cgRoute, setCgRoute] = useState<CgRouteValue>('others');
  const [cgCycle, setCgCycle] = useState<CycleValue>('daily');
  const [pricePerCan, setPricePerCan] = useState('');
  const [pricePerGallon, setPricePerGallon] = useState('');
  const [petArea, setPetArea] = useState('');
  const [pricePet600, setPricePet600] = useState('');
  const [pricePet1500, setPricePet1500] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const valid =
    address.trim().length >= 3 &&
    (isCG ? true : petArea.trim().length >= 2);

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await verifyCustomer(user.id, {
        address: address.trim(),
        ...(isCG
          ? {
              cgRoute,
              cgPaymentCycle: cgCycle,
              ...(pricePerCan ? { pricePerCan: Number(pricePerCan) } : {}),
              ...(pricePerGallon ? { pricePerGallon: Number(pricePerGallon) } : {}),
            }
          : {
              petArea: petArea.trim(),
              ...(pricePet600 ? { pricePet600: Number(pricePet600) } : {}),
              ...(pricePet1500 ? { pricePet1500: Number(pricePet1500) } : {}),
            }),
      });
      Alert.alert(
        'Customer approved',
        `${user.name} can now log in and place orders.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (e: unknown) {
      const msg =
        e instanceof ApiError
          ? e.code === 'network_error'
            ? 'Cannot reach the server. Check Wi-Fi.'
            : e.message || e.code
          : 'Unknown error';
      Alert.alert('Could not verify', msg);
    } finally {
      setSubmitting(false);
    }
  };

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
          <View style={styles.summaryCard}>
            <View
              style={[
                styles.kindBadge,
                isCG ? styles.kindBadgeCg : styles.kindBadgePets,
              ]}
            >
              <Text style={styles.kindBadgeText}>{isCG ? 'C/G' : 'Pets'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryName}>{user.name}</Text>
              <Text style={styles.summaryMeta}>@{user.identifier}</Text>
              {user.phone ? (
                <View style={styles.phoneRow}>
                  <Ionicons name="call-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.phoneText}>{user.phone}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <Text style={styles.label}>ADDRESS *</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="House / shop number, street, area"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.textarea]}
            multiline
            numberOfLines={2}
          />

          {isCG ? (
            <>
              <Text style={styles.label}>ROUTE *</Text>
              <View style={styles.pillRow}>
                {(['hospital', 'bypass', 'others'] as CgRouteValue[]).map((r) => {
                  const active = r === cgRoute;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setCgRoute(r)}
                      style={({ pressed }) => [
                        styles.pill,
                        active ? styles.pillActive : null,
                        pressed && !active ? { opacity: 0.7 } : null,
                      ]}
                    >
                      <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>
                        {CG_ROUTE_LABELS[r]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>PAYMENT CYCLE *</Text>
              <View style={styles.pillRow}>
                {(['daily', 'weekly'] as CycleValue[]).map((c) => {
                  const active = c === cgCycle;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setCgCycle(c)}
                      style={({ pressed }) => [
                        styles.pill,
                        active ? styles.pillActive : null,
                        pressed && !active ? { opacity: 0.7 } : null,
                      ]}
                    >
                      <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>
                        {CYCLE_LABELS[c]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>PRICES (optional — leave blank for default)</Text>
              <View style={styles.priceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.priceLabel}>Per can</Text>
                  <View style={styles.priceInputWrap}>
                    <Text style={styles.priceCurrency}>Rs</Text>
                    <TextInput
                      value={pricePerCan}
                      onChangeText={(t) => setPricePerCan(t.replace(/[^0-9]/g, ''))}
                      placeholder="default"
                      placeholderTextColor={colors.textMuted}
                      style={styles.priceInput}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.priceLabel}>Per gallon</Text>
                  <View style={styles.priceInputWrap}>
                    <Text style={styles.priceCurrency}>Rs</Text>
                    <TextInput
                      value={pricePerGallon}
                      onChangeText={(t) => setPricePerGallon(t.replace(/[^0-9]/g, ''))}
                      placeholder="default"
                      placeholderTextColor={colors.textMuted}
                      style={styles.priceInput}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.label}>AREA *</Text>
              <TextInput
                value={petArea}
                onChangeText={setPetArea}
                placeholder="e.g. Bazaar, Bypass, Mohalla Khan"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />

              <Text style={styles.label}>PRICES (optional — leave blank for default)</Text>
              <View style={styles.priceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.priceLabel}>Per 600 ml pack</Text>
                  <View style={styles.priceInputWrap}>
                    <Text style={styles.priceCurrency}>Rs</Text>
                    <TextInput
                      value={pricePet600}
                      onChangeText={(t) => setPricePet600(t.replace(/[^0-9]/g, ''))}
                      placeholder="default"
                      placeholderTextColor={colors.textMuted}
                      style={styles.priceInput}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.priceLabel}>Per 1.5 L pack</Text>
                  <View style={styles.priceInputWrap}>
                    <Text style={styles.priceCurrency}>Rs</Text>
                    <TextInput
                      value={pricePet1500}
                      onChangeText={(t) => setPricePet1500(t.replace(/[^0-9]/g, ''))}
                      placeholder="default"
                      placeholderTextColor={colors.textMuted}
                      style={styles.priceInput}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                </View>
              </View>
            </>
          )}

          <BilingualButton
            label={{
              en: submitting ? 'Approving…' : 'Approve & verify',
              ur: 'منظور کریں',
            }}
            onPress={submit}
            disabled={!valid || submitting}
            style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, paddingBottom: spacing.xl },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary + '12',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  kindBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    minWidth: 48,
    alignItems: 'center',
  },
  kindBadgeCg: { backgroundColor: colors.primary + '22' },
  kindBadgePets: { backgroundColor: colors.accent + '22' },
  kindBadgeText: { fontSize: 11, fontWeight: '900', color: colors.primaryDark },
  summaryName: { fontSize: fontSizes.body, fontWeight: '800', color: colors.text },
  summaryMeta: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  phoneText: { fontSize: fontSizes.xs, color: colors.textMuted },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: fontSizes.body,
    color: colors.text,
  },
  textarea: { minHeight: 60, textAlignVertical: 'top' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  pillText: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.primaryDark },
  pillTextActive: { color: colors.textInverse },
  priceRow: { flexDirection: 'row', gap: spacing.md },
  priceLabel: { fontSize: fontSizes.xs, color: colors.textMuted, marginBottom: 4 },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    height: 44,
  },
  priceCurrency: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.textMuted },
  priceInput: {
    flex: 1,
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    textAlign: 'right',
  },
});
