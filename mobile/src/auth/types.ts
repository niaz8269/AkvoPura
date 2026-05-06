/**
 * Auth domain types — role enum, branch enum, User shape.
 * These represent the FIVE distinct user roles in AkvoPura.
 */

export type Role =
  | 'owner'
  | 'manager'
  | 'pets_salesman'
  | 'cans_gallons_salesman'
  | 'production_worker'
  | 'driver'
  | 'helper'
  | 'other'
  | 'customer';

/**
 * Branch identifier (slug). Loaded dynamically from the backend's
 * /branches endpoint — was a literal union before backend B-5 to allow
 * adding branches without code changes.
 *
 * Code that historically compared `user.branch === 'timergara'` keeps
 * working because it's still a string equality check.
 */
export type Branch = string;

export type User = {
  id: string;
  name: string;
  identifier: string;     // phone or email used to log in
  role: Role;
  branch?: Branch;        // owner has no branch (sees both); customers have one
  /** For role === 'customer' — the Cans/Gallons customer record this user owns. */
  linkedCgCustomerId?: string;
};
