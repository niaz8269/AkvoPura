/**
 * OwnerManageManagersScreen — owner-only list of all manager accounts
 * across every branch. Tapping a row reuses ManagerStaffAccountDetailScreen
 * for editing (backend permission rules already let the owner manage
 * managers; they block managers from editing other managers).
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
import { listUsers, type ApiUser } from '../../api/users';
import { ApiError } from '../../api/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function OwnerManageManagersScreen({ navigation }: any) {
  const [managers, setManagers] = useState<ApiUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const result = await listUsers({ role: 'manager' });
      setManagers(result);
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

  if (loading && !managers) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading managers…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Branch managers</Text>
            <Text style={styles.subtitle}>
              {managers?.length ?? 0} manager{managers?.length === 1 ? '' : 's'}
              {' '}— tap to edit name, branch, reset password, or deactivate
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('AddStaffAccount')}
            style={({ pressed }) => [
              styles.addBtn,
              pressed ? { opacity: 0.85 } : null,
            ]}
            accessibilityLabel="Add manager account"
          >
            <Ionicons name="add" size={18} color={colors.textInverse} />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
          />
        }
      >
        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={20} color={colors.danger} />
            <Text style={styles.errorMsg}>{error}</Text>
          </View>
        ) : null}

        {managers && managers.length === 0 ? (
          <Text style={styles.empty}>
            No manager accounts yet. Tap Add to create one.
          </Text>
        ) : null}

        {managers?.map((u) => (
          <Pressable
            key={u.id}
            onPress={() => navigation.navigate('StaffAccountDetail', { userId: u.id })}
            style={({ pressed }) => [
              styles.card,
              !u.active ? styles.cardInactive : null,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {u.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, !u.active ? styles.nameInactive : null]}>
                {u.name}
              </Text>
              <Text style={styles.identifier}>@{u.identifier}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.branchText}>
                  {u.branchSlug ?? '— no branch —'}
                </Text>
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
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },
  subtitle: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  addBtnText: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.textInverse },
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
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.xl,
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
  cardInactive: { opacity: 0.6 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSizes.body,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  name: { fontSize: fontSizes.body, fontWeight: '800', color: colors.text },
  nameInactive: { color: colors.textMuted },
  identifier: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  branchText: { fontSize: fontSizes.xs, color: colors.text, fontWeight: '700' },
  inactiveChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  inactiveChipText: { fontSize: 10, fontWeight: '800', color: colors.textMuted },
});
