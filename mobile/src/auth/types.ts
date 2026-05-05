/**
 * Auth domain types — role enum, branch enum, User shape.
 * These represent the FIVE distinct user roles in AkvoPura.
 */

export type Role =
  | 'owner'
  | 'manager'
  | 'pets_salesman'
  | 'cans_gallons_salesman'
  | 'customer';

export type Branch = 'timergara' | 'shergarh';

export type User = {
  id: string;
  name: string;
  identifier: string;     // phone or email used to log in
  role: Role;
  branch?: Branch;        // owner has no branch (sees both); customers have one
  /** For role === 'customer' — the Cans/Gallons customer record this user owns. */
  linkedCgCustomerId?: string;
};
