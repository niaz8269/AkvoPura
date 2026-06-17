/**
 * ManagerStaffAccountsScreen — real users from the backend, scoped to the
 * manager's branch.
 *
 * First mobile screen that reads from the Postgres-backed API. Read-only
 * for now — creating accounts comes in B-4.
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
import { listUsers, type ApiUser } from '../../api/users';
import { ApiError } from '../../api/client';


const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  pets_salesman: 'Pets Salesman',
  cans_gallons_salesman: 'Cans / Gallons Salesman',
  production_worker: 'Production Worker',
  driver: 'Driver',
  helper: 'Helper',
  other: 'Other',
  customer: 'Customer',
};

const ROLE_COLORS: Record<string, string> = {
  owner: colors.primaryDark,
  manager: colors.primary,
  pets_salesman: colors.accent,
  cans_gallons_salesman: colors.info,
  production_worker: colors.success,
  driver: colors.warning,
  helper: colors.primary,
  other: colors.textMuted,
  customer: colors.warning,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ManagerStaffAccountsScreen({ navigation }: any) {
  const tabBarHeight = useBottomTabBarHeight();
  const [users, setUsers] = useState<ApiUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const result = await listUsers();
      // Staff Accounts is for STAFF only — customers belong in the
      // Customers tab (linked CGCustomer / PetCustomer records). Hide
      // role=customer rows so the two lists don't overlap.
      setUsers(result.filter((u) => u.role !== 'customer'));
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

  // Refresh whenever the screen regains focus (e.g. after creating /
  // updating an account in a pushed screen).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading && !users) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading staff accounts…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Staff accounts</Text>
            <Text style={styles.subtitle}>
              {users?.length ?? 0} account{users?.length === 1 ? '' : 's'} who can
              log into the app
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('AddStaffAccount')}
            style={({ pressed }) => [
              styles.addBtn,
              pressed ? { opacity: 0.85 } : null,
            ]}
            accessibilityLabel="Add staff account"
          >
            <Ionicons name="add" size={18} color={colors.textInverse} />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.body, { paddingBottom: tabBarHeight + spacing.lg }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Pressable
          onPress={() => navigation.navigate('PendingRegistrations')}
          style={({ pressed }) => [
            styles.pendingLink,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Ionicons name="hourglass-outline" size={22} color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pendingLinkTitle}>Pending registrations</Text>
            <Text style={styles.pendingLinkSub}>Customers waiting for your approval</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.warning} />
        </Pressable>

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={20} color={colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorTitle}>Couldn't load</Text>
              <Text style={styles.errorMsg}>{error}</Text>
            </View>
            <Pressable
              onPress={load}
              style={({ pressed }) => [
                styles.retryBtn,
                pressed ? { opacity: 0.85 } : null,
              ]}
            >
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {users && users.length === 0 ? (
          <Text style={styles.empty}>No staff accounts in your branch yet.</Text>
        ) : null}

        {users?.map((u) => (
          <Pressable
            key={u.id}
            onPress={() => navigation.navigate('StaffAccountDetail', { userId: u.id })}
            style={({ pressed }) => [
              styles.card,
              !u.active ? styles.cardInactive : null,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <View
              style={[
                styles.avatar,
                { backgroundColor: (ROLE_COLORS[u.role] ?? colors.primary) + '22' },
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  { color: ROLE_COLORS[u.role] ?? colors.primary },
                ]}
              >
                {u.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.name, !u.active ? styles.nameInactive : null]}
                numberOfLines={1}
              >
                {u.name}
              </Text>
              <Text style={styles.identifier}>@{u.identifier}</Text>
              <View style={styles.metaRow}>
                <View
                  style={[
                    styles.roleChip,
                    { backgroundColor: (ROLE_COLORS[u.role] ?? colors.primary) + '18' },
                  ]}
                >
                  <Text
                    style={[
                      styles.roleChipText,
                      { color: ROLE_COLORS[u.role] ?? colors.primary },
                    ]}
                  >
                    {ROLE_LABELS[u.role] ?? u.role}
                  </Text>
                </View>
                {u.branchSlug ? (
                  <Text style={styles.branchText}>· {u.branchSlug}</Text>
                ) : null}
                {!u.active ? (
                  <View style={styles.inactiveChip}>
                    <Text style={styles.inactiveChipText}>Deactivated</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  addBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.textInverse,
  },
  title: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },
  subtitle: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 4,
  },

  body: { padding: spacing.lg },
  pendingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.warning + '12',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  pendingLinkTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  pendingLinkSub: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.textMuted, fontSize: fontSizes.sm },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger + '18',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorTitle: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.danger },
  errorMsg: { fontSize: fontSizes.xs, color: colors.danger, marginTop: 2 },
  retryBtn: {
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  retryBtnText: { color: colors.textInverse, fontSize: fontSizes.xs, fontWeight: '800' },

  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xl,
  },

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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: fontSizes.body, fontWeight: '900' },
  name: { fontSize: fontSizes.body, fontWeight: '800', color: colors.text },
  identifier: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  roleChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  roleChipText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  branchText: { fontSize: fontSizes.xs, color: colors.textMuted, fontWeight: '700' },

  cardInactive: { backgroundColor: colors.surfaceMuted, opacity: 0.7 },
  nameInactive: { color: colors.textMuted },
  inactiveChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.warning + '22',
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
    bottom: spacing.xl,
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
