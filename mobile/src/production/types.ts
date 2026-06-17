/**
 * Production / inventory domain types.
 *
 * Daily production batches consume raw materials. Quality control values
 * (TDS, pH, batch number) are recorded per batch for traceability.
 *
 * Per spec:
 *   600ml pet pack = 12 bottles + 12 PET caps + 12 stickers + 1 wrap
 *   1.5L pet pack  = 6 bottles + 6 PET caps + 6 stickers + 1 wrap
 *   PET caps are interchangeable across 600ml + 1.5L bottles.
 *   Cans          = reusable, no raw material consumed on refill
 *   Gallons       = reusable, but cap is disposable (1 cap per refill)
 */

export type RawMaterialId =
  | 'bottle_600'
  | 'bottle_1500'
  | 'cap_pet'
  | 'cap_gallon'
  | 'sticker_600'
  | 'sticker_1500'
  | 'wrap_600'
  | 'wrap_1500';

export type RawMaterial = {
  id: RawMaterialId;
  name: string;
  nameUr: string;
  currentStock: number;
  reorderThreshold: number;
  /** Display unit. */
  unit: 'pieces' | 'rolls';
};

export type ProducedProduct = 'pet600' | 'pet1500' | 'can' | 'gallon';

export type ProductionBatch = {
  id: string;
  branch: 'timergara' | 'shergarh';
  product: ProducedProduct;
  /** Number of units produced this batch — packs for pet, units for can/gallon. */
  unitsProduced: number;
  batchNumber: string;
  /** Quality control checkpoint values. */
  tdsPpm?: number;       // Total Dissolved Solids in ppm (drinking water target ~60-150)
  phLevel?: number;      // pH (drinking water target ~6.5-8.5)
  /** How many units were lost / damaged in this batch. */
  wastage: number;
  notes?: string;
  loggedBy: string;
  loggedAt: number;
};

/** Per-product raw material recipe — used to deduct stock on production. */
export const RECIPE: Record<
  ProducedProduct,
  Partial<Record<RawMaterialId, number>>
> = {
  pet600: {
    bottle_600: 12,
    cap_pet: 12,
    sticker_600: 12,
    wrap_600: 1,
  },
  pet1500: {
    bottle_1500: 6,
    cap_pet: 6,
    sticker_1500: 6,
    wrap_1500: 1,
  },
  can: {}, // reusable, no consumption
  gallon: {
    cap_gallon: 1,
  },
};

export const PRODUCT_LABEL: Record<ProducedProduct, { en: string; ur: string }> = {
  pet600: { en: '600 ml pack', ur: '  ' },
  pet1500: { en: '1.5 L pack', ur: '.  ' },
  can: { en: 'Filled can', ur: ' ' },
  gallon: { en: 'Filled gallon', ur: ' ' },
};
