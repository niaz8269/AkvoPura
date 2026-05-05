/**
 * Card status logic for Cans/Gallons customer cards.
 *
 *   white  — no empties held, no debt, not delivered today
 *   yellow — empties held, no debt (please pick up the empties)
 *   orange — debt held, no empties (please ask for payment)
 *   red    — empties held AND debt (worst — collect both)
 *   green  — delivered today (overrides everything)
 */

import type { CGCardStatus, CGCustomer, DeliveryEntry } from './types';

export function statusForCustomer(
  customer: CGCustomer,
  todaysDeliveries: DeliveryEntry[]
): CGCardStatus {
  const deliveredToday = todaysDeliveries.some((d) => d.customerId === customer.id);
  if (deliveredToday) return 'green';

  const hasEmpties = customer.emptyCansHeld > 0 || customer.emptyGallonsHeld > 0;
  const hasDebt = customer.outstandingDebt > 0;

  if (hasEmpties && hasDebt) return 'red';
  if (hasEmpties) return 'yellow';
  if (hasDebt) return 'orange';
  return 'white';
}
