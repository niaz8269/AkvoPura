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
  appName: { en: 'AkvoPura', ur: 'آکوو پیورا' },
  tagline: { en: 'Pure Water, Pure Trust', ur: 'خالص پانی، خالص بھروسہ' },

  // Auth
  login: { en: 'Login', ur: 'لاگ ان' },
  logout: { en: 'Logout', ur: 'لاگ آؤٹ' },
  phoneOrEmail: { en: 'Phone or Email', ur: 'فون یا ای میل' },
  password: { en: 'Password', ur: 'پاس ورڈ' },
  loginFailed: { en: 'Wrong phone/email or password', ur: 'غلط فون/ای میل یا پاس ورڈ' },
  loggingIn: { en: 'Signing in...', ur: 'لاگ ان ہو رہا ہے...' },
  testAccountsHint: { en: 'Tap a test account to log in:', ur: 'لاگ ان کے لیے ٹیسٹ اکاؤنٹ پر ٹیپ کریں:' },

  // Roles (display labels)
  roleOwner: { en: 'Owner', ur: 'مالک' },
  roleManager: { en: 'Manager', ur: 'منیجر' },
  rolePetsSalesman: { en: 'Pets Salesman', ur: 'پیٹس سیلز مین' },
  roleCansSalesman: { en: 'Cans/Gallons Salesman', ur: 'کین/گیلن سیلز مین' },
  roleCustomer: { en: 'Customer', ur: 'کسٹمر' },

  // Branches
  branchTimergara: { en: 'Timergara', ur: 'تیمرگرہ' },
  branchShergarh: { en: 'Shergarh', ur: 'شیر گڑھ' },

  // Common
  welcome: { en: 'Welcome', ur: 'خوش آمدید' },
  branch: { en: 'Branch', ur: 'برانچ' },
  comingSoon: { en: 'This dashboard will be built next.', ur: 'یہ ڈیش بورڈ اگلے مرحلے میں بنایا جائے گا۔' },
  cancel: { en: 'Cancel', ur: 'منسوخ' },
  confirm: { en: 'Confirm', ur: 'تصدیق' },
  yes: { en: 'Yes', ur: 'جی ہاں' },
  no: { en: 'No', ur: 'نہیں' },
} as const;

export type StringKey = keyof typeof strings;
