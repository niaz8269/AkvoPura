/**
 * Per-role tutorial step content. Each step is one card the user steps
 * through on first login. Bilingual short copy with an icon hint.
 */

import type { Role } from '../auth/types';

export type TutorialStep = {
  /** Ionicons name for the step illustration. */
  icon: string;
  titleEn: string;
  titleUr: string;
  bodyEn: string;
  bodyUr: string;
};

export const TUTORIAL_STEPS: Partial<Record<Role, TutorialStep[]>> = {
  owner: [
    {
      icon: 'business-outline',
      titleEn: 'Welcome, Owner',
      titleUr: '  ',
      bodyEn:
        'You can see every branch you have and compare them side by side. Tap a branch on the Branches tab to drill in.',
      bodyUr:
        '   (   )                  ',
    },
    {
      icon: 'wallet-outline',
      titleEn: 'Approve high-value expenses',
      titleUr: '  ',
      bodyEn:
        'When the manager forwards a high-value expense to you, it appears on the Forwarded tab. Approve or reject from there.',
      bodyUr:
        '           Forwarded       ',
    },
    {
      icon: 'settings-outline',
      titleEn: 'Set product prices',
      titleUr: '  ',
      bodyEn:
        'On the Settings tab you can change the default price for every product. Per-customer overrides still apply.',
      bodyUr:
        'Settings            ',
    },
    {
      icon: 'list-outline',
      titleEn: 'Audit log',
      titleUr: ' ',
      bodyEn:
        "Every important action — sales, returns, expense decisions — is in the Audit tab. Filter by Sales or Expenses.",
      bodyUr:
        '   Audit    —     ',
    },
  ],

  manager: [
    {
      icon: 'home-outline',
      titleEn: 'Welcome, Manager',
      titleUr: '  ',
      bodyEn:
        "Your Home tab is the branch's nerve center — cash, alerts, today's assignments, recent activity.",
      bodyUr:
        'Home         —       ',
    },
    {
      icon: 'cube-outline',
      titleEn: 'Load the vans + assign salesmen',
      titleUr: '      ',
      bodyEn:
        'From Home → Today\'s assignments, set how many cans/gallons/packs each van carries today, and pick which salesman drives.',
      bodyUr:
        "Home →            ",
    },
    {
      icon: 'cart-outline',
      titleEn: 'Customer orders',
      titleUr: ' ',
      bodyEn:
        'When a customer places an order from their app, you\'ll see an alert here. Assign it to a salesman, then mark on-the-way and delivered.',
      bodyUr:
        '                   ',
    },
    {
      icon: 'briefcase-outline',
      titleEn: 'Staff accounts',
      titleUr: '  ',
      bodyEn:
        'The Team tab manages who can log into the app — add staff accounts, set roles, deactivate when needed.',
      bodyUr:
        'Team          —        ',
    },
    {
      icon: 'wallet-outline',
      titleEn: 'Expense approvals',
      titleUr: '  ',
      bodyEn:
        'Salesmen submit field expenses (fuel, repairs, food). Approve, reject, or forward big ones to the Owner.',
      bodyUr:
        '              ',
    },
  ],

  pets_salesman: [
    {
      icon: 'people-outline',
      titleEn: 'Your customer list',
      titleUr: '   ',
      bodyEn:
        'The Customers tab shows everyone on your route. Customers you have sold to today turn green. Tap any to see history.',
      bodyUr:
        'Customers                  ',
    },
    {
      icon: 'cash-outline',
      titleEn: 'Generating a bill',
      titleUr: ' ',
      bodyEn:
        'On the Sell tab: pick a customer, set the pack quantities with the +/- buttons, edit the price if needed, then swipe to finalize.',
      bodyUr:
        'Sell  :             ',
    },
    {
      icon: 'share-social-outline',
      titleEn: 'Share the bill',
      titleUr: ' ',
      bodyEn:
        'After saving, tap "Share bill" to send a clean PDF via WhatsApp directly to the customer.',
      bodyUr:
        '     "Share bill"       WhatsApp  ',
    },
    {
      icon: 'return-down-back-outline',
      titleEn: 'Returns',
      titleUr: '',
      bodyEn:
        "When a customer returns unsold packs, log them on the Returns tab. The refund is auto-credited to their balance.",
      bodyUr:
        '      Returns            ',
    },
    {
      icon: 'checkmark-done-outline',
      titleEn: 'End of day',
      titleUr: '  ',
      bodyEn:
        'Submit your daily closure to the manager from the End Day tab. You can also log field expenses (fuel, food) here.',
      bodyUr:
        'End Day               ',
    },
  ],

  cans_gallons_salesman: [
    {
      icon: 'today-outline',
      titleEn: 'Color-coded customers',
      titleUr: '  ',
      bodyEn:
        'Today tab shows your customers as cards: ⚪ clean, 🟡 has empties, 🟠 has debt, 🔴 has both, 🟢 delivered today.',
      bodyUr:
        'Today     : ⚪  🟡   🟠  🔴  🟢   ',
    },
    {
      icon: 'cube-outline',
      titleEn: 'Daily and weekly customers',
      titleUr: '   ',
      bodyEn:
        'Filter by payment cycle (All / Daily / Weekly) above the route tabs. Daily customers pay each visit; weekly settle once a week.',
      bodyUr:
        '                    ',
    },
    {
      icon: 'send-outline',
      titleEn: 'Swipe to deliver',
      titleUr: '    ',
      bodyEn:
        'On the Deliver tab: set cans/gallons with +/- buttons, then swipe right to confirm. The system auto-handles cash vs credit.',
      bodyUr:
        'Deliver               ',
    },
    {
      icon: 'archive-outline',
      titleEn: 'Empty container collection',
      titleUr: '   ',
      bodyEn:
        'Use the Collect tab to log empty cans/gallons returned by the customer. It updates their held-empties balance.',
      bodyUr:
        'Collect           ',
    },
    {
      icon: 'checkmark-done-outline',
      titleEn: 'End of day',
      titleUr: '  ',
      bodyEn:
        'Submit your daily closure from End Day. You can also log field expenses (fuel, repairs) for manager approval.',
      bodyUr:
        'End Day            ',
    },
  ],

  customer: [
    {
      icon: 'home-outline',
      titleEn: 'Your account at a glance',
      titleUr: '    ',
      bodyEn:
        'Home shows your outstanding balance, the empties (cans/gallons) you are holding, and any orders in progress.',
      bodyUr:
        'Home           /      ',
    },
    {
      icon: 'cart-outline',
      titleEn: 'Place an order',
      titleUr: ' ',
      bodyEn:
        'On the Order tab, pick the products + quantities, optional time and notes, then swipe to submit. The manager will assign a salesman.',
      bodyUr:
        'Order               ',
    },
    {
      icon: 'time-outline',
      titleEn: 'History + share bills',
      titleUr: '  ',
      bodyEn:
        'History shows every past order with status, plus PDF bills for every delivery. Tap the share icon on any bill to forward it.',
      bodyUr:
        'History        PDF  ',
    },
    {
      icon: 'chatbubble-ellipses-outline',
      titleEn: 'Complaints',
      titleUr: '',
      bodyEn:
        'If anything goes wrong, file a complaint on the Complaints tab. Pick a category and choose if it goes to the salesman or the manager.',
      bodyUr:
        '    Complaints     ',
    },
  ],
};
