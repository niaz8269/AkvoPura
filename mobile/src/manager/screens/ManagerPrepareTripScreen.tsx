/**
 * ManagerPrepareTripScreen — manager creates a trip assignment for a
 * salesman. Zero data entry for the salesman later — everything gets
 * captured here.
 *
 * Fields: salesman (dropdown, filtered by branch) → role auto-derived
 * from salesman → vehicle label → initial cans/gallons (CG) or 600ml/1.5L
 * packs (Pets) → optional notes → submit.
 */

import React, { useEffect, useMemo, useState } from 'react';
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
import { ApiError } from '../../api/client';
import { listUsers, type ApiUser } from '../../api/users';
import { prepareTrip } from '../../api/trips';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ManagerPrepareTripScreen({ navigation }: any) {
  const { user, effectiveBranch } = useAuth();
  const [salesmen, setSalesmen] = useState<ApiUser[]>([]);
  const [salesmanId, setSalesmanId] = useState<string | null>(null);
  const [vehicleLabel, setVehicleLabel] = useState('');
  const [cans, setCans] = useState(0);
  const [gallons, setGallons] = useState(0);
  const [pet600, setPet600] = useState(0);
  const [pet1500, setPet1500] = useState(0);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const branchToFilter = effectiveBranch ?? user?.branch;

  useEffect(() => {
    listUsers()
      .then((all) => {
        const eligible = all.filter(
          (u) =>
            (u.role === 'cans_gallons_salesman' || u.role === 'pets_salesman') &&
            u.active &&
            (!branchToFilter || u.branchSlug === branchToFilter),
        );
        setSalesmen(eligible);
      })
      .catch(() => {
        Alert.alert('Failed', 'Could not load salesmen list.');
      });
  }, [branchToFilter]);

  const selectedSalesman = useMemo(
    () => salesmen.find((s) => s.id === salesmanId) ?? null,
    [salesmen, salesmanId],
  );
  const isCG = selectedSalesman?.role === 'cans_gallons_salesman';
  const isPets = selectedSalesman?.role === 'pets_salesman';

  const valid = !!salesmanId && vehicleLabel.trim().length >= 2;

  const submit = async () => {
    if (!valid || busy || !selectedSalesman) return;
    setBusy(true);
    try {
      await prepareTrip({
        salesmanId: selectedSalesman.id,
        role: isCG ? 'cg' : 'pets',
        vehicleLabel: vehicleLabel.trim(),
        initialCansLoaded: isCG ? cans : undefined,
        initialGallonsLoaded: isCG ? gallons : undefined,
        initialPet600Packs: isPets ? pet600 : undefined,
        initialPet1500Packs: isPets ? pet1500 : undefined,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Trip assigned', `${selectedSalesman.name} will see this in their Assignments.`);
      navigation.goBack();
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message || e.code : 'Could not assign trip';
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
            <Ionicons name="clipboard-outline" size={28} color={colors.textInverse} />
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Assign a trip</Text>
              <Text style={styles.headerSub}>
                Salesman just taps "Start" — no data entry on their end.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Salesman *</Text>
          {salesmen.length === 0 ? (
            <Text style={styles.emptyHint}>
              No active salesmen in this branch. Create one from Team first.
            </Text>
          ) : (
            <View style={styles.salesmanList}>
              {salesmen.map((s) => {
                const active = s.id === salesmanId;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setSalesmanId(s.id)}
                    style={({ pressed }) => [
                      styles.salesmanCard,
                      active ? styles.salesmanCardActive : null,
                      pressed && !active ? { opacity: 0.85 } : null,
                    ]}
                  >
                    <Ionicons
                      name={
                        s.role === 'cans_gallons_salesman' ? 'water-outline' : 'cube-outline'
                      }
                      size={20}
                      color={active ? colors.textInverse : colors.primaryDark}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.salesmanName, active ? styles.textOnActive : null]}>
                        {s.name}
                      </Text>
                      <Text style={[styles.salesmanRole, active ? styles.textOnActiveMuted : null]}>
                        {s.role === 'cans_gallons_salesman' ? 'Cans/Gallons' : 'Pets'}
                      </Text>
                    </View>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )}

          {selectedSalesman ? (
            <>
              <Text style={styles.sectionTitle}>Vehicle *</Text>
              <TextInput
                value={vehicleLabel}
                onChangeText={setVehicleLabel}
                placeholder="e.g. KHW-1234 or Blue Van"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoCapitalize="characters"
                maxLength={40}
              />

              <Text style={styles.sectionTitle}>Van load</Text>
              {isCG ? (
                <>
                  <QuantityStepper
                    label="Filled cans loaded"
                    value={cans}
                    onChange={setCans}
                    max={999}
                  />
                  <QuantityStepper
                    label="Filled gallons loaded"
                    value={gallons}
                    onChange={setGallons}
                    max={999}
                  />
                </>
              ) : (
                <>
                  <QuantityStepper
                    label="600 ml packs loaded"
                    value={pet600}
                    onChange={setPet600}
                    max={999}
                  />
                  <QuantityStepper
                    label="1.5 L packs loaded"
                    value={pet1500}
                    onChange={setPet1500}
                    max={999}
                  />
                </>
              )}

              <Text style={styles.sectionTitle}>Notes (optional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Anything the salesman should know"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.notesInput]}
                multiline
                numberOfLines={3}
                maxLength={500}
              />

              <BilingualButton
                label={{ en: busy ? 'Assigning…' : 'Assign trip' }}
                onPress={submit}
                disabled={!valid || busy}
                style={{ marginTop: spacing.lg }}
              />
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
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
  emptyHint: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
  },

  salesmanList: { gap: 6 },
  salesmanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  salesmanCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  salesmanName: { fontSize: fontSizes.body, fontWeight: '800', color: colors.text },
  salesmanRole: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  textOnActive: { color: colors.textInverse },
  textOnActiveMuted: { color: 'rgba(255,255,255,0.85)' },

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
});
