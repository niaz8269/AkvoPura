/**
 * ManagerVanLoadScreen — set what each salesman gets loaded onto their van.
 *
 * Two cards: Pets van (Pet600 + Pet1500 packs) and Cans/Gallons van
 * (filled cans + filled gallons). Edit with +/- steppers. Save updates the
 * shared salesman provider, which the salesman screens reflect immediately.
 */

import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BilingualButton, Screen } from '../../components';
import { QuantityStepper } from '../../components/QuantityStepper';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useCGSalesman } from '../../cg/state';
import { usePetsSalesman } from '../../pets/state';
import { useAssignments } from '../../assignments/state';
import type { Role, User } from '../../auth/types';

const canIcon = require('../../../assets/brand/14ltr-can.webp');
const gallonIcon = require('../../../assets/brand/19ltr-gallon.webp');

export function ManagerVanLoadScreen() {
  const cg = useCGSalesman();
  const pets = usePetsSalesman();
  const assignments = useAssignments();

  const startNewPetsTrip = () => {
    Alert.alert(
      'Start a new Pets trip?',
      `Current trip is #${pets.currentTripNumber}. Starting trip #${pets.currentTripNumber + 1} will reset the van load — please set the new totals after.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start trip',
          onPress: () => {
            pets.startNewTrip(pet600, pet1500);
            Alert.alert('Trip started', `Pets van is now on trip #${pets.currentTripNumber + 1}.`);
          },
        },
      ]
    );
  };

  const startNewCgTrip = () => {
    Alert.alert(
      'Start a new C/G trip?',
      `Current trip is #${cg.currentTripNumber}. Starting trip #${cg.currentTripNumber + 1} will reset the filled cans/gallons — please set the new totals after.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start trip',
          onPress: () => {
            cg.startNewTrip(filledCans, filledGallons);
            Alert.alert('Trip started', `C/G van is now on trip #${cg.currentTripNumber + 1}.`);
          },
        },
      ]
    );
  };

  const [pet600, setPet600] = useState(pets.vanLoad.pet600Packs);
  const [pet1500, setPet1500] = useState(pets.vanLoad.pet1500Packs);
  const [filledCans, setFilledCans] = useState(cg.vanLoad.filledCans);
  const [filledGallons, setFilledGallons] = useState(cg.vanLoad.filledGallons);

  // Keep local state in sync if van load changes externally (e.g. salesman
  // delivers and reduces stock).
  useEffect(() => {
    setPet600(pets.vanLoad.pet600Packs);
    setPet1500(pets.vanLoad.pet1500Packs);
  }, [pets.vanLoad.pet600Packs, pets.vanLoad.pet1500Packs]);

  useEffect(() => {
    setFilledCans(cg.vanLoad.filledCans);
    setFilledGallons(cg.vanLoad.filledGallons);
  }, [cg.vanLoad.filledCans, cg.vanLoad.filledGallons]);

  const petsDirty =
    pet600 !== pets.vanLoad.pet600Packs || pet1500 !== pets.vanLoad.pet1500Packs;
  const cgDirty =
    filledCans !== cg.vanLoad.filledCans || filledGallons !== cg.vanLoad.filledGallons;

  const savePets = () => {
    pets.setVanPacks(pet600, pet1500);
    Alert.alert('Saved', 'Pets van load updated. Salesman will see the new totals.');
  };

  const saveCG = () => {
    cg.setFilledLoad(filledCans, filledGallons);
    Alert.alert('Saved', 'Cans/Gallons van load updated. Salesman will see the new totals.');
  };

  return (
    <Screen scroll>
      <Text style={styles.title}>Van Loading</Text>

      <Text style={styles.intro}>
        Set the totals the salesmen will see when they start their trip. Saving
        updates each salesman's app immediately.
      </Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.cardTitle}>Pets van</Text>
            <View style={styles.tripBadge}>
              <Text style={styles.tripBadgeText}>Trip #{pets.currentTripNumber}</Text>
            </View>
          </View>
        </View>

        <SalesmanPicker
          title="Today's Pets salesman"
          options={assignments.candidates('pets_salesman')}
          selectedId={assignments.petsSalesmanId}
          onSelect={assignments.setPetsSalesman}
        />

        <View style={styles.divider} />

        <QuantityStepper
          label="600 ml packs"
          labelUr="  "
          value={pet600}
          onChange={setPet600}
        />
        <View style={styles.divider} />
        <QuantityStepper
          label="1.5 L packs"
          labelUr=".  "
          value={pet1500}
          onChange={setPet1500}
        />

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Currently on van: {pets.vanLoad.pet600Packs} × 600ml •{' '}
            {pets.vanLoad.pet1500Packs} × 1.5L
          </Text>
        </View>

        <BilingualButton
          label={{ en: 'Save Pets van load', ur: '   ' }}
          onPress={savePets}
          disabled={!petsDirty}
          variant={petsDirty ? 'primary' : 'secondary'}
        />

        <Pressable
          onPress={startNewPetsTrip}
          style={({ pressed }) => [
            styles.startTripBtn,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Ionicons name="refresh-circle-outline" size={18} color={colors.warning} />
          <Text style={styles.startTripText}>
            Start new trip (#{pets.currentTripNumber + 1})
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.cardTitle}>Cans / Gallons van</Text>
            <View style={styles.tripBadge}>
              <Text style={styles.tripBadgeText}>Trip #{cg.currentTripNumber}</Text>
            </View>
          </View>
        </View>

        <SalesmanPicker
          title="Today's C/G salesman"
          options={assignments.candidates('cans_gallons_salesman')}
          selectedId={assignments.cgSalesmanId}
          onSelect={assignments.setCgSalesman}
        />

        <View style={styles.divider} />

        <QuantityStepper
          label="Filled cans"
          labelUr=" "
          value={filledCans}
          onChange={setFilledCans}
          icon={canIcon}
        />
        <View style={styles.divider} />
        <QuantityStepper
          label="Filled gallons"
          labelUr=" "
          value={filledGallons}
          onChange={setFilledGallons}
          icon={gallonIcon}
        />

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Currently on van: {cg.vanLoad.filledCans} cans • {cg.vanLoad.filledGallons} gallons
          </Text>
          <Text style={styles.summarySub}>
            Empties returned today: {cg.vanLoad.emptyCansAboard} cans •{' '}
            {cg.vanLoad.emptyGallonsAboard} gallons
          </Text>
        </View>

        <BilingualButton
          label={{ en: 'Save C/G van load', ur: '/  ' }}
          onPress={saveCG}
          disabled={!cgDirty}
          variant={cgDirty ? 'primary' : 'secondary'}
        />

        <Pressable
          onPress={startNewCgTrip}
          style={({ pressed }) => [
            styles.startTripBtn,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Ionicons name="refresh-circle-outline" size={18} color={colors.warning} />
          <Text style={styles.startTripText}>
            Start new trip (#{cg.currentTripNumber + 1})
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function SalesmanPicker({
  title,
  options,
  selectedId,
  onSelect,
}: {
  title: string;
  options: User[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <View style={styles.picker}>
      <Text style={styles.pickerLabel}>{title}</Text>
      <View style={styles.pickerOptions}>
        {options.map((u) => {
          const active = u.id === selectedId;
          return (
            <Pressable
              key={u.id}
              onPress={() => onSelect(u.id)}
              style={({ pressed }) => [
                styles.pickerOption,
                active ? styles.pickerOptionActive : null,
                pressed && !active ? { opacity: 0.7 } : null,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Ionicons
                name={active ? 'person' : 'person-outline'}
                size={16}
                color={active ? colors.textInverse : colors.primaryDark}
              />
              <Text
                style={[styles.pickerOptionText, active ? styles.pickerOptionTextActive : null]}
                numberOfLines={1}
              >
                {u.name}
              </Text>
            </Pressable>
          );
        })}
        {options.length === 0 ? (
          <Text style={styles.pickerEmpty}>No salesmen available.</Text>
        ) : null}
      </View>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { marginBottom: spacing.md },
  cardTitle: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },
  cardTitleUr: { fontSize: fontSizes.sm, color: colors.primary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  summary: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radii.md,
    marginVertical: spacing.md,
  },
  summaryText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  summarySub: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  picker: {
    marginBottom: spacing.sm,
  },
  pickerLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  pickerOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
  },
  pickerOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  pickerOptionText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  pickerOptionTextActive: { color: colors.textInverse },
  pickerEmpty: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  tripBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.accent + '22',
  },
  tripBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 0.5,
  },
  startTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.warning,
    backgroundColor: colors.warning + '10',
  },
  startTripText: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.warning,
  },
});
