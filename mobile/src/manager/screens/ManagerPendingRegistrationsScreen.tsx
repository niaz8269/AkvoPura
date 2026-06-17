/**
 * ManagerPendingRegistrationsScreen — customers who self-registered and
 * are waiting for the branch manager to approve them.
 *
 * Tapping a row pushes to ManagerVerifyCustomerScreen where the manager
 * fills in operational details (route + payment cycle for CG; area for
 * Pets) and approves.
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

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { listPendingRegistrations, type ApiUser } from '../../api/users';
import { ApiError } from '../../api/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ManagerPendingRegistrationsScreen({ navigation }: any) {
  const [users, setUsers] = useState<ApiUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setUsers(await listPendingRegistrations());
    } catch (e: unknown) {
      const msg =
        e instanceof ApiError
          ? e.code === 'network_error'
            ? 'Cannot reach the server. Check Wi-Fi.'
            : `Server error: ${e.message || e.code}`
          : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading && !users) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading pending registrations…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Pending registrations</Text>
        <Text style={styles.subtitle}>
          {users?.length ?? 0} customer{users?.length === 1 ? '' : 's'} waiting for approval
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={20} color={colors.danger} />
            <Text style={styles.errorMsg}>{error}</Text>
          </View>
        ) : null}

        {users && users.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={36} color={colors.success} />
            <Text style={styles.emptyText}>
              No pending registrations. New customers will appear here once they sign up.
            </Text>
          </View>
        ) : null}

        {users?.map((u) => (
          <Pressable
            key={u.id}
            onPress={() => navigation.navigate('VerifyCustomer', { user: u })}
            style={({ pressed }) => [
              styles.card,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <View
              style={[
                styles.kindBadge,
                u.pendingCustomerKind === 'cg' ? styles.kindBadgeCg : styles.kindBadgePets,
              ]}
            >
              <Text style={styles.kindBadgeText}>
                {u.pendingCustomerKind === 'cg' ? 'C/G' : 'Pets'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{u.name}</Text>
              <Text style={styles.identifier}>@{u.identifier}</Text>
              {u.phone ? (
                <View style={styles.phoneRow}>
                  <Ionicons name="call-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.phoneText}>{u.phone}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.verifyChip}>
              <Text style={styles.verifyChipText}>Verify</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textInverse} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.textMuted, fontSize: fontSizes.sm },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },
  subtitle: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 4 },
  body: { padding: spacing.lg },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger + '18',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorMsg: { flex: 1, color: colors.danger, fontSize: fontSizes.sm },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
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
  kindBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    minWidth: 48,
    alignItems: 'center',
  },
  kindBadgeCg: { backgroundColor: colors.primary + '22' },
  kindBadgePets: { backgroundColor: colors.accent + '22' },
  kindBadgeText: { fontSize: 11, fontWeight: '900', color: colors.primaryDark },
  name: { fontSize: fontSizes.body, fontWeight: '800', color: colors.text },
  identifier: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  phoneText: { fontSize: fontSizes.xs, color: colors.textMuted },
  verifyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  verifyChipText: { color: colors.textInverse, fontSize: fontSizes.xs, fontWeight: '800' },
});
