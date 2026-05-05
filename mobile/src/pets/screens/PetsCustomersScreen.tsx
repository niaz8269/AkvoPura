/**
 * PetsCustomersScreen — searchable customer list with today's billing summary.
 * Tap a customer → opens customer detail.
 */

import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { usePetsSalesman } from '../state';

const brandLogo = require('../../../assets/brand/akvopura-brand.png');

type Nav = { navigate: (screen: string, params?: { customerId: string }) => void };

export function PetsCustomersScreen({ navigation }: { navigation: Nav }) {
  const { customers, vanLoad, billsForCustomer } = usePetsSalesman();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [customers, query]);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Image source={brandLogo} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={styles.title}>Today's Customers</Text>
            <Text style={styles.titleUr}>آج کے کسٹمرز</Text>
          </View>
        </View>

        <View style={styles.vanRow}>
          <VanStat label="600 ml packs" value={vanLoad.pet600Packs} />
          <VanStat label="1.5 L packs" value={vanLoad.pet1500Packs} />
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, area, or phone"
          placeholderTextColor={colors.textMuted}
          style={styles.search}
          autoCorrect={false}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.map((c) => {
          const billed = billsForCustomer(c.id);
          const billedToday = billed.length > 0;
          const cans600 = billed.reduce((s, b) => s + b.pet600Packs, 0);
          const cans1500 = billed.reduce((s, b) => s + b.pet1500Packs, 0);
          return (
            <Pressable
              key={c.id}
              onPress={() => navigation.navigate('PetCustomerDetail', { customerId: c.id })}
              style={({ pressed }) => [
                styles.card,
                billedToday ? styles.cardBilled : null,
                c.outstandingDebt > 0 ? styles.cardDebt : null,
                pressed ? styles.cardPressed : null,
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.name, billedToday ? styles.nameBilled : null]}
                    numberOfLines={1}
                  >
                    {c.name}
                  </Text>
                  <Text
                    style={[styles.address, billedToday ? styles.subBilled : null]}
                    numberOfLines={1}
                  >
                    {c.area} • {c.address}
                  </Text>
                </View>
                {billedToday ? <View style={styles.greenDot} /> : null}
              </View>

              {billedToday ? (
                <Text style={styles.billedText}>
                  Sold today: {cans600} × 600ml • {cans1500} × 1.5L
                </Text>
              ) : null}

              {c.outstandingDebt > 0 ? (
                <Text
                  style={[
                    styles.debtLine,
                    billedToday ? styles.debtBilled : null,
                  ]}
                >
                  Owes Rs {c.outstandingDebt.toLocaleString()}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
        {filtered.length === 0 ? (
          <Text style={styles.empty}>No matching customers.</Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function VanStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.vanStat}>
      <Text style={styles.vanValue}>{value}</Text>
      <Text style={styles.vanLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  logo: { width: 44, height: 44 },
  title: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  titleUr: { fontSize: fontSizes.body, color: colors.primary },
  vanRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  vanStat: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  vanValue: {
    fontSize: fontSizes.heading,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  vanLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  search: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSizes.body,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cardBilled: {
    backgroundColor: colors.statusGreen,
    borderColor: '#2A9C56',
  },
  cardDebt: {
    borderColor: colors.danger,
    borderLeftWidth: 6,
  },
  cardPressed: { opacity: 0.85 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.surface,
    marginLeft: spacing.sm,
  },
  name: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  nameBilled: { color: colors.textInverse },
  address: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  subBilled: { color: 'rgba(255,255,255,0.85)' },
  billedText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textInverse,
    marginTop: spacing.sm,
  },
  debtLine: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.danger,
    marginTop: spacing.sm,
  },
  debtBilled: { color: colors.textInverse },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xl,
  },
});
