/**
 * ComplaintDetailScreen — shared by customer + manager + owner.
 *
 * Shows the original complaint, the full comment thread (chronological),
 * a compose box for posting a reply, and (when resolved + the viewer is
 * the customer) the 1-5 star rating UI.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { useFocusEffect } from '@react-navigation/native';

import { Screen } from '../components';
import { colors, fontSizes, radii, spacing } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { useCustomerPortal } from '../customer/state';
import { ApiError } from '../api/client';
import {
  listComplaintComments,
  postComplaintComment,
} from '../api/complaints';
import type {
  Complaint,
  ComplaintComment,
  ComplaintStatus,
} from '../customer/types';

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
export function ComplaintDetailScreen({ route }: any) {
  const id: string = route.params.complaintId;
  const { user } = useAuth();
  const portal = useCustomerPortal();

  const complaint = portal.complaints.find((c) => c.id === id);

  const [comments, setComments] = useState<ComplaintComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    try {
      setError(null);
      setComments(await listComplaintComments(id));
    } catch (e: unknown) {
      const msg =
        e instanceof ApiError
          ? e.code === 'network_error'
            ? 'Cannot reach the server.'
            : `Server error: ${e.message}`
          : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadComments(); }, [loadComments]);
  useFocusEffect(useCallback(() => { loadComments(); }, [loadComments]));

  const submitReply = async () => {
    const body = replyText.trim();
    if (!body || posting) return;
    setPosting(true);
    try {
      const real = await postComplaintComment(id, body);
      setComments((prev) => [...prev, real]);
      setReplyText('');
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message || e.code : 'Could not post';
      Alert.alert('Failed', msg);
    } finally {
      setPosting(false);
    }
  };

  if (!complaint) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorText}>Complaint not loaded.</Text>
        </View>
      </Screen>
    );
  }

  const meta = STATUS_META[complaint.status];
  const isMyComplaint = user?.id === complaint.customerUserId;
  const canRate =
    complaint.status === 'resolved' && isMyComplaint;

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {/* Original complaint */}
          <View style={[styles.card, { borderLeftColor: meta.color }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.statusChip, { backgroundColor: meta.color + '22' }]}>
                <Text style={[styles.statusChipText, { color: meta.color }]}>
                  {meta.label}
                </Text>
              </View>
              <View style={styles.toChip}>
                <Text style={styles.toChipText}>→ {complaint.recipient}</Text>
              </View>
              <View style={{ flex: 1 }} />
              <Text style={styles.timeText}>{formatDateTime(complaint.filedAt)}</Text>
            </View>
            <Text style={styles.customer}>{complaint.customerName ?? 'Customer'}</Text>
            <Text style={styles.category}>{CAT_LABELS[complaint.category]}</Text>
            <Text style={styles.description}>{complaint.description}</Text>
          </View>

          {/* Star rating (customer + resolved) */}
          {canRate ? (
            <View style={styles.ratingCard}>
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
                      onPress={() => portal.rateComplaint(id, n)}
                      style={({ pressed }) => [
                        styles.starBtn,
                        pressed ? { opacity: 0.6 } : null,
                      ]}
                    >
                      <Ionicons
                        name={filled ? 'star' : 'star-outline'}
                        size={32}
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

          {/* Comments thread */}
          <Text style={styles.threadTitle}>
            Conversation ({comments.length})
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          ) : null}

          {error ? (
            <View style={styles.errorCard}>
              <Ionicons name="warning" size={18} color={colors.danger} />
              <Text style={styles.errorMsg}>{error}</Text>
            </View>
          ) : null}

          {!loading && comments.length === 0 ? (
            <Text style={styles.empty}>
              No replies yet. Add one below.
            </Text>
          ) : null}

          {comments.map((c) => {
            const mine = c.authorId === user?.id;
            return (
              <View
                key={c.id}
                style={[
                  styles.bubble,
                  mine ? styles.bubbleMine : styles.bubbleTheirs,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleAuthor,
                    mine ? styles.bubbleAuthorMine : null,
                  ]}
                >
                  {c.authorName}{' '}
                  <Text style={styles.bubbleRole}>· {roleLabel(c.authorRole)}</Text>
                </Text>
                <Text
                  style={[
                    styles.bubbleBody,
                    mine ? styles.bubbleBodyMine : null,
                  ]}
                >
                  {c.body}
                </Text>
                <Text
                  style={[
                    styles.bubbleTime,
                    mine ? styles.bubbleTimeMine : null,
                  ]}
                >
                  {formatDateTime(c.postedAt)}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Compose */}
        <View style={styles.composeRow}>
          <TextInput
            value={replyText}
            onChangeText={setReplyText}
            placeholder={
              complaint.status === 'resolved'
                ? 'Add a follow-up comment…'
                : 'Reply…'
            }
            placeholderTextColor={colors.textMuted}
            style={styles.composeInput}
            multiline
            maxLength={1000}
          />
          <Pressable
            onPress={submitReply}
            disabled={replyText.trim().length === 0 || posting}
            style={({ pressed }) => [
              styles.sendBtn,
              replyText.trim().length === 0 || posting ? { opacity: 0.4 } : null,
              pressed ? { opacity: 0.85 } : null,
            ]}
            accessibilityLabel="Post comment"
          >
            <Ionicons
              name={posting ? 'hourglass-outline' : 'send'}
              size={20}
              color={colors.textInverse}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function roleLabel(role: string) {
  switch (role) {
    case 'owner': return 'Owner';
    case 'manager': return 'Manager';
    case 'pets_salesman': return 'Pets Salesman';
    case 'cans_gallons_salesman': return 'C/G Salesman';
    case 'customer': return 'Customer';
    default: return role;
  }
}

function formatDateTime(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const same =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const t = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return same ? `Today ${t}` : `${d.getDate()}/${d.getMonth() + 1} ${t}`;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.danger, fontSize: fontSizes.sm },

  body: { padding: spacing.lg, paddingBottom: spacing.xl },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
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

  ratingCard: {
    backgroundColor: colors.warning + '12',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.text,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.sm,
  },
  starBtn: { padding: 4 },
  ratingHint: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },

  threadTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger + '18',
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorMsg: { fontSize: fontSizes.xs, color: colors.danger, fontWeight: '700' },

  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
    marginVertical: spacing.lg,
  },

  bubble: {
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    maxWidth: '85%',
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  bubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleAuthor: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  bubbleAuthorMine: { color: colors.textInverse },
  bubbleRole: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  bubbleBody: {
    fontSize: fontSizes.body,
    color: colors.text,
    marginTop: 4,
    lineHeight: 20,
  },
  bubbleBodyMine: { color: colors.textInverse },
  bubbleTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.75)' },

  composeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  composeInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: fontSizes.body,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
