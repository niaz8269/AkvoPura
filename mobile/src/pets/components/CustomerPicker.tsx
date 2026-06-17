/**
 * CustomerPicker — search-and-select used by Sell + Returns screens.
 *
 * Shows the chosen customer in a compact "chip" that can be tapped to change.
 * When no one is chosen, expands into a search box + filtered list.
 */

import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fontSizes, radii, spacing } from '../../theme';
import type { PetCustomer } from '../types';

type Props = {
  customers: PetCustomer[];
  selected: PetCustomer | null;
  onSelect: (customer: PetCustomer | null) => void;
  /** Deprecated — kept for API stability. Picker is now a flat View; the
   *  parent ScrollView handles scrolling, which avoids the nested-ScrollView
   *  gesture conflict that hid customers past the 5th row. */
  maxHeight?: number;
};

export function CustomerPicker({ customers, selected, onSelect }: Props) {
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

  if (selected) {
    return (
      <View style={styles.selectedWrap}>
        <View style={styles.selectedCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectedName}>{selected.name}</Text>
            <Text style={styles.selectedMeta}>
              {selected.area} • {selected.phone}
            </Text>
            {selected.outstandingDebt > 0 ? (
              <Text style={styles.selectedDebt}>
                Outstanding: Rs {selected.outstandingDebt.toLocaleString()}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => onSelect(null)}
            style={({ pressed }) => [
              styles.changeBtn,
              pressed ? { opacity: 0.7 } : null,
            ]}
            accessibilityLabel="Change customer"
          >
            <Text style={styles.changeBtnText}>Change</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.label}>Pick customer</Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name, area, or phone"
        placeholderTextColor={colors.textMuted}
        style={styles.search}
        autoCorrect={false}
      />

      <View style={styles.list}>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>No matches.</Text>
        ) : (
          filtered.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => onSelect(c)}
              style={({ pressed }) => [
                styles.row,
                pressed ? styles.rowPressed : null,
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {c.name}
                </Text>
                <Text style={styles.rowSub} numberOfLines={1}>
                  {c.area} • {c.phone}
                </Text>
              </View>
              {c.outstandingDebt > 0 ? (
                <View style={styles.debtChip}>
                  <Text style={styles.debtChipText}>
                    Rs {c.outstandingDebt.toLocaleString()}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.text,
  },
  labelUr: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
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
    marginBottom: spacing.sm,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  rowPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  rowName: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  rowSub: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  debtChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.danger + '22',
  },
  debtChipText: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: colors.danger,
  },
  selectedWrap: {
    marginBottom: spacing.md,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '12',
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  selectedName: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  selectedMeta: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  selectedDebt: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.danger,
    marginTop: 2,
  },
  changeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  changeBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.primary,
  },
});
