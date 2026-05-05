/**
 * Cans / Gallons Salesman domain types.
 *
 * A trip is a single round of deliveries from the depot. Each customer can be
 * visited multiple times in a day; each visit creates a delivery entry under
 * that customer. Empty containers are reconciled separately because they are
 * often picked up on a different visit than the delivery.
 */

export type CGRoute = 'hospital' | 'bypass' | 'others';

/** How often this customer settles their bill. Drives the top-level filter
 *  on the salesman screens (Daily salesman runs vs Weekly collection runs). */
export type PaymentCycle = 'daily' | 'weekly';

export type CGCustomer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  route: CGRoute;
  paymentCycle: PaymentCycle;

  /** Auto-fill quantity hints on the delivery sheet. */
  usualCans: number;
  usualGallons: number;

  /** Snapshot when the day starts — mutated by deliveries / collections. */
  emptyCansHeld: number;
  emptyGallonsHeld: number;
  outstandingDebt: number;

  pricePerCan: number;
  pricePerGallon: number;

  /** Last time this customer received a delivery (timestamp). null = never. */
  lastActivityAt?: number;

  notes?: string;
};

export type DeliveryEntry = {
  id: string;
  customerId: string;
  cansDelivered: number;
  gallonsDelivered: number;
  /** Empties picked up during this same delivery visit (optional). */
  emptyCansCollected: number;
  emptyGallonsCollected: number;
  cashCollected: number;
  /** Total amount of this delivery (cans*price + gallons*price), for receipt. */
  amountBilled: number;
  /** Which trip (1, 2, 3...) of the day this delivery belongs to. */
  tripNumber: number;
  timestamp: number;
};

export type CollectionEntry = {
  id: string;
  customerId: string;
  cansCollected: number;
  gallonsCollected: number;
  /** Which trip of the day this collection belongs to. */
  tripNumber: number;
  timestamp: number;
};

/** Computed visual state for a customer card.
 *  white  = clean
 *  yellow = empties held only (no debt)
 *  orange = debt only (no empties held)
 *  red    = both empties + debt
 *  green  = delivered today (overrides everything)
 */
export type CGCardStatus = 'white' | 'yellow' | 'orange' | 'red' | 'green';

export type VanLoad = {
  filledCans: number;
  filledGallons: number;
  emptyCansAboard: number;
  emptyGallonsAboard: number;
};
