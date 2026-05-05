/**
 * Pets Salesman domain types.
 *
 * Pets are disposable, sold in PACKS (not individual bottles):
 *   - Pet600  pack = 12 × 600 ml bottles + 12 caps + 12 stickers + 1 wrap
 *   - Pet1500 pack = 6  × 1.5 L bottles  + 6 caps + 6 stickers + 1 wrap
 *
 * The salesman tracks packs only — raw materials are tracked at production.
 */

export type PetProductId = 'pet600' | 'pet1500';

export type PetProduct = {
  id: PetProductId;
  nameEn: string;
  nameUr: string;
  /** Bottles per pack — display only. */
  bottlesPerPack: number;
  defaultPrice: number;
};

export type PetCustomer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  /** "Hospital Road / Bazaar / Domestic" — Pets routes are flexible. */
  area: string;
  outstandingDebt: number;
  /** Per-customer override prices. Falls back to product.defaultPrice. */
  pricePet600?: number;
  pricePet1500?: number;
  notes?: string;
};

export type PetVanLoad = {
  pet600Packs: number;
  pet1500Packs: number;
};

export type BillEntry = {
  id: string;
  customerId: string;
  pet600Packs: number;
  pet1500Packs: number;
  /** Subtotal before discount = sum(qty * unit price). */
  subtotal: number;
  /** Flat Rs amount discounted off this bill (0 if none). */
  discount: number;
  /** Final amount the customer owes = subtotal - discount. */
  amountBilled: number;
  cashCollected: number;
  /** Which trip (1, 2, 3...) of the day this bill belongs to. */
  tripNumber: number;
  timestamp: number;
};

export type PetReturnEntry = {
  id: string;
  customerId: string;
  pet600Packs: number;
  pet1500Packs: number;
  /** Refund credited to customer's outstanding balance. */
  refundAmount: number;
  reason?: string;
  /** Which trip of the day this return belongs to. */
  tripNumber: number;
  timestamp: number;
};
