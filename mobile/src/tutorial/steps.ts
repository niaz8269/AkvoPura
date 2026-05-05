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

export const TUTORIAL_STEPS: Record<Role, TutorialStep[]> = {
  owner: [
    {
      icon: 'business-outline',
      titleEn: 'Welcome, Owner',
      titleUr: 'خوش آمدید، مالک',
      bodyEn:
        'You can see both branches (Timergara and Shergarh) and compare them side by side. Tap a branch on the Branches tab to drill in.',
      bodyUr:
        'آپ دونوں برانچوں (تیمرگرہ اور شیر گڑھ) کو دیکھ سکتے ہیں اور ان کا موازنہ کر سکتے ہیں۔ تفصیل کے لیے برانچ پر ٹیپ کریں۔',
    },
    {
      icon: 'wallet-outline',
      titleEn: 'Approve high-value expenses',
      titleUr: 'اخراجات کی منظوری',
      bodyEn:
        'When the manager forwards a high-value expense to you, it appears on the Forwarded tab. Approve or reject from there.',
      bodyUr:
        'منیجر آپ کو بڑے اخراجات کی منظوری کے لیے بھیجتا ہے۔ Forwarded ٹیب پر منظوری دیں یا منع کریں۔',
    },
    {
      icon: 'settings-outline',
      titleEn: 'Set product prices',
      titleUr: 'پروڈکٹ کی قیمتیں',
      bodyEn:
        'On the Settings tab you can change the default price for every product. Per-customer overrides still apply.',
      bodyUr:
        'Settings ٹیب میں آپ ہر پروڈکٹ کی ڈیفالٹ قیمت تبدیل کر سکتے ہیں۔',
    },
    {
      icon: 'list-outline',
      titleEn: 'Audit log',
      titleUr: 'آڈٹ لاگ',
      bodyEn:
        "Every important action — sales, returns, expense decisions — is in the Audit tab. Filter by Sales or Expenses.",
      bodyUr:
        'ہر اہم کام Audit ٹیب میں ہے — فروخت، واپسی، اخراجات کے فیصلے۔',
    },
  ],

  manager: [
    {
      icon: 'home-outline',
      titleEn: 'Welcome, Manager',
      titleUr: 'خوش آمدید، منیجر',
      bodyEn:
        "Your Home tab is the branch's nerve center — cash, alerts, today's assignments, recent activity.",
      bodyUr:
        'Home ٹیب آپ کی برانچ کا کنٹرول روم ہے — نقدی، الرٹس، آج کی تفویض، حالیہ سرگرمی۔',
    },
    {
      icon: 'cube-outline',
      titleEn: 'Load the vans + assign salesmen',
      titleUr: 'وین لوڈنگ اور سیلز مین کی تفویض',
      bodyEn:
        'From Home → Today\'s assignments, set how many cans/gallons/packs each van carries today, and pick which salesman drives.',
      bodyUr:
        "Home → آج کی تفویض سے ہر وین کا سامان اور سیلز مین چنیں۔",
    },
    {
      icon: 'cart-outline',
      titleEn: 'Customer orders',
      titleUr: 'کسٹمر آرڈرز',
      bodyEn:
        'When a customer places an order from their app, you\'ll see an alert here. Assign it to a salesman, then mark on-the-way and delivered.',
      bodyUr:
        'کسٹمر آرڈر کرے تو آپ کو الرٹ ملے گا۔ سیلز مین کو تفویض کریں اور پھر ڈیلیور کا نشان لگائیں۔',
    },
    {
      icon: 'briefcase-outline',
      titleEn: 'Team + attendance',
      titleUr: 'ٹیم اور حاضری',
      bodyEn:
        'The Team tab shows today\'s attendance — check employees in and out, see live hourly earnings, edit anyone\'s pay.',
      bodyUr:
        'Team ٹیب میں ملازمین کی آج کی حاضری ہے — چیک ان/آؤٹ، گھنٹہ وار کمائی، تنخواہ میں تبدیلی۔',
    },
    {
      icon: 'wallet-outline',
      titleEn: 'Expense approvals',
      titleUr: 'اخراجات کی منظوری',
      bodyEn:
        'Salesmen submit field expenses (fuel, repairs, food). Approve, reject, or forward big ones to the Owner.',
      bodyUr:
        'سیلز مین اخراجات بھیجتے ہیں۔ منظوری دیں، منع کریں، یا بڑے اخراجات مالک کو بھیجیں۔',
    },
  ],

  pets_salesman: [
    {
      icon: 'people-outline',
      titleEn: 'Your customer list',
      titleUr: 'آپ کی کسٹمر لسٹ',
      bodyEn:
        'The Customers tab shows everyone on your route. Customers you have sold to today turn green. Tap any to see history.',
      bodyUr:
        'Customers ٹیب میں آپ کے روٹ کے سب کسٹمر ہیں۔ آج فروخت کی تو کارڈ سبز ہو جاتا ہے۔',
    },
    {
      icon: 'cash-outline',
      titleEn: 'Generating a bill',
      titleUr: 'بل بنانا',
      bodyEn:
        'On the Sell tab: pick a customer, set the pack quantities with the +/- buttons, edit the price if needed, then swipe to finalize.',
      bodyUr:
        'Sell ٹیب میں: کسٹمر چنیں، مقدار سیٹ کریں، قیمت تبدیل کریں اگر چاہیں، پھر سوائپ کریں۔',
    },
    {
      icon: 'share-social-outline',
      titleEn: 'Share the bill',
      titleUr: 'بل بھیجیں',
      bodyEn:
        'After saving, tap "Share bill" to send a clean PDF via WhatsApp directly to the customer.',
      bodyUr:
        'بل محفوظ ہونے کے بعد "Share bill" پر ٹیپ کر کے کسٹمر کو WhatsApp پر بھیجیں۔',
    },
    {
      icon: 'return-down-back-outline',
      titleEn: 'Returns',
      titleUr: 'واپسی',
      bodyEn:
        "When a customer returns unsold packs, log them on the Returns tab. The refund is auto-credited to their balance.",
      bodyUr:
        'اگر کسٹمر پیک واپس کرے تو Returns ٹیب پر درج کریں۔ رقم خود کسٹمر کے حساب میں جاتی ہے۔',
    },
    {
      icon: 'checkmark-done-outline',
      titleEn: 'End of day',
      titleUr: 'دن کا اختتام',
      bodyEn:
        'Submit your daily closure to the manager from the End Day tab. You can also log field expenses (fuel, food) here.',
      bodyUr:
        'End Day ٹیب سے دن کا حساب منیجر کو بھیجیں۔ یہاں اخراجات بھی درج ہو سکتے ہیں۔',
    },
  ],

  cans_gallons_salesman: [
    {
      icon: 'today-outline',
      titleEn: 'Color-coded customers',
      titleUr: 'رنگوں سے فرق',
      bodyEn:
        'Today tab shows your customers as cards: ⚪ clean, 🟡 has empties, 🟠 has debt, 🔴 has both, 🟢 delivered today.',
      bodyUr:
        'Today میں کسٹمر کارڈز رنگوں سے: ⚪ صاف، 🟡 خالی ہیں، 🟠 ادھار، 🔴 دونوں، 🟢 آج ڈیلیور ہوا۔',
    },
    {
      icon: 'cube-outline',
      titleEn: 'Daily and weekly customers',
      titleUr: 'روزانہ اور ہفتہ وار',
      bodyEn:
        'Filter by payment cycle (All / Daily / Weekly) above the route tabs. Daily customers pay each visit; weekly settle once a week.',
      bodyUr:
        'روٹ ٹیبز کے اوپر سے روزانہ یا ہفتہ وار کسٹمر چنیں۔ روزانہ ہر بار ادائیگی کرتے ہیں، ہفتہ وار ہفتے میں۔',
    },
    {
      icon: 'send-outline',
      titleEn: 'Swipe to deliver',
      titleUr: 'ڈیلیور کرنے کے لیے سوائپ',
      bodyEn:
        'On the Deliver tab: set cans/gallons with +/- buttons, then swipe right to confirm. The system auto-handles cash vs credit.',
      bodyUr:
        'Deliver میں مقدار سیٹ کریں اور دائیں سوائپ کریں۔ نقدی یا ادھار خود طے ہوتا ہے۔',
    },
    {
      icon: 'archive-outline',
      titleEn: 'Empty container collection',
      titleUr: 'خالی برتنوں کی واپسی',
      bodyEn:
        'Use the Collect tab to log empty cans/gallons returned by the customer. It updates their held-empties balance.',
      bodyUr:
        'Collect ٹیب پر کسٹمر سے واپس آنے والے خالی برتن درج کریں۔',
    },
    {
      icon: 'checkmark-done-outline',
      titleEn: 'End of day',
      titleUr: 'دن کا اختتام',
      bodyEn:
        'Submit your daily closure from End Day. You can also log field expenses (fuel, repairs) for manager approval.',
      bodyUr:
        'End Day سے دن کا حساب بھیجیں۔ یہاں اخراجات بھی شامل کر سکتے ہیں۔',
    },
  ],

  customer: [
    {
      icon: 'home-outline',
      titleEn: 'Your account at a glance',
      titleUr: 'آپ کے حساب کا خلاصہ',
      bodyEn:
        'Home shows your outstanding balance, the empties (cans/gallons) you are holding, and any orders in progress.',
      bodyUr:
        'Home میں آپ کی باقی رقم، آپ کے پاس موجود خالی کین/گیلن، اور جاری آرڈر نظر آتے ہیں۔',
    },
    {
      icon: 'cart-outline',
      titleEn: 'Place an order',
      titleUr: 'آرڈر کریں',
      bodyEn:
        'On the Order tab, pick the products + quantities, optional time and notes, then swipe to submit. The manager will assign a salesman.',
      bodyUr:
        'Order ٹیب پر پروڈکٹ اور مقدار چنیں، پھر سوائپ کریں۔ منیجر سیلز مین تفویض کرے گا۔',
    },
    {
      icon: 'time-outline',
      titleEn: 'History + share bills',
      titleUr: 'تاریخ اور بل',
      bodyEn:
        'History shows every past order with status, plus PDF bills for every delivery. Tap the share icon on any bill to forward it.',
      bodyUr:
        'History میں سب آرڈر، اور ہر ڈیلیوری کا PDF بل ہے۔',
    },
    {
      icon: 'chatbubble-ellipses-outline',
      titleEn: 'Complaints',
      titleUr: 'شکایات',
      bodyEn:
        'If anything goes wrong, file a complaint on the Complaints tab. Pick a category and choose if it goes to the salesman or the manager.',
      bodyUr:
        'کوئی مسئلہ ہو تو Complaints ٹیب پر شکایت درج کریں۔',
    },
  ],
};
