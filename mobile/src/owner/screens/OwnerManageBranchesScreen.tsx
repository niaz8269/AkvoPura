/**
 * OwnerManageBranchesScreen — owner's admin view of all branches.
 *
 * Shows every branch (active + inactive) with name, slug, location.
 * Tap to edit; FAB to add a new branch. Owner-only — backend rejects
 * non-owner tokens.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { listBranches, type ApiBranch } from '../../api/branches';
import { ApiError } from '../../api/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function OwnerManageBranchesScreen({ navigation }: any) {
  const tabBarHeight = useBottomTabBarHeight();
  const [branches, setBranches] = useState<ApiBranch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setBranches(await listBranches());
    } catch (e: unknown) {
      const msg =
        e instanceof ApiError
          ? e.code === 'network_error'
            ? 'Cannot reach the server. Check Wi-Fi.'
            : `Server error: ${e.message}`
          : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading && !branches) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Branches</Text>
        <Text style={styles.titleUr}>برانچیں</Text>
        <Text style={styles.subtitle}>
          {branches?.length ?? 0} branch{branches?.length === 1 ? '' : 'es'} configured
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: tabBarHeight + 80 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={20} color={colors.danger} />
            <Text style={styles.errorMsg}>{error}</Text>
          </View>
        ) : null}

        {branches?.map((b) => (
          <Pressable
            key={b.slug}
            onPress={() => navigation.navigate('EditBranch', { slug: b.slug })}
            style={({ pressed }) => [
              styles.card,
              !b.active ? styles.cardInactive : null,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <View style={[styles.icon, !b.active ? styles.iconInactive : null]}>
              <Ionicons
                name="business"
                size={20}
                color={b.active ? colors.primary : colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, !b.active ? styles.nameInactive : null]}>
                {b.name}
                {b.nameUr ? <Text style={styles.nameUr}>  {b.nameUr}</Text> : null}
              </Text>
              <Text style={styles.slug}>@{b.slug}</Text>
              {b.location ? (
                <Text style={styles.location}>📍 {b.location}</Text>
              ) : null}
              {!b.active ? (
                <View style={styles.inactiveChip}>
                  <Text style={styles.inactiveChipText}>Inactive</Text>
                </View>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </ScrollView>

      <Pressable
        onPress={() => navigation.navigate('AddBranch')}
        style={({ pressed }) => [
          styles.fab,
          { bottom: tabBarHeight + spacing.md },
          pressed ? { opacity: 0.85 } : null,
        ]}
        accessibilityLabel="Add branch"
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },
  titleUr: { fontSize: fontSizes.body, color: colors.primary, marginTop: 2 },
  subtitle: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 4 },

  body: { padding: spacing.lg, paddingBottom: spacing.xxxl + 56 },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger + '18',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorMsg: { fontSize: fontSizes.sm, color: colors.danger, fontWeight: '700' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardInactive: { backgroundColor: colors.surfaceMuted, opacity: 0.7 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInactive: { backgroundColor: colors.surfaceMuted },
  name: { fontSize: fontSizes.body, fontWeight: '800', color: colors.text },
  nameInactive: { color: colors.textMuted },
  nameUr: { fontSize: fontSizes.sm, color: colors.primary, fontWeight: '600' },
  slug: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  location: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  inactiveChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.warning + '22',
    marginTop: 4,
  },
  inactiveChipText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.warning,
    textTransform: 'uppercase',
  },

  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
