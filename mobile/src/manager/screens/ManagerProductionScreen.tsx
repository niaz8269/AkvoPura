/**
 * ManagerProductionScreen — daily production logging + raw materials view.
 *
 * Two tabs: "Today" (log batch + see today's batches) and "Inventory" (raw
 * material stock with low-stock alerts and quick "Receive stock" entry).
 */

import React, { useMemo, useState } from 'react';
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
import { QuantityStepper } from '../../components/QuantityStepper';
import { colors, fontSizes, radii, spacing } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { useProduction } from '../../production/state';
import {
  PRODUCT_LABEL,
  type ProducedProduct,
  type ProductionBatch,
  type RawMaterial,
} from '../../production/types';
import {
  forecastMaterial,
  type MaterialForecast,
} from '../../analytics/inventoryForecast';

type Tab = 'today' | 'inventory';

const PRODUCTS: ProducedProduct[] = ['pet600', 'pet1500', 'gallon', 'can'];

export function ManagerProductionScreen() {
  const [tab, setTab] = useState<Tab>('today');

  return (
    <Screen padded={false}>
      <View style={styles.tabRow}>
        <Pressable
          onPress={() => setTab('today')}
          style={({ pressed }) => [
            styles.tab,
            tab === 'today' ? styles.tabActive : null,
            pressed && tab !== 'today' ? styles.tabPressed : null,
          ]}
        >
          <Text style={[styles.tabText, tab === 'today' ? styles.tabTextActive : null]}>
            Today
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('inventory')}
          style={({ pressed }) => [
            styles.tab,
            tab === 'inventory' ? styles.tabActive : null,
            pressed && tab !== 'inventory' ? styles.tabPressed : null,
          ]}
        >
          <Text style={[styles.tabText, tab === 'inventory' ? styles.tabTextActive : null]}>
            Raw materials
          </Text>
        </Pressable>
      </View>

      {tab === 'today' ? <TodayPanel /> : <InventoryPanel />}
    </Screen>
  );
}

