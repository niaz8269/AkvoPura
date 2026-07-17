/**
 * EndTripScreen — auto-calculated reconciliation, one input.
 *
 * The salesman doesn't have to add up cans / gallons / cash — the app has
 * been tracking every delivery, collection, bill, return, and expense
 * under this trip's id. All we need from the salesman is the ACTUAL cash
 * on hand right now (which we compare to expected) and an optional
 * override for physical count discrepancies.
 */

import React, { useMemo, useState } from 'react';
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

import { BilingualButton, Screen } from '../components';
import { QuantityStepper } from '../components/QuantityStepper';
import { colors, fontSizes, radii, spacing } from '../theme';
import { ApiError } from '../api/client';
import { useTrip } from './state';
import { useCGSalesman } from '../cg/state';
import { usePetsSalesman } from '../pets/state';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EndTripScreen({ navigation }: any) {
  const { activeTrip, endTrip } = useTrip();
  const cg = useCGSalesman();
  const pets = usePetsSalesman();

  const [declaredCash, setDeclaredCash] = useState('');
  const [notes, setNotes] = useState('');
  const [showOverride, setShowOverride] = useState(false);
  const [overrideCans, setOverrideCans] = useState(0);
  const [overrideGallons, setOverrideGallons] = useState(0);
  const [overrideEmptyCans, setOverrideEmptyCans] = useState(0);
  const [overrideEmptyGallons, setOverrideEmptyGallons] = useState(0);
  const [override600, setOverride600] = useState(0);
  const [override1500, setOverride1500] = useState(0);
  const [busy, setBusy] = useState(false);

  // Everything below is derived from provider data — the salesman doesn't
  // add anything up manually. This is the whole point of the refactor.
  const auto = useMemo(() => {
    if (!activeTrip) return null;
    if (activeTrip.role === 'cg') {
      const cansDelivered = cg.deliveries.reduce((s, d) => s + d.cansDelivered, 0);
      const gallonsDelivered = cg.deliveries.reduce((s, d) => s + d.gallonsDelivered, 0);
      const emptyCansPicked =
        cg.deliveries.reduce((s, d) => s + d.emptyCansCollected, 0) +
        cg.collections.reduce((s, c) => s + c.cansCollected, 0);
      const emptyGallonsPicked =
        cg.deliveries.reduce((s, d) => s + d.emptyGallonsCollected, 0) +
        cg.collections.reduce((s, c) => s + c.gallonsCollected, 0);
      const cashCollected =
        cg.deliveries.reduce((s, d) => s + d.cashCollected, 0) +
        cg.collections.reduce((s, c) => s + (c.cashCollected ?? 0), 0);
      const bankCollected =
        cg.deliveries.reduce((s, d) => s + (d.bankCollected ?? 0), 0) +
        cg.collections.reduce((s, c) => s + (c.bankCollected ?? 0), 0);
      return {
        expectedCansOnVan: Math.max(0, activeTrip.initialCansLoaded - cansDelivered),
        expectedGallonsOnVan: Math.max(0, activeTrip.initialGallonsLoaded - gallonsDelivered),
        expectedEmptyCansOnVan: emptyCansPicked,
        expectedEmptyGallonsOnVan: emptyGallonsPicked,
        cansDelivered,
        gallonsDelivered,
        expectedCash: cashCollected,
        bankCollected,
      };
    }
    // Pets
    const packs600Sold = pets.bills.reduce((s, b) => s + b.pet600Packs, 0);
    const packs1500Sold = pets.bills.reduce((s, b) => s + b.pet1500Packs, 0);
    const packs600Returned = pets.returns.reduce((s, r) => s + r.pet600Packs, 0);
    const packs1500Returned = pets.returns.reduce((s, r) => s + r.pet1500Packs, 0);
    const cashCollected = pets.bills.reduce((s, b) => s + b.cashCollected, 0);
    const bankCollected = pets.bills.reduce((s, b) => s + (b.bankCollected ?? 0), 0);
    return {
      expected600OnVan: Math.max(0, activeTrip.initialPet600Packs - packs600Sold + packs600Returned),
      expected1500OnVan: Math.max(0, activeTrip.initialPet1500Packs - packs1500Sold + packs1500Returned),
      packs600Sold,
      packs1500Sold,
      packs600Returned,
      packs1500Returned,
      expectedCash: cashCollected,
      bankCollected,
    };
  }, [activeTrip, cg.deliveries, cg.collections, pets.bills, pets.returns]);

  if (!activeTrip) {
    return (
      <Screen>
        <View style={{ padding: spacing.xl, alignItems: 'center' }}>
          <Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />
          <Text style={styles.emptyTitle}>No active trip</Text>
          <Text style={styles.emptySub}>Start a trip from your Assignments first.</Text>
        </View>
      </Screen>
    );
  }

  const isCG = activeTrip.role === 'cg';
  const declaredCashNum = parseInt(declaredCash, 10) || 0;
  const expectedCash = auto?.expectedCash ?? 0;
  const mismatch = declaredCashNum - expectedCash;

  const submit = async () => {
    if (busy || !auto) return;
    setBusy(true);
    try {
      await endTrip({
        finalCansOnVan: isCG
          ? showOverride
            ? overrideCans
            : (auto as any).expectedCansOnVan
          : undefined,
        finalGallonsOnVan: isCG
          ? showOverride
            ? overrideGallons
            : (auto as any).expectedGallonsOnVan
          : undefined,
        finalEmptyCansOnVan: isCG
          ? showOverride
            ? overrideEmptyCans
            : (auto as any).expectedEmptyCansOnVan
          : undefined,
        finalEmptyGallonsOnVan: isCG
          ? showOverride
            ? overrideEmptyGallons
            : (auto as any).expectedEmptyGallonsOnVan
          : undefined,
        finalPet600Packs: !isCG
          ? showOverride
            ? override600
            : (auto as any).expected600OnVan
          : undefined,
        finalPet1500Packs: !isCG
          ? showOverride
            ? override1500
            : (auto as any).expected1500OnVan
          : undefined,
        declaredCashOnHand: declaredCashNum,
        notes: notes.trim() || undefined,
      });
      Alert.alert(
        'Trip ended',
        'Reconciliation sent to your manager. Next assignment (if any) is now available.',
      );
      navigation.goBack();
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message || e.code : 'Could not end trip';
      Alert.alert('Failed', msg);
    } finally {
      setBusy(false);
    }
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
          <View style={styles.headerCard}>
            <Ionicons name="stop-circle-outline" size={28} color={colors.textInverse} />
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>End Van {activeTrip.vehicleLabel}</Text>
              <Text style={styles.headerSub}>
                Everything is auto-calculated. Just confirm cash and hit end.
              </Text>
            </View>
          </View>

          <SectionTitle>Trip summary</SectionTitle>
          <View style={styles.summary}>
            {isCG ? (
              <>
                <Row label="Cans delivered" value={String((auto as any)?.cansDelivered ?? 0)} />
                <Row label="Gallons delivered" value={String((auto as any)?.gallonsDelivered ?? 0)} />
                <Row label="Empty cans picked up" value={String((auto as any)?.expectedEmptyCansOnVan ?? 0)} />
                <Row label="Empty gallons picked up" value={String((auto as any)?.expectedEmptyGallonsOnVan ?? 0)} />
                <Row label="Expected cans still on van" value={String((auto as any)?.expectedCansOnVan ?? 0)} bold />
                <Row label="Expected gallons still on van" value={String((auto as any)?.expectedGallonsOnVan ?? 0)} bold last />
              </>
            ) : (
              <>
                <Row label="600 ml sold" value={String((auto as any)?.packs600Sold ?? 0)} />
                <Row label="1.5 L sold" value={String((auto as any)?.packs1500Sold ?? 0)} />
                <Row label="600 ml returned" value={String((auto as any)?.packs600Returned ?? 0)} />
                <Row label="1.5 L returned" value={String((auto as any)?.packs1500Returned ?? 0)} />
                <Row label="Expected 600 ml still on van" value={String((auto as any)?.expected600OnVan ?? 0)} bold />
                <Row label="Expected 1.5 L still on van" value={String((auto as any)?.expected1500OnVan ?? 0)} bold last />
              </>
            )}
          </View>

          <Pressable
            onPress={() => setShowOverride(!showOverride)}
            style={({ pressed }) => [
              styles.overrideToggle,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Ionicons
              name={showOverride ? 'chevron-down' : 'chevron-forward'}
              size={16}
              color={colors.primaryDark}
            />
            <Text style={styles.overrideToggleText}>
              {showOverride ? 'Hide' : 'Physical count is different from expected?'}
            </Text>
          </Pressable>

          {showOverride ? (
            <View style={styles.overrideBox}>
              <Text style={styles.overrideHint}>
                Enter what you actually counted. Manager will see the difference.
              </Text>
              {isCG ? (
                <>
                  <QuantityStepper label="Actual cans on van" value={overrideCans} onChange={setOverrideCans} max={999} />
                  <QuantityStepper label="Actual gallons on van" value={overrideGallons} onChange={setOverrideGallons} max={999} />
                  <QuantityStepper label="Actual empty cans on van" value={overrideEmptyCans} onChange={setOverrideEmptyCans} max={999} />
                  <QuantityStepper label="Actual empty gallons on van" value={overrideEmptyGallons} onChange={setOverrideEmptyGallons} max={999} />
                </>
              ) : (
                <>
                  <QuantityStepper label="Actual 600 ml on van" value={override600} onChange={setOverride600} max={999} />
                  <QuantityStepper label="Actual 1.5 L on van" value={override1500} onChange={setOverride1500} max={999} />
                </>
              )}
            </View>
          ) : null}

          <SectionTitle>Cash reconciliation</SectionTitle>
          <View style={styles.summary}>
            <Row label="Cash collected" value={`Rs ${expectedCash.toLocaleString()}`} />
            <Row label="Bank / digital" value={`Rs ${(auto?.bankCollected ?? 0).toLocaleString()}`} last />
          </View>

          <Text style={styles.fieldLabel}>Cash on hand right now *</Text>
          <TextInput
            value={declaredCash}
            onChangeText={setDeclaredCash}
            placeholder={`${expectedCash}`}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={8}
          />

          {declaredCash !== '' && mismatch !== 0 ? (
            <View
              style={[
                styles.mismatch,
                mismatch < 0 ? styles.mismatchShort : styles.mismatchOver,
              ]}
            >
              <Ionicons
                name={mismatch < 0 ? 'alert-circle' : 'add-circle'}
                size={16}
                color={mismatch < 0 ? colors.danger : colors.warning}
              />
              <Text style={styles.mismatchText}>
                {mismatch < 0
                  ? `Rs ${Math.abs(mismatch).toLocaleString()} short — flagged to manager.`
                  : `Rs ${mismatch.toLocaleString()} over — flagged to manager.`}
              </Text>
            </View>
          ) : null}

          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything to explain (damages, shortages, etc.)"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.notesInput]}
            multiline
            numberOfLines={3}
            maxLength={500}
          />

          <BilingualButton
            label={{ en: busy ? 'Closing trip…' : 'End trip' }}
            onPress={submit}
            disabled={busy || declaredCash === ''}
            style={{ marginTop: spacing.lg }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function Row({ label, value, bold, last }: { label: string; value: string; bold?: boolean; last?: boolean }) {
  return (
    <View style={[styles.row, last ? styles.rowLast : null]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold ? styles.rowValueBold : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.danger,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  headerTitle: { color: colors.textInverse, fontSize: fontSizes.title, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.sm, marginTop: 2 },
  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: spacing.md,
    marginBottom: 6,
  },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: fontSizes.sm, color: colors.text, flex: 1 },
  rowValue: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.primaryDark },
  rowValueBold: { fontWeight: '900', color: colors.primary },

  overrideToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  overrideToggleText: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  overrideBox: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  overrideHint: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },

  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSizes.body,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  mismatch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.sm,
  },
  mismatchShort: { backgroundColor: colors.danger + '18' },
  mismatchOver: { backgroundColor: colors.warning + '22' },
  mismatchText: { flex: 1, fontSize: fontSizes.sm, fontWeight: '700', color: colors.text },

  emptyTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: spacing.md,
  },
  emptySub: { fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 4 },
});
