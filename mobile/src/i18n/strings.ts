/**
 * English-only labels. The historical "BilingualString" shape ({ en, ur })
 * is kept as `{ en: string }` so existing callers don't need rewriting.
 * The `ur` field has been dropped — every screen is English-only now.
 */

export type BilingualString = { en: string };

export const strings = {
  // App
  appName: { en: 'AkvoPura' },
  tagline: { en: 'Pure Water, Pure Trust' },

  // Auth
  login: { en: 'Login' },
  logout: { en: 'Logout' },
  phoneOrEmail: { en: 'Phone or Email' },
  password: { en: 'Password' },
  loginFailed: { en: 'Wrong phone/email or password' },
  loggingIn: { en: 'Signing in...' },
  testAccountsHint: { en: 'Tap a test account to log in:' },

  // Roles (display labels)
  roleOwner: { en: 'Owner' },
  roleManager: { en: 'Manager' },
  rolePetsSalesman: { en: 'Pets Salesman' },
  roleCansSalesman: { en: 'Cans/Gallons Salesman' },
  roleCustomer: { en: 'Customer' },

  // Branches
  branchTimergara: { en: 'Timergara' },
  branchShergarh: { en: 'Shergarh' },

  // Common
  welcome: { en: 'Welcome' },
  branch: { en: 'Branch' },
  comingSoon: { en: 'This dashboard will be built next.' },
  cancel: { en: 'Cancel' },
  confirm: { en: 'Confirm' },
  yes: { en: 'Yes' },
  no: { en: 'No' },
} as const;

export type StringKey = keyof typeof strings;
