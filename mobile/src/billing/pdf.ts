/**
 * Bill PDF generation + share.
 *
 * Renders a clean, printable HTML invoice and uses expo-print to convert it
 * to a PDF. Then expo-sharing opens the system share sheet so the user can
 * pick WhatsApp / email / save to file. A unified BillData shape works for
 * both CG (cans/gallons) and Pets bills.
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export type BillItem = {
  name: string;
  qty: number;
  unitPrice: number;
};

export type BillData = {
  billNumber: string;
  dateTime: number;
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  branchName: string;
  salesmanName?: string;
  items: BillItem[];
  paid: number;
  credit: number;
};

const PRIMARY = '#0A6CB7';
const PRIMARY_DARK = '#054E86';
const ACCENT = '#00B5C2';
const TEXT = '#0E2233';
const MUTED = '#5C7184';

function formatDateTime(ts: number) {
  const d = new Date(ts);
  const date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${date} ${time}`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateBillHtml(bill: BillData): string {
  const subtotal = bill.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const total = bill.paid + bill.credit;

  const itemsRows = bill.items
    .map(
      (it) => `
      <tr>
        <td>${escapeHtml(it.name)}</td>
        <td class="num">${it.qty}</td>
        <td class="num">Rs ${it.unitPrice.toLocaleString()}</td>
        <td class="num bold">Rs ${(it.qty * it.unitPrice).toLocaleString()}</td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>AkvoPura Bill — ${escapeHtml(bill.billNumber)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: ${TEXT};
    padding: 24px;
    margin: 0;
    background: #fff;
    font-size: 13px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid ${PRIMARY};
    padding-bottom: 16px;
    margin-bottom: 20px;
  }
  .brand {
    font-size: 28px;
    font-weight: 900;
    color: ${PRIMARY_DARK};
    letter-spacing: 1px;
  }
  .tagline {
    color: ${ACCENT};
    font-size: 11px;
    font-weight: 600;
    margin-top: 2px;
  }
  .bill-meta {
    text-align: right;
    color: ${MUTED};
    font-size: 11px;
  }
  .bill-meta .num {
    color: ${PRIMARY_DARK};
    font-size: 14px;
    font-weight: 800;
  }

  .section-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: ${MUTED};
    margin-bottom: 4px;
    font-weight: 700;
  }
  .customer-block {
    background: #F4FAFE;
    border-left: 4px solid ${PRIMARY};
    padding: 12px 16px;
    margin-bottom: 18px;
    border-radius: 4px;
  }
  .customer-name {
    font-size: 16px;
    font-weight: 800;
    color: ${PRIMARY_DARK};
  }
  .customer-line {
    color: ${MUTED};
    font-size: 12px;
    margin-top: 2px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 18px;
  }
  th {
    background: ${PRIMARY};
    color: #fff;
    text-align: left;
    padding: 10px 12px;
    font-size: 12px;
    font-weight: 700;
  }
  th.num, td.num { text-align: right; }
  td {
    padding: 10px 12px;
    border-bottom: 1px solid #D5E3EE;
  }
  td.bold { font-weight: 800; color: ${PRIMARY_DARK}; }

  .totals {
    display: flex;
    justify-content: flex-end;
  }
  .totals-table {
    width: 280px;
    border-collapse: collapse;
  }
  .totals-table td {
    padding: 6px 12px;
    border: none;
    font-size: 13px;
  }
  .totals-table .label { color: ${MUTED}; }
  .totals-table .value { text-align: right; font-weight: 700; color: ${TEXT}; }
  .totals-table .grand-row {
    background: ${PRIMARY};
    color: #fff;
  }
  .totals-table .grand-row .label,
  .totals-table .grand-row .value {
    color: #fff;
    font-size: 16px;
    font-weight: 900;
    padding: 12px;
  }
  .credit { color: #E8A53C; }

  .footer {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px dashed #D5E3EE;
    color: ${MUTED};
    font-size: 11px;
    text-align: center;
  }
  .footer .thanks {
    color: ${PRIMARY_DARK};
    font-weight: 800;
    font-size: 13px;
    margin-bottom: 4px;
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">AkvoPura</div>
      <div class="tagline">Pure Water · Pure Trust</div>
      <div class="tagline" style="color: ${MUTED}; font-weight: 500;">${escapeHtml(bill.branchName)} Branch</div>
    </div>
    <div class="bill-meta">
      <div>BILL NO.</div>
      <div class="num">${escapeHtml(bill.billNumber)}</div>
      <div style="margin-top: 8px;">${formatDateTime(bill.dateTime)}</div>
      ${bill.salesmanName ? `<div style="margin-top: 4px;">By ${escapeHtml(bill.salesmanName)}</div>` : ''}
    </div>
  </div>

  <div class="section-title">Billed to</div>
  <div class="customer-block">
    <div class="customer-name">${escapeHtml(bill.customerName)}</div>
    ${bill.customerAddress ? `<div class="customer-line">${escapeHtml(bill.customerAddress)}</div>` : ''}
    ${bill.customerPhone ? `<div class="customer-line">${escapeHtml(bill.customerPhone)}</div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="num">Qty</th>
        <th class="num">Unit price</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tr>
        <td class="label">Subtotal</td>
        <td class="value">Rs ${subtotal.toLocaleString()}</td>
      </tr>
      <tr>
        <td class="label">Cash paid</td>
        <td class="value">Rs ${bill.paid.toLocaleString()}</td>
      </tr>
      ${bill.credit > 0 ? `
      <tr>
        <td class="label credit">Credit (owed)</td>
        <td class="value credit">Rs ${bill.credit.toLocaleString()}</td>
      </tr>` : ''}
      <tr class="grand-row">
        <td class="label">TOTAL</td>
        <td class="value">Rs ${total.toLocaleString()}</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    <div class="thanks">Thank you for choosing AkvoPura · شکریہ</div>
    <div>Reusable cans &amp; gallons must be returned on the next visit.</div>
  </div>
</body>
</html>
`;
}

/**
 * Generates the PDF from BillData and opens the system share sheet.
 * Returns true on success, false if sharing isn't available on this device.
 */
export async function generateAndShareBill(bill: BillData): Promise<boolean> {
  const html = generateBillHtml(bill);
  const { uri } = await Print.printToFileAsync({ html });

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    return false;
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `AkvoPura Bill ${bill.billNumber}`,
    UTI: 'com.adobe.pdf',
  });

  return true;
}
