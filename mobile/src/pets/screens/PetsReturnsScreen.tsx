/**
 * PetsReturnsScreen — record packs returned by a customer.
 *
 * Customer selects which pack quantities to return + optional reason →
 * refund is auto-credited against their outstanding balance, packs go back
 * onto the van.
 */

import React, { useEffect, useMemo, useState } from 'react';
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

import { Screen } from '../../components';
import { QuantityStepper } from '../../components/QuantityStepper';
import { SwipeToConfirm } from '../../components/SwipeToConfirm';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { CustomerPicker } from '../components/CustomerPicker';
import { usePetsSalesman } from '../state';
import type { PetCustomer } from '../types';

export function PetsReturnsScreen() {
  const { customers, returns, recordReturn, undoLastReturn, priceFor } = usePetsSalesman();

  const [selected, setSelected] = useState<PetCustomer | null>(null);
  const [pet600, setPet600] = useState(0);
  const [pet1500, setPet1500] = useState(0);
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const refund = useMemo(() => {
    if (!selected) return 0;
    return (
      pet600 * priceFor(selected, 'pet600') +
      pet1500 * priceFor(selected, 'pet1500')
    );
  }, [selected, pet600, pet1500, priceFor]);

  const canSwipe = !!selected && pet600 + pet1500 > 0 && !confirmed;

  useEffect(() => {
    if (!confirmed) return;
    const t = setTimeout(() => {
      setConfirmed(false);
      setSelected(null);
      setPet600(0);
      setPet1500(0);
      setReason('');
      setResetKey((k) => k + 1);
    }, 1800);
    return () => clearTimeout(t);
  }, [confirmed]);

  const onConfirm = () => {
    if (!selected) return;
    const entry = recordReturn({
      customerId: selected.id,
      pet600Packs: pet600,
      pet1500Packs: pet1500,
      reason: reason.trim() || undefined,
    });
    if (entry) setConfirmed(true);
  };

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Returns</Text>
              <Text style={styles.titleUr}>واپسی</Text>
            </View>
            <Text style={styles.headerHint}>Refund credits the balance</Text>
          </View>

          {returns.length > 0 ? (
            <Pressable
              onPress={() => {
                const last = undoLastReturn();
                if (last) Alert.alert('Undone', 'Last return was undone.');
              }}
              style={({ pressed }) => [
                styles.undoBtn,
                pressed ? styles.undoBtnPressed : null,
              ]}
            >
              <Text style={styles.undoText}>↶ Undo last return</Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <CustomerPicker
            customers={customers}
            selected={selected}
            onSelect={(c) => {
              setSelected(c);
              setPet600(0);
              setPet1500(0);
              setReason('');
            }}
          />

          {selected ? (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Returned packs</Text>

              <QuantityStepper
                label="600 ml packs returned"
                labelUr="واپس ۶۰۰ ملی پیک"
                value={pet600}
                onChange={setPet600}
              />
              <View style={styles.divider} />
              <QuantityStepper
                label="1.5 L packs returned"
                labelUr="واپس ۱.۵ لیٹر پیک"
                value={pet1500}
                onChange={setPet1500}
              />

              <View style={styles.refundCard}>
                <Text style={styles.refundLabel}>Refund credit</Text>
                <Text style={styles.refundLabelUr}>کریڈٹ</Text>
                <Text style={styles.refundValue}>Rs {refund.toLocaleString()}</Text>
              </View>

              <Text style={styles.reasonLabel}>Reason (optional)</Text>
              <Text style={styles.reasonLabelUr}>وجہ (اختیاری)</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="e.g. damaged seal, leaked, didn't sell"
                placeholderTextColor={colors.textMuted}
                style={styles.reasonInput}
                multiline
                numberOfLines={2}
              />

              <SwipeToConfirm
                key={resetKey}
                labelEn="Swipe to record return  ›››"
                labelUr="واپسی محفوظ کرنے کے لیے سوائپ کریں"
                doneLabelEn="Return saved ✓"
                doneLabelUr="واپسی محفوظ ہو گئی"
                done={confirmed}
                disabled={!canSwipe}
                onConfirm={onConfirm}
                style={styles.swipe}
              />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: { fontSize: fontSizes.title, fontWeight: '800', color: colors.primaryDark },
  titleUr: { fontSize: fontSizes.body, color: colors.primary },
  headerHint: { fontSize: fontSizes.xs, color: colors.textMuted, fontStyle: 'italic' },
  undoBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  undoBtnPressed: { backgroundColor: colors.warning + '33' },
  undoText: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.warning },
  scroll: { flex: 1 },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  formTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  refundCard: {
    backgroundColor: colors.warning + '15',
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.warning,
  },
  refundLabel: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.warning },
  refundLabelUr: { fontSize: fontSizes.xs, color: colors.warning },
  refundValue: {
    fontSize: fontSizes.heading,
    fontWeight: '900',
    color: colors.warning,
    marginTop: 4,
  },
  reasonLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
  },
  reasonLabelUr: { fontSize: fontSizes.xs, color: colors.textMuted, marginBottom: spacing.sm },
  reasonInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSizes.sm,
    color: colors.text,
    backgroundColor: colors.surface,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  swipe: { marginTop: spacing.lg },
});
