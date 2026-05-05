/**
 * ManagerVanLoadScreen — set what each salesman gets loaded onto their van.
 *
 * Two cards: Pets van (Pet600 + Pet1500 packs) and Cans/Gallons van
 * (filled cans + filled gallons). Edit with +/- steppers. Save updates the
 * shared salesman provider, which the salesman screens reflect immediately.
 */

import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BilingualButton, Screen } from '../../components';
import { QuantityStepper } from '../../components/QuantityStepper';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useCGSalesman } from '../../cg/state';
import { usePetsSalesman } from '../../pets/state';

const canIcon = require('../../../assets/brand/14ltr-can.webp');
const gallonIcon = require('../../../assets/brand/19ltr-gallon.webp');

export function ManagerVanLoadScreen() {
  const cg = useCGSalesman();
  const pets = usePetsSalesman();

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
      <Text style={styles.titleUr}>گاڑی کی لوڈنگ</Text>

      <Text style={styles.intro}>
        Set the totals the salesmen will see when they start their trip. Saving
        updates each salesman's app immediately.
      </Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Pets van</Text>
          <Text style={styles.cardTitleUr}>پیٹس وین</Text>
        </View>

        <QuantityStepper
          label="600 ml packs"
          labelUr="۶۰۰ ملی پیک"
          value={pet600}
          onChange={setPet600}
        />
        <View style={styles.divider} />
        <QuantityStepper
          label="1.5 L packs"
          labelUr="۱.۵ لیٹر پیک"
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
          label={{ en: 'Save Pets van load', ur: 'پیٹس وین محفوظ کریں' }}
          onPress={savePets}
          disabled={!petsDirty}
          variant={petsDirty ? 'primary' : 'secondary'}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Cans / Gallons van</Text>
          <Text style={styles.cardTitleUr}>کین / گیلن وین</Text>
        </View>

        <QuantityStepper
          label="Filled cans"
          labelUr="بھری کین"
          value={filledCans}
          onChange={setFilledCans}
          icon={canIcon}
        />
        <View style={styles.divider} />
        <QuantityStepper
          label="Filled gallons"
          labelUr="بھری گیلن"
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
          label={{ en: 'Save C/G van load', ur: 'کین/گیلن محفوظ کریں' }}
          onPress={saveCG}
          disabled={!cgDirty}
          variant={cgDirty ? 'primary' : 'secondary'}
        />
      </View>
    </Screen>
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
});
