import type { ProducedProduct } from '@prisma/client';

/** Per-product raw material recipe — kept in app code (not the DB) so
 *  the recipe stays editable without a migration. */
export const RECIPE: Record<ProducedProduct, Record<string, number>> = {
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
