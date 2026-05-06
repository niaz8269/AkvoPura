/**
 * Predictive inventory — projects how many days of raw-material stock
 * remain at the recent consumption pace.
 *
 * Looks at the last N days of production batches, converts to per-day
 * raw-material consumption via the recipe, and divides current stock
 * by that rate. Manager sees an alert before running out.
 *
 * Spec checklist item #30: "Predictive inventory — basic forecast."
 */

import {
  RECIPE,
  type ProducedProduct,
  type ProductionBatch,
  type RawMaterial,
  type RawMaterialId,
} from '../production/types';

const DAY_MS = 24 * 60 * 60_000;

/** Default lookback window for the consumption average. */
export const FORECAST_WINDOW_DAYS = 7;

export type ForecastSeverity = 'critical' | 'warn' | 'ok' | 'idle';

export type MaterialForecast = {
  id: RawMaterialId;
  name: string;
  currentStock: number;
  reorderThreshold: number;
  /** Avg units consumed per day over the lookback window. */
  perDay: number;
  /** Days of stock remaining at the current pace. null = no consumption recorded. */
  daysRemaining: number | null;
  severity: ForecastSeverity;
};

function severityFor(daysRemaining: number | null): ForecastSeverity {
  if (daysRemaining === null) return 'idle';
  if (daysRemaining <= 3) return 'critical';
  if (daysRemaining <= 7) return 'warn';
  return 'ok';
}

export function forecastMaterial(
  material: RawMaterial,
  batches: ProductionBatch[],
  windowDays: number = FORECAST_WINDOW_DAYS
): MaterialForecast {
  const since = Date.now() - windowDays * DAY_MS;
  const recent = batches.filter((b) => b.loggedAt >= since);

  let consumed = 0;
  recent.forEach((b) => {
    const recipe = RECIPE[b.product];
    const need = recipe[material.id] ?? 0;
    consumed += need * b.unitsProduced;
  });

  const perDay = consumed / windowDays;
  const daysRemaining =
    perDay <= 0 ? null : Math.floor(material.currentStock / perDay);

  return {
    id: material.id,
    name: material.name,
    currentStock: material.currentStock,
    reorderThreshold: material.reorderThreshold,
    perDay: Math.round(perDay * 10) / 10,
    daysRemaining,
    severity: severityFor(daysRemaining),
  };
}

export function forecastAll(
  materials: RawMaterial[],
  batches: ProductionBatch[],
  windowDays: number = FORECAST_WINDOW_DAYS
): MaterialForecast[] {
  return materials.map((m) => forecastMaterial(m, batches, windowDays));
}

/** Materials projected to run out within `daysAhead` days. */
export function runningOutSoon(
  materials: RawMaterial[],
  batches: ProductionBatch[],
  daysAhead: number = 7,
  windowDays: number = FORECAST_WINDOW_DAYS
): MaterialForecast[] {
  return forecastAll(materials, batches, windowDays).filter(
    (f) => f.daysRemaining !== null && f.daysRemaining <= daysAhead
  );
}

/**
 * Reverse projection: how many of `product` could be made *today* with the
 * current raw materials (limited by the most-constrained ingredient).
 * Useful for "you can only build N more 1.5L packs."
 */
export function maxProducible(
  product: ProducedProduct,
  materials: RawMaterial[]
): number {
  const recipe = RECIPE[product];
  const ingredients = Object.keys(recipe) as RawMaterialId[];
  if (ingredients.length === 0) return Infinity;
  let min = Infinity;
  ingredients.forEach((mid) => {
    const need = recipe[mid] ?? 0;
    if (need <= 0) return;
    const have = materials.find((m) => m.id === mid)?.currentStock ?? 0;
    const possible = Math.floor(have / need);
    if (possible < min) min = possible;
  });
  return min === Infinity ? 0 : min;
}
