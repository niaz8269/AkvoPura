/**
 * ProductionProvider — production batches + raw material stock.
 *
 * recordBatch consumes raw materials per the recipe; if stock is insufficient
 * it short-circuits and returns null so the UI can warn the manager.
 *
 * receiveStock adds to a raw material's currentStock — used when a delivery
 * of bottles / caps / wraps arrives.
 *
 * Reorder thresholds are exposed for the Owner-side alerts.
 */

import React, {
  createContext,
  useCallback,
  useContext,
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

  rawById: (id: RawMaterialId) => RawMaterial | undefined;
  /** Returns the consumption shortfall by material — empty array if all good. */
  shortfallFor: (
    product: ProducedProduct,
    unitsProduced: number
  ) => Array<{ id: RawMaterialId; need: number; have: number }>;
  lowStock: () => RawMaterial[];

  recordBatch: (input: RecordBatchInput) => ProductionBatch | null;
  receiveStock: (id: RawMaterialId, units: number) => void;
  setReorderThreshold: (id: RawMaterialId, threshold: number) => void;
};

const Ctx = createContext<State | undefined>(undefined);

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

export function ProductionProvider({ children }: PropsWithChildren) {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(initialRawMaterials);
  const [batches, setBatches] = useState<ProductionBatch[]>(initialBatches);

  const rawById = useCallback(
    (id: RawMaterialId) => rawMaterials.find((r) => r.id === id),
    [rawMaterials]
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
    [rawMaterials]
  );

  const lowStock = useCallback(
    () => rawMaterials.filter((r) => r.currentStock <= r.reorderThreshold),
    [rawMaterials]
  );

  const recordBatch = useCallback<State['recordBatch']>(
    (input) => {
      const shortfall = shortfallFor(input.product, input.unitsProduced);
      if (shortfall.length > 0) return null;

      const recipe = RECIPE[input.product];
      // Deduct raw materials
      setRawMaterials((prev) =>
        prev.map((r) => {
          const needPerUnit = recipe[r.id] ?? 0;
          if (needPerUnit === 0) return r;
          return {
            ...r,
            currentStock: Math.max(0, r.currentStock - needPerUnit * input.unitsProduced),
          };
        })
      );

      const batch: ProductionBatch = {
        id: nextId('b'),
        branch: input.branch,
        product: input.product,
        unitsProduced: input.unitsProduced,
        batchNumber: input.batchNumber,
        tdsPpm: input.tdsPpm,
        phLevel: input.phLevel,
        wastage: input.wastage ?? 0,
        notes: input.notes,
        loggedBy: input.loggedBy,
        loggedAt: Date.now(),
      };
      setBatches((prev) => [batch, ...prev]);
      return batch;
    },
    [shortfallFor]
  );

  const receiveStock = useCallback<State['receiveStock']>((id, units) => {
    setRawMaterials((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, currentStock: Math.max(0, r.currentStock + units) } : r
      )
    );
  }, []);

  const setReorderThreshold = useCallback<State['setReorderThreshold']>(
    (id, threshold) => {
      setRawMaterials((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, reorderThreshold: Math.max(0, threshold) } : r
        )
      );
    },
    []
  );

  const value = useMemo<State>(
    () => ({
      rawMaterials,
      batches,
      rawById,
      shortfallFor,
      lowStock,
      recordBatch,
      receiveStock,
      setReorderThreshold,
    }),
    [
      rawMaterials,
      batches,
      rawById,
      shortfallFor,
      lowStock,
      recordBatch,
      receiveStock,
      setReorderThreshold,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProduction(): State {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProduction must be used inside <ProductionProvider>');
  return ctx;
}
