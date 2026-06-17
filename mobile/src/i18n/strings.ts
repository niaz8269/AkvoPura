/**
 * Bilingual strings (English + Urdu).
 * Per spec: bilingual labels are mandatory on every important button.
 *
 * Each key has an `en` (English) and `ur` (Urdu) value.
 * Components display either one, or both stacked, depending on context.
 */

export type BilingualString = { en: string; ur: string };

export const strings = {
  // App
  appName: { en: 'AkvoPura', ur: ' ' },
  tagline: { en: 'Pure Water, Pure Trust', ur: '   ' },

  // Auth
  login: { en: 'Login', ur: ' ' },
  logout: { en: 'Logout', ur: ' ' },
  phoneOrEmail: { en: 'Phone or Email', ur: '   ' },
  password: { en: 'Password', ur: ' ' },
  loginFailed: { en: 'Wrong phone/email or password', ur: ' /    ' },
  loggingIn: { en: 'Signing in...', ur: '    ...' },
  testAccountsHint: { en: 'Tap a test account to log in:', ur: '        :' },

  // Roles (display labels)
  roleOwner: { en: 'Owner', ur: '' },
  roleManager: { en: 'Manager', ur: '' },
  rolePetsSalesman: { en: 'Pets Salesman', ur: '  ' },
  roleCansSalesman: { en: 'Cans/Gallons Salesman', ur: '/  ' },
  roleCustomer: { en: 'Customer', ur: '' },

  // Branches
  branchTimergara: { en: 'Timergara', ur: '' },
  branchShergarh: { en: 'Shergarh', ur: ' ' },

  // Common
  welcome: { en: 'Welcome', ur: ' ' },
  branch: { en: 'Branch', ur: '' },
  comingSoon: { en: 'This dashboard will be built next.', ur: '        ' },
  cancel: { en: 'Cancel', ur: '' },
  confirm: { en: 'Confirm', ur: '' },
  yes: { en: 'Yes', ur: ' ' },
  no: { en: 'No', ur: '' },
} as const;

export type StringKey = keyof typeof strings;
