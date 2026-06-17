/**
 * PetsCustomersScreen — searchable customer list with today's billing summary.
 * Tap a customer → opens customer detail.
 */

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { usePetsSalesman } from '../state';

type Nav = {
  navigate: (screen: string, params?: { customerId?: string }) => void;
};

export function PetsCustomersScreen({ navigation }: { navigation: Nav }) {
  const tabBarHeight = useBottomTabBarHeight();
  const { customers, vanLoad, billsForCustomer, currentTripNumber } = usePetsSalesman();
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
      <View style={styles.headerBar}>
        <View style={styles.tripChip}>
          <Text style={styles.tripChipText}>Trip #{currentTripNumber}</Text>
        </View>
        <Text style={styles.headerStat}>
          On van: <Text style={styles.headerStatVal}>{vanLoad.pet600Packs}</Text> × 600ml ·{' '}
          <Text style={styles.headerStatVal}>{vanLoad.pet1500Packs}</Text> × 1.5L
        </Text>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name, area, or phone"
        placeholderTextColor={colors.textMuted}
        style={styles.search}
        autoCorrect={false}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 80 }]}
      >
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

      <Pressable
        onPress={() => navigation.navigate('AddCustomer')}
        style={({ pressed }) => [
          styles.fab,
          { bottom: tabBarHeight + spacing.md },
          pressed ? { opacity: 0.85 } : null,
        ]}
        accessibilityLabel="Add customer"
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 32,
  },
  headerStat: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  headerStatVal: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  tripChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.accent + '22',
    marginRight: spacing.md,
  },
  tripChipText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 0.5,
  },
  search: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    marginHorizontal: spacing.lg,
    marginTop: 6,
    marginBottom: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    fontSize: fontSizes.sm,
    color: colors.text,
    backgroundColor: colors.background,
  },
  scroll: { flex: 1 },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
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
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
