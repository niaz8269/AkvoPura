/**
 * ProductionProvider — production batches + raw material stock, backed
 * by /production/batches and /raw-materials.
 *
 * Boots from baked-in demo data so the UI works offline; refetches from
 * the server on user change. recordBatch / receiveStock / setReorderThreshold
 * are optimistic with refresh-on-failure rollback.
 *
 * The local recipe / shortfallFor / lowStock helpers stay client-side
 * so the UI can preview shortfalls before submitting.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { initialBatches, initialRawMaterials } from './demoData';
import {
  RECIPE,
  type ProducedProduct,
  type ProductionBatch,
  type RawMaterial,
  type RawMaterialId,
} from './types';
import { useAuth } from '../auth/AuthContext';
import {
  createRawMaterial,
  listRawMaterials,
  receiveRawMaterial,
  updateRawMaterial,
} from '../api/rawMaterials';
import {
  listProductionBatches,
  recordProductionBatch,
} from '../api/production';
import { ApiError } from '../api/client';

type RecordBatchInput = {
  branch: 'timergara' | 'shergarh';
  product: ProducedProduct;
  unitsProduced: number;
  batchNumber: string;
  tdsPpm?: number;
  phLevel?: number;
  wastage?: number;
  notes?: string;
  loggedBy: string;
};

type State = {
  rawMaterials: RawMaterial[];
  batches: ProductionBatch[];
  loading: boolean;

  rawById: (id: RawMaterialId) => RawMaterial | undefined;
  shortfallFor: (
    product: ProducedProduct,
    unitsProduced: number,
  ) => Array<{ id: RawMaterialId; need: number; have: number }>;
  lowStock: () => RawMaterial[];

  recordBatch: (input: RecordBatchInput) => Promise<ProductionBatch | null>;
  receiveStock: (id: RawMaterialId, units: number) => void;
  setReorderThreshold: (id: RawMaterialId, threshold: number) => void;
  /** Manager / owner creates a brand-new raw material row. */
  addRawMaterial: (input: {
    name: string;
    unit: 'pieces' | 'rolls';
    currentStock?: number;
    reorderThreshold?: number;
    nameUr?: string;
  }) => Promise<RawMaterial>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<State | undefined>(undefined);

export function ProductionProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(initialRawMaterials);
  const [batches, setBatches] = useState<ProductionBatch[]>(initialBatches);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [freshMaterials, freshBatches] = await Promise.all([
        listRawMaterials(),
        listProductionBatches(),
      ]);
      setRawMaterials(freshMaterials);
      // Server returns most-recent-first; keep that order (existing UI sorts itself).
      setBatches(freshBatches);
    } catch {
      // offline — keep current in-memory state
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  const rawById = useCallback(
    (id: RawMaterialId) => rawMaterials.find((r) => r.id === id),
    [rawMaterials],
  );

  const shortfallFor = useCallback<State['shortfallFor']>(
    (product, units) => {
      const recipe = RECIPE[product];
      const result: Array<{ id: RawMaterialId; need: number; have: number }> = [];
      (Object.keys(recipe) as RawMaterialId[]).forEach((mid) => {
        const need = (recipe[mid] ?? 0) * units;
        const have = rawMaterials.find((r) => r.id === mid)?.currentStock ?? 0;
        if (need > have) result.push({ id: mid, need, have });
      });
      return result;
    },
    [rawMaterials],
  );

  const lowStock = useCallback(
    () => rawMaterials.filter((r) => r.currentStock <= r.reorderThreshold),
    [rawMaterials],
  );

  const recordBatch = useCallback<State['recordBatch']>(
    async (input) => {
      try {
        const batch = await recordProductionBatch({
          product: input.product,
          unitsProduced: input.unitsProduced,
          batchNumber: input.batchNumber,
          tdsPpm: input.tdsPpm,
          phLevel: input.phLevel,
          wastage: input.wastage,
          notes: input.notes,
          // Owner needs explicit branch; manager / production_worker default to own
          // branch, which the server fills in when omitted.
          branchSlug: input.branch,
        });
        // Refresh raw materials so the UI sees the deductions.
        const freshMaterials = await listRawMaterials();
        setRawMaterials(freshMaterials);
        setBatches((prev) => [batch, ...prev]);
        return batch;
      } catch (e) {
        if (e instanceof ApiError) {
          // Surface the shortfall info to the caller via null + console.
          // The UI shows its own shortfall banner before the user submits.
          // eslint-disable-next-line no-console
          console.warn('recordBatch failed:', e.code, e.message);
        }
        return null;
      }
    },
    [],
  );

  const receiveStock = useCallback<State['receiveStock']>((id, units) => {
    // Optimistic local bump.
    setRawMaterials((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, currentStock: Math.max(0, r.currentStock + units) } : r,
      ),
    );
    receiveRawMaterial(id, units)
      .then((real) => {
        setRawMaterials((prev) => prev.map((r) => (r.id === id ? real : r)));
      })
      .catch(() => {
        refresh();
      });
  }, [refresh]);

  const setReorderThreshold = useCallback<State['setReorderThreshold']>(
    (id, threshold) => {
      setRawMaterials((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, reorderThreshold: Math.max(0, threshold) } : r,
        ),
      );
      updateRawMaterial(id, { reorderThreshold: Math.max(0, threshold) })
        .then((real) => {
          setRawMaterials((prev) => prev.map((r) => (r.id === id ? real : r)));
        })
        .catch(() => {
          refresh();
        });
    },
    [refresh],
  );

  const addRawMaterial = useCallback<State['addRawMaterial']>(async (input) => {
    const created = await createRawMaterial(input);
    setRawMaterials((prev) => [...prev, created]);
    return created;
  }, []);

  const value = useMemo<State>(
    () => ({
      rawMaterials,
      batches,
      loading,
      rawById,
      shortfallFor,
      lowStock,
      recordBatch,
      receiveStock,
      setReorderThreshold,
      addRawMaterial,
      refresh,
    }),
    [
      rawMaterials,
      batches,
      loading,
      rawById,
      shortfallFor,
      lowStock,
      recordBatch,
      receiveStock,
      setReorderThreshold,
      addRawMaterial,
      refresh,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProduction(): State {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProduction must be used inside <ProductionProvider>');
  return ctx;
}
