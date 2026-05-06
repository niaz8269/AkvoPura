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

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { listUsers, type ApiUser } from '../../api/users';
import { ApiError } from '../../api/client';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  pets_salesman: 'Pets Salesman',
  cans_gallons_salesman: 'Cans / Gallons Salesman',
  customer: 'Customer',
};

const ROLE_COLORS: Record<string, string> = {
  owner: colors.primaryDark,
  manager: colors.primary,
  pets_salesman: colors.accent,
  cans_gallons_salesman: colors.info,
  customer: colors.warning,
};

export function ManagerStaffAccountsScreen() {
  const [users, setUsers] = useState<ApiUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const result = await listUsers();
      setUsers(result);
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
        <Text style={styles.title}>Staff accounts</Text>
        <Text style={styles.titleUr}>عملہ کے اکاؤنٹس</Text>
        <Text style={styles.subtitle}>
          {users?.length ?? 0} account{users?.length === 1 ? '' : 's'} who can
          log into the app
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
          <View key={u.id} style={styles.card}>
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
              <Text style={styles.name} numberOfLines={1}>{u.name}</Text>
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
                {u.branch ? (
                  <Text style={styles.branchText}>· {u.branch}</Text>
                ) : null}
              </View>
            </View>
          </View>
        ))}

        <Text style={styles.footnote}>
          Creating new accounts ships in the next slice.
        </Text>
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
  title: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },
  titleUr: { fontSize: fontSizes.body, color: colors.primary, marginTop: 2 },
  subtitle: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 4,
  },

  body: { padding: spacing.lg },
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

  footnote: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
