/**
 * Mock test accounts for Slice 1.
 *
 * These are hardcoded for local development so each role can be demonstrated
 * without a backend. Replaced by a real auth API in a later slice.
 *
 * Identifier can be a phone number or a short label (case-insensitive).
 * Passwords are intentionally simple for testing.
 */

import type { User } from './types';

type MockAccount = {
  user: User;
  password: string;
};

export const mockAccounts: MockAccount[] = [
  {
    user: {
      id: 'u-owner',
      name: 'Owner',
      identifier: 'owner',
      role: 'owner',
    },
    password: 'owner',
  },
  {
    user: {
      id: 'u-mgr-tim',
      name: 'Timergara Manager',
      identifier: 'manager_t',
      role: 'manager',
      branch: 'timergara',
    },
    password: 'manager',
  },
  {
    user: {
      id: 'u-mgr-sher',
      name: 'Shergarh Manager',
      identifier: 'manager_s',
      role: 'manager',
      branch: 'shergarh',
    },
    password: 'manager',
  },
  {
    user: {
      id: 'u-pets-sales',
      name: 'Pets Salesman',
      identifier: 'pets',
      role: 'pets_salesman',
      branch: 'timergara',
    },
    password: 'pets',
  },
  {
    user: {
      id: 'u-cg-sales',
      name: 'Cans/Gallons Salesman',
      identifier: 'cans',
      role: 'cans_gallons_salesman',
      branch: 'timergara',
    },
    password: 'cans',
  },
  {
    user: {
      id: 'u-customer',
      name: 'Test Customer',
      identifier: 'customer',
      role: 'customer',
      branch: 'timergara',
      linkedCgCustomerId: 'c-test',
    },
    password: 'customer',
  },
];

export function authenticate(identifier: string, password: string): User | null {
  const id = identifier.trim().toLowerCase();
  const match = mockAccounts.find(
    (acc) => acc.user.identifier.toLowerCase() === id && acc.password === password
  );
  return match ? match.user : null;
}