function TodayPanel() {
  const { user } = useAuth();
  const { batches, recordBatch, shortfallFor, rawById } = useProduction();

  const [product, setProduct] = useState<ProducedProduct>('pet600');
  const [units, setUnits] = useState(10);
  const [batchNumber, setBatchNumber] = useState('');
  const [tds, setTds] = useState('');
  const [ph, setPh] = useState('');
  const [wastage, setWastage] = useState(0);
  const [notes, setNotes] = useState('');

  const todaysBatches = useMemo(() => {
    const today = new Date();
    const sameDay = (ts: number) => {
      const d = new Date(ts);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    };
    return batches.filter((b) => sameDay(b.loggedAt));
  }, [batches]);

  const shortfall = shortfallFor(product, units);
  const tdsNum = Number(tds) || undefined;
  const phNum = Number(ph) || undefined;
  const valid =
    units > 0 &&
    batchNumber.trim().length > 0 &&
    shortfall.length === 0 &&
    (!user || true);

  const submit = async () => {
    if (!user) return;
    const entry = await recordBatch({
      branch: (user.branch as 'timergara' | 'shergarh') ?? 'timergara',
      product,
      unitsProduced: units,
      batchNumber: batchNumber.trim(),
      tdsPpm: tdsNum,
      phLevel: phNum,
      wastage,
      notes: notes.trim() || undefined,
      loggedBy: user.name,
    });
    if (!entry) {
      Alert.alert('Could not save batch', 'Check raw materials availability and Wi-Fi.');
      return;
    }
    setUnits(10);
    setBatchNumber('');
    setTds('');
    setPh('');
    setWastage(0);
    setNotes('');
    Alert.alert('Batch logged', `${units} × ${PRODUCT_LABEL[product].en} recorded.`);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Log new batch</Text>
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Product</Text>
          <View style={styles.productGrid}>
            {PRODUCTS.map((p) => {
              const active = p === product;
              return (
                <Pressable
                  key={p}
                  onPress={() => setProduct(p)}
                  style={({ pressed }) => [
                    styles.productChip,
                    active ? styles.productChipActive : null,
                    pressed && !active ? { opacity: 0.7 } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.productChipText,
                      active ? styles.productChipTextActive : null,
                    ]}
                  >
                    {PRODUCT_LABEL[p].en}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: spacing.md }}>
            <QuantityStepper
              label={
                product === 'pet600' || product === 'pet1500' ? 'Packs produced' : 'Units produced'
              }
              value={units}
              onChange={setUnits}
              min={1}
              max={500}
            />
          </View>

          {shortfall.length > 0 ? (
            <View style={styles.warningBox}>
              <Ionicons name="warning-outline" size={16} color={colors.danger} />
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>Not enough raw material</Text>
                {shortfall.map((s) => (
                  <Text key={s.id} style={styles.warningLine}>
                    • {rawById(s.id)?.name ?? s.id}: need {s.need}, have {s.have}
                  </Text>
                ))}
              </View>
            </View>
          ) : null}

          <Text style={styles.fieldLabel}>Batch number</Text>
          <TextInput
            value={batchNumber}
            onChangeText={setBatchNumber}
            placeholder="e.g. AKV-600-2026-0345"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCapitalize="characters"
          />

          <View style={styles.qcRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>TDS (ppm)</Text>
              <TextInput
                value={tds}
                onChangeText={(t) => setTds(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="60-150"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>pH</Text>
              <TextInput
                value={ph}
                onChangeText={(t) => setPh(t.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="6.5-8.5"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </View>
          </View>

          <View style={{ marginTop: spacing.sm }}>
            <QuantityStepper label="Wastage" value={wastage} onChange={setWastage} />
          </View>

          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. New filter installed mid-batch"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { minHeight: 50, textAlignVertical: 'top' }]}
            multiline
          />

          <BilingualButton
            label={{ en: 'Log batch', ur: 'بیچ محفوظ کریں' }}
            onPress={submit}
            disabled={!valid}
            style={{ marginTop: spacing.md }}
          />
        </View>

        <Text style={styles.sectionTitle}>
          Today's batches ({todaysBatches.length})
        </Text>
        {todaysBatches.length === 0 ? (
          <Text style={styles.empty}>No batches logged today.</Text>
        ) : (
          todaysBatches.map((b) => <BatchRow key={b.id} batch={b} />)
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function BatchRow({ batch }: { batch: ProductionBatch }) {
  const label = PRODUCT_LABEL[batch.product];
  const tdsOk = batch.tdsPpm == null || (batch.tdsPpm >= 50 && batch.tdsPpm <= 200);
  const phOk = batch.phLevel == null || (batch.phLevel >= 6.5 && batch.phLevel <= 8.5);
  return (
    <View style={styles.batchCard}>
      <View style={styles.batchHeader}>
        <View style={styles.batchProduct}>
          <Text style={styles.batchProductText}>{label.en}</Text>
        </View>
        <Text style={styles.batchTime}>{formatTime(batch.loggedAt)}</Text>
      </View>
      <Text style={styles.batchUnits}>
        {batch.unitsProduced}{' '}
        {batch.product === 'pet600' || batch.product === 'pet1500' ? 'packs' : 'units'}
        {batch.wastage > 0 ? `  ·  ${batch.wastage} wastage` : ''}
      </Text>
      <Text style={styles.batchMeta}>Batch # {batch.batchNumber}</Text>
      {batch.tdsPpm != null || batch.phLevel != null ? (
        <View style={styles.qcChipRow}>
          {batch.tdsPpm != null ? (
            <View style={[styles.qcChip, tdsOk ? styles.qcChipOk : styles.qcChipBad]}>
              <Text
                style={[
                  styles.qcChipText,
                  { color: tdsOk ? colors.success : colors.danger },
                ]}
              >
                TDS {batch.tdsPpm} ppm
              </Text>
            </View>
          ) : null}
          {batch.phLevel != null ? (
            <View style={[styles.qcChip, phOk ? styles.qcChipOk : styles.qcChipBad]}>
              <Text
                style={[
                  styles.qcChipText,
                  { color: phOk ? colors.success : colors.danger },
                ]}
              >
                pH {batch.phLevel}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <Text style={styles.batchBy}>by {batch.loggedBy}</Text>
      {batch.notes ? <Text style={styles.batchNotes}>📝 {batch.notes}</Text> : null}
    </View>
  );
}

function InventoryPanel() {
  const { rawMaterials, receiveStock, batches, setReorderThreshold } = useProduction();

  const lowStock = rawMaterials.filter((r) => r.currentStock <= r.reorderThreshold);
  const okStock = rawMaterials.filter((r) => r.currentStock > r.reorderThreshold);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
      {lowStock.length > 0 ? (
        <>
          <Text style={[styles.sectionTitle, { color: colors.danger }]}>
            ⚠ Low stock ({lowStock.length})
          </Text>
          {lowStock.map((m) => (
            <RawRow
              key={m.id}
              material={m}
              forecast={forecastMaterial(m, batches)}
              onReceive={(units) => receiveStock(m.id, units)}
              onSetThreshold={(t) => setReorderThreshold(m.id, t)}
            />
          ))}
        </>
      ) : null}

      <Text style={styles.sectionTitle}>All raw materials</Text>
      {okStock.map((m) => (
        <RawRow
          key={m.id}
          material={m}
          forecast={forecastMaterial(m, batches)}
          onReceive={(units) => receiveStock(m.id, units)}
          onSetThreshold={(t) => setReorderThreshold(m.id, t)}
        />
      ))}
    </ScrollView>
  );
}

function RawRow({
  material,
  forecast,
  onReceive,
  onSetThreshold,
}: {
  material: RawMaterial;
  forecast: MaterialForecast;
  onReceive: (units: number) => void;
  onSetThreshold: (threshold: number) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [addStr, setAddStr] = useState('');
  const [editingThreshold, setEditingThreshold] = useState(false);
  const [thresholdStr, setThresholdStr] = useState('');
  const low = material.currentStock <= material.reorderThreshold;

  return (
    <View style={[styles.rawCard, low ? styles.rawCardLow : null]}>
      <View style={styles.rawHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rawName}>{material.name}</Text>
          <Text style={styles.rawMeta}>
            {material.currentStock.toLocaleString()} {material.unit}
          </Text>
        </View>
        {low ? (
          <View style={styles.lowChip}>
            <Text style={styles.lowChipText}>Low</Text>
          </View>
        ) : null}
      </View>

      <ForecastBadge forecast={forecast} />

      {editingThreshold ? (
        <View style={styles.thresholdEditBlock}>
          <Text style={styles.thresholdEditLabel}>Low-stock alert at</Text>
          <View style={styles.thresholdEditRow}>
            <Text style={styles.thresholdPrefix}>≤</Text>
            <TextInput
              value={thresholdStr}
              onChangeText={(t) => setThresholdStr(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder={String(material.reorderThreshold)}
              placeholderTextColor={colors.textMuted}
              style={styles.thresholdInput}
              autoFocus
              maxLength={7}
            />
            <Text style={styles.thresholdUnit}>{material.unit}</Text>
          </View>
          <View style={styles.thresholdBtnRow}>
            <Pressable
              onPress={() => {
                setEditingThreshold(false);
                setThresholdStr('');
              }}
              style={({ pressed }) => [
                styles.thresholdBtn,
                pressed ? { opacity: 0.85 } : null,
              ]}
            >
              <Text style={styles.thresholdBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                const n = Number(thresholdStr);
                if (!Number.isNaN(n) && n >= 0 && n !== material.reorderThreshold) {
                  onSetThreshold(n);
                }
                setEditingThreshold(false);
                setThresholdStr('');
              }}
              style={({ pressed }) => [
                styles.thresholdBtn,
                styles.thresholdBtnSave,
                pressed ? { opacity: 0.85 } : null,
              ]}
            >
              <Text style={styles.thresholdBtnTextSave}>Save</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.thresholdRow}>
          <Text style={styles.thresholdLabel}>Low-stock alert at:</Text>
          <Pressable
            onPress={() => {
              setThresholdStr(String(material.reorderThreshold));
              setEditingThreshold(true);
            }}
            style={({ pressed }) => [
              styles.thresholdValueBtn,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Text style={styles.thresholdValueText}>
              ≤ {material.reorderThreshold}
            </Text>
            <Ionicons name="create-outline" size={14} color={colors.primary} />
          </Pressable>
        </View>
      )}

      {adding ? (
        <View style={styles.receiveRow}>
          <Text style={styles.receivePrefix}>+</Text>
          <TextInput
            value={addStr}
            onChangeText={(t) => setAddStr(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            style={styles.receiveInput}
            autoFocus
          />
          <Pressable
            onPress={() => {
              const n = Number(addStr) || 0;
              if (n > 0) onReceive(n);
              setAdding(false);
              setAddStr('');
            }}
            style={({ pressed }) => [
              styles.receiveBtn,
              styles.receiveBtnSave,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Text style={styles.receiveBtnText}>Save</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setAdding(false);
              setAddStr('');
            }}
            style={({ pressed }) => [
              styles.receiveBtn,
              styles.receiveBtnCancel,
              pressed ? { opacity: 0.85 } : null,
            ]}
          >
            <Text style={styles.receiveBtnTextCancel}>Cancel</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setAdding(true)}
          style={({ pressed }) => [
            styles.receiveOpenBtn,
            pressed ? { opacity: 0.85 } : null,
          ]}
        >
          <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.receiveOpenText}>Receive stock</Text>
        </Pressable>
      )}
    </View>
  );
}

function ForecastBadge({ forecast }: { forecast: MaterialForecast }) {
  if (forecast.severity === 'idle') {
    return (
      <View style={[styles.forecastBadge, styles.forecastBadgeIdle]}>
        <Ionicons name="pause-circle-outline" size={12} color={colors.textMuted} />
        <Text style={[styles.forecastText, { color: colors.textMuted }]}>
          No recent usage
        </Text>
      </View>
    );
  }

  const color =
    forecast.severity === 'critical'
      ? colors.danger
      : forecast.severity === 'warn'
        ? colors.warning
        : colors.success;
  const bg =
    forecast.severity === 'critical'
      ? colors.danger + '18'
      : forecast.severity === 'warn'
        ? colors.warning + '22'
        : colors.success + '18';

  const days = forecast.daysRemaining ?? 0;
  const label =
    days <= 0
      ? 'Out of stock'
      : days === 1
        ? '~1 day left'
        : `~${days} days left`;

  return (
    <View style={[styles.forecastBadge, { backgroundColor: bg }]}>
      <Ionicons
        name={
          forecast.severity === 'critical'
            ? 'alert-circle'
            : forecast.severity === 'warn'
              ? 'time-outline'
              : 'checkmark-circle-outline'
        }
        size={12}
        color={color}
      />
      <Text style={[styles.forecastText, { color }]}>
        {label} · uses ~{forecast.perDay}/day
      </Text>
    </View>
  );
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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

  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },

  sectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: spacing.md,
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
  },

  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: spacing.sm,
  },

  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  productChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
  },
  productChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  productChipText: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  productChipTextActive: { color: colors.textInverse },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: spacing.sm,
    backgroundColor: colors.danger + '15',
    borderRadius: radii.md,
    marginTop: spacing.md,
  },
  warningTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.danger,
  },
  warningLine: { fontSize: fontSizes.xs, color: colors.danger, marginTop: 2 },

  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: fontSizes.body,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },

  qcRow: { flexDirection: 'row', marginTop: spacing.sm },

  batchCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  batchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  batchProduct: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.primary + '22',
  },
  batchProductText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  batchTime: { fontSize: fontSizes.xs, color: colors.textMuted },
  batchUnits: { fontSize: fontSizes.body, fontWeight: '800', color: colors.primaryDark },
  batchMeta: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  batchBy: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 6 },
  batchNotes: { fontSize: fontSizes.xs, color: colors.text, fontStyle: 'italic', marginTop: 4 },
  qcChipRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  qcChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.pill },
  qcChipOk: { backgroundColor: colors.success + '20' },
  qcChipBad: { backgroundColor: colors.danger + '20' },
  qcChipText: { fontSize: 11, fontWeight: '800' },

  rawCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  rawCardLow: { borderLeftColor: colors.danger },
  rawHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rawName: { fontSize: fontSizes.body, fontWeight: '800', color: colors.primaryDark },
  rawMeta: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  lowChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.danger + '22',
  },
  lowChipText: { fontSize: 10, fontWeight: '900', color: colors.danger },

  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  thresholdLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  thresholdValueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '12',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  thresholdValueText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },

  // Edit mode — full-width block so the input is unmissable.
  thresholdEditBlock: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary + '08',
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  thresholdEditLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  thresholdEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  thresholdPrefix: {
    fontSize: fontSizes.heading,
    fontWeight: '900',
    color: colors.primary,
  },
  thresholdInput: {
    flex: 1,
    height: 44,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.title,
    fontWeight: '900',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  thresholdUnit: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textMuted,
    minWidth: 50,
  },
  thresholdBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    justifyContent: 'flex-end',
  },
  thresholdBtn: {
    paddingHorizontal: spacing.lg,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  thresholdBtnSave: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  thresholdBtnText: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.textMuted },
  thresholdBtnTextSave: { fontSize: fontSizes.sm, fontWeight: '800', color: colors.textInverse },

  receiveOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: spacing.sm,
  },
  receiveOpenText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  receiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  receivePrefix: { fontSize: fontSizes.body, fontWeight: '900', color: colors.primary },
  receiveInput: {
    flex: 1,
    height: 36,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    fontSize: fontSizes.body,
    fontWeight: '800',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  receiveBtn: {
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  receiveBtnSave: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  receiveBtnCancel: { backgroundColor: colors.surface, borderColor: colors.border },
  receiveBtnText: { color: colors.textInverse, fontSize: 12, fontWeight: '800' },
  receiveBtnTextCancel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },

  forecastBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    marginTop: spacing.sm,
  },
  forecastBadgeIdle: { backgroundColor: colors.surfaceMuted },
  forecastText: { fontSize: 11, fontWeight: '800' },
});
