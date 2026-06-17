/**
 * CustomerComplaintsScreen — file new complaints + view existing ones.
 *
 * Open form on top: category picker + recipient toggle (Salesman/Manager) +
 * description + submit. Below: list of past complaints with status.
 */

import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BilingualButton, Screen } from '../../components';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { useCustomerPortal } from '../state';
import type {
  Complaint,
  ComplaintCategory,
  ComplaintRecipient,
  ComplaintStatus,
} from '../types';

const CATEGORIES: { id: ComplaintCategory; en: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'delivery', en: 'Delivery', icon: 'cube-outline' },
  { id: 'product_quality', en: 'Product quality', icon: 'water-outline' },
  { id: 'billing', en: 'Billing', icon: 'receipt-outline' },
  { id: 'salesman_behavior', en: 'Salesman behaviour', icon: 'person-outline' },
  { id: 'other', en: 'Other', icon: 'ellipsis-horizontal-outline' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CustomerComplaintsScreen({ navigation }: any) {
  const { user } = useAuth();
  const portal = useCustomerPortal();

  const [category, setCategory] = useState<ComplaintCategory>('delivery');
  const [recipient, setRecipient] = useState<ComplaintRecipient>('manager');
  const [description, setDescription] = useState('');

  const myComplaints = user ? portal.complaintsForUser(user.id) : [];
  const ordered = [...myComplaints].sort((a, b) => b.filedAt - a.filedAt);

  const submit = async () => {
    if (!user) return;
    if (description.trim().length < 5) {
      Alert.alert('Too short', 'Please describe the issue in at least a few words.');
      return;
    }
    try {
      await portal.fileComplaint({
        customerUserId: user.id,
        category,
        recipient,
        description: description.trim(),
      });
      setDescription('');
      Alert.alert('Filed', `Complaint sent to ${recipient}. They will review it shortly.`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not file';
      Alert.alert('Failed', msg);
    }
  };

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Complaints</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>File a new complaint</Text>

            <Text style={styles.fieldLabel}>What's the issue about?</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((c) => {
                const active = c.id === category;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setCategory(c.id)}
                    style={({ pressed }) => [
                      styles.catChip,
                      active ? styles.catChipActive : null,
                      pressed && !active ? { opacity: 0.7 } : null,
                    ]}
                  >
                    <Ionicons
                      name={c.icon}
                      size={16}
                      color={active ? colors.textInverse : colors.primaryDark}
                    />
                    <Text style={[styles.catText, active ? styles.catTextActive : null]}>
                      {c.en}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Who should hear it?</Text>
            <View style={styles.recipientRow}>
              <RecipientPill
                label="Salesman"

                active={recipient === 'salesman'}
                onPress={() => setRecipient('salesman')}
              />
              <RecipientPill
                label="Manager"

                active={recipient === 'manager'}
                onPress={() => setRecipient('manager')}
              />
            </View>

            <Text style={styles.fieldLabel}>Describe what happened</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Tell us what went wrong..."
              placeholderTextColor={colors.textMuted}
              style={styles.descInput}
              multiline
              numberOfLines={4}
            />

            <BilingualButton
              label={{ en: 'Submit complaint' }}
              onPress={submit}
              disabled={description.trim().length === 0}
            />
          </View>

          <Text style={styles.sectionTitle}>Your complaint history</Text>
          <Text style={styles.tapHint}>Tap any to view replies & follow up.</Text>
          {ordered.length === 0 ? (
            <Text style={styles.empty}>No complaints filed yet.</Text>
          ) : (
            ordered.map((c) => (
              <ComplaintCard
                key={c.id}
                complaint={c}
                onPress={() =>
                  navigation.navigate('ComplaintDetail', { complaintId: c.id })
                }
                onRate={(r) => portal.rateComplaint(c.id, r)}
              />
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function RecipientPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.recipientPill,
        active ? styles.recipientPillActive : null,
        pressed && !active ? { opacity: 0.7 } : null,
      ]}
    >
      <Text style={[styles.recipientText, active ? styles.recipientTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ComplaintCard({
  complaint,
  onPress,
  onRate,
}: {
  complaint: Complaint;
  onPress: () => void;
  onRate: (rating: number) => void;
}) {
  const meta = STATUS_META[complaint.status];
  const cat = CATEGORIES.find((c) => c.id === complaint.category);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.complaintCard,
        { borderLeftColor: meta.color },
        pressed ? { opacity: 0.85 } : null,
      ]}
    >
      <View style={styles.complaintHeader}>
        <View style={[styles.statusChip, { backgroundColor: meta.color + '22' }]}>
          <Text style={[styles.statusChipText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <View style={styles.toChip}>
          <Text style={styles.toChipText}>→ {complaint.recipient}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={styles.complaintTime}>{formatDateTime(complaint.filedAt)}</Text>
      </View>

      <Text style={styles.complaintCategory}>{cat?.en ?? complaint.category}</Text>
      <Text style={styles.complaintDesc}>{complaint.description}</Text>

      {complaint.status === 'resolved' ? (
        <View style={styles.ratingBlock}>
          <Text style={styles.ratingLabel}>
            {complaint.rating
              ? 'Your rating'
              : 'How was the resolution? Tap a star.'}
          </Text>
          <View style={styles.ratingStars}>
            {[1, 2, 3, 4, 5].map((n) => {
              const filled = (complaint.rating ?? 0) >= n;
              return (
                <Pressable
                  key={n}
                  onPress={() => onRate(n)}
                  style={({ pressed }) => [
                    styles.starBtn,
                    pressed ? { opacity: 0.6 } : null,
                  ]}
                  accessibilityLabel={`Rate ${n} star${n > 1 ? 's' : ''}`}
                >
                  <Ionicons
                    name={filled ? 'star' : 'star-outline'}
                    size={28}
                    color={filled ? colors.warning : colors.textMuted}
                  />
                </Pressable>
              );
            })}
          </View>
          {complaint.rating ? (
            <Text style={styles.ratingHint}>Tap again to change.</Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const STATUS_META: Record<ComplaintStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: colors.warning },
  in_review: { label: 'In review', color: colors.info },
  resolved: { label: 'Resolved', color: colors.success },
};

function formatDateTime(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const same =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (same) {
    return `Today ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },

  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },

  formCard: {
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
  formTitle: { fontSize: fontSizes.body, fontWeight: '800', color: colors.primaryDark },
  formTitleUr: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    marginBottom: spacing.md,
  },

  fieldLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  catText: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.primaryDark },
  catTextActive: { color: colors.textInverse },

  recipientRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  recipientPill: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  recipientPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  recipientText: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  recipientTextActive: { color: colors.textInverse },
  recipientTextUrActive: { color: 'rgba(255,255,255,0.85)' },

  descInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSizes.body,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 2,
  },
  tapHint: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  empty: {
    fontStyle: 'italic',
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    paddingVertical: spacing.lg,
    textAlign: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
  },

  complaintCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
  },
  complaintHeader: {
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
  complaintTime: { fontSize: fontSizes.xs, color: colors.textMuted },
  complaintCategory: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  complaintDesc: {
    fontSize: fontSizes.sm,
    color: colors.text,
    marginTop: spacing.xs,
    lineHeight: 20,
  },

  ratingBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.sm,
  },
  starBtn: {
    padding: 4,
  },
  ratingHint: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
