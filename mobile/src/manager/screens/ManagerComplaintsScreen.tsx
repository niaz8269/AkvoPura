/**
 * ManagerComplaintsScreen — manager-side complaint inbox.
 *
 * Customers file complaints from the Customer portal (any of: delivery,
 * product quality, billing, salesman behaviour, other) addressed to either
 * salesman or manager. Manager sees them all here and walks them through
 * Open → In review → Resolved.
 */

import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useCustomerPortal } from '../../customer/state';
import type { Complaint, ComplaintStatus } from '../../customer/types';

/** Two-tab layout: anything not yet resolved is "Active" so a manager
 *  doesn't lose track of a complaint when they flip its status. */
type Tab = 'active' | 'resolved';

const TAB_LABELS: Record<Tab, string> = {
  active: 'Active',
  resolved: 'Resolved',
};

const CAT_LABELS: Record<Complaint['category'], string> = {
  delivery: 'Delivery',
  product_quality: 'Product quality',
  billing: 'Billing',
  salesman_behavior: 'Salesman behaviour',
  other: 'Other',
};

const STATUS_META: Record<ComplaintStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: colors.warning },
  in_review: { label: 'In review', color: colors.info },
  resolved: { label: 'Resolved', color: colors.success },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ManagerComplaintsScreen({ navigation }: any) {
  const { complaints, markComplaintInReview, resolveComplaint } = useCustomerPortal();
  const [tab, setTab] = useState<Tab>('active');

  const counts = useMemo(() => {
    let active = 0;
    let resolved = 0;
    complaints.forEach((cmp) => {
      if (cmp.status === 'resolved') resolved++;
      else active++;
    });
    return { active, resolved };
  }, [complaints]);

  const visible = useMemo(
    () =>
      complaints
        .filter((c) =>
          tab === 'active' ? c.status !== 'resolved' : c.status === 'resolved',
        )
        // Within Active, show "Open" before "In review" so newer items
        // surface first. Within Resolved, newest first.
        .sort((a, b) => {
          if (tab === 'active' && a.status !== b.status) {
            return a.status === 'open' ? -1 : 1;
          }
          return b.filedAt - a.filedAt;
        }),
    [complaints, tab],
  );

  return (
    <Screen padded={false}>
      <View style={styles.tabRow}>
        {(['active', 'resolved'] as Tab[]).map((t) => {
          const active = t === tab;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={({ pressed }) => [
                styles.tab,
                active ? styles.tabActive : null,
                pressed && !active ? styles.tabPressed : null,
              ]}
            >
              <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>
                {TAB_LABELS[t]} · {counts[t]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
        {visible.length === 0 ? (
          <Text style={styles.empty}>No {TAB_LABELS[tab].toLowerCase()} complaints.</Text>
        ) : (
          visible.map((c) => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              onPress={() =>
                navigation.navigate('ComplaintDetail', { complaintId: c.id })
              }
              onReview={() => markComplaintInReview(c.id)}
              onResolve={() => resolveComplaint(c.id)}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function ComplaintCard({
  complaint,
  onPress,
  onReview,
  onResolve,
}: {
  complaint: Complaint;
  onPress: () => void;
  onReview: () => void;
  onResolve: () => void;
}) {
  const meta = STATUS_META[complaint.status];
  const customerName = complaint.customerName ?? 'Customer';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: meta.color },
        pressed ? { opacity: 0.85 } : null,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.statusChip, { backgroundColor: meta.color + '22' }]}>
          <Text style={[styles.statusChipText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <View style={styles.toChip}>
          <Text style={styles.toChipText}>→ {complaint.recipient}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={styles.timeText}>{formatDateTime(complaint.filedAt)}</Text>
      </View>

      <Text style={styles.customer}>{customerName}</Text>
      <Text style={styles.category}>{CAT_LABELS[complaint.category]}</Text>
      <Text style={styles.description}>{complaint.description}</Text>

      {complaint.status !== 'resolved' ? (
        <View style={styles.actionRow}>
          {complaint.status === 'open' ? (
            <Pressable
              onPress={() =>
                Alert.alert('Mark in review?', 'Customer will see this is being looked at.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'In review', onPress: onReview },
                ])
              }
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionInfo,
                pressed ? { opacity: 0.85 } : null,
              ]}
            >
              <Ionicons name="eye-outline" size={16} color={colors.info} />
              <Text style={[styles.actionBtnText, { color: colors.info }]}>In review</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() =>
              Alert.alert('Mark resolved?', 'Customer can then rate the resolution.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Resolve', onPress: onResolve },
              ])
            }
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionSuccess,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
            <Text style={[styles.actionBtnText, { color: colors.success }]}>Resolved</Text>
          </Pressable>
        </View>
      ) : complaint.rating ? (
        <Text style={styles.ratingLine}>
          {'★'.repeat(complaint.rating)}{'☆'.repeat(5 - complaint.rating)} customer rating
        </Text>
      ) : (
        <Text style={styles.noRating}>Awaiting customer rating</Text>
      )}
    </Pressable>
  );
}

function formatDateTime(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const same =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (same)
    return `Today ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  tabPressed: { backgroundColor: colors.surfaceMuted },
  tabText: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  tabTextActive: { color: colors.textInverse },

  scroll: { flex: 1 },
  list: { paddingHorizontal: spacing.lg, paddingTop: 4, paddingBottom: spacing.sm },
  empty: {
    fontStyle: 'italic',
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  statusChipText: { fontSize: 10, fontWeight: '900' },
  toChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  toChipText: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  timeText: { fontSize: fontSizes.xs, color: colors.textMuted },

  customer: { fontSize: fontSizes.body, fontWeight: '800', color: colors.primaryDark },
  category: { fontSize: fontSizes.xs, fontWeight: '700', color: colors.primary, marginTop: 2 },
  description: {
    fontSize: fontSizes.sm,
    color: colors.text,
    marginTop: spacing.xs,
    lineHeight: 20,
  },

  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  actionInfo: { borderColor: colors.info, backgroundColor: colors.info + '10' },
  actionSuccess: { borderColor: colors.success, backgroundColor: colors.success + '10' },
  actionBtnText: { fontSize: 12, fontWeight: '800' },

  ratingLine: {
    fontSize: fontSizes.body,
    color: colors.warning,
    fontWeight: '800',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  noRating: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
