/**
 * Cans / Gallons Salesman domain types.
 *
 * A trip is a single round of deliveries from the depot. Each customer can be
 * visited multiple times in a day; each visit creates a delivery entry under
 * that customer. Empty containers are reconciled separately because they are
 * often picked up on a different visit than the delivery.
 */

export type CGRoute = 'hospital' | 'bypass' | 'others';

export type CGCustomer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  route: CGRoute;

  /** Auto-fill quantity hints on the delivery sheet. */
  usualCans: number;
  usualGallons: number;

  /** Snapshot when the day starts — mutated by deliveries / collections. */
  emptyCansHeld: number;
  emptyGallonsHeld: number;
  outstandingDebt: number;

  pricePerCan: number;
  pricePerGallon: number;

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
  timestamp: number;
};

export type CollectionEntry = {
  id: string;
  customerId: string;
  cansCollected: number;
  gallonsCollected: number;
  timestamp: number;
};

/** Computed visual state for a customer card. */
export type CGCardStatus = 'white' | 'yellow' | 'red' | 'green';

export type VanLoad = {
  filledCans: number;
  filledGallons: number;
  emptyCansAboard: number;
  emptyGallonsAboard: number;
};
