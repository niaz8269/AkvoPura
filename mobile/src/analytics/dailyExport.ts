/**
 * Daily activity export — renders today's deliveries, bills, returns,
 * collections, and expenses as a printable PDF and shares it via the
 * system sheet (WhatsApp / email / save to device).
 *
 * Spec checklist item #29: "Data export — share daily summary as PDF."
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { CGCustomer, CollectionEntry, DeliveryEntry } from '../cg/types';
import type { BillEntry, PetCustomer, PetReturnEntry } from '../pets/types';
import type { Expense } from '../manager/types';

const PRIMARY = '#0A6CB7';
const PRIMARY_DARK = '#054E86';
const ACCENT = '#00B5C2';
const TEXT = '#0E2233';
const MUTED = '#5C7184';
const SUCCESS = '#2EA66A';
const DANGER = '#D9433A';

export type DailyExportInput = {
  branchName: string;
  /** End-of-day timestamp the report covers. Default: now. */
  reportedAt?: number;
  cgCustomers: CGCustomer[];
  petCustomers: PetCustomer[];
  deliveries: DeliveryEntry[];
  collections: CollectionEntry[];
  bills: BillEntry[];
  returns: PetReturnEntry[];
  expenses: Expense[];
};

function isToday(ts: number, ref: number) {
  const a = new Date(ts);
  const b = new Date(ref);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateDailyReportHtml(input: DailyExportInput): string {
  const ref = input.reportedAt ?? Date.now();
  const cgById = new Map(input.cgCustomers.map((c) => [c.id, c]));
  const petById = new Map(input.petCustomers.map((c) => [c.id, c]));

  const todaysDeliveries = input.deliveries.filter((d) => isToday(d.timestamp, ref));
  const todaysCollections = input.collections.filter((c) => isToday(c.timestamp, ref));
  const todaysBills = input.bills.filter((b) => isToday(b.timestamp, ref));
  const todaysReturns = input.returns.filter((r) => isToday(r.timestamp, ref));
  const todaysExpenses = input.expenses.filter((e) => isToday(e.submittedAt, ref));

  const cgCash = todaysDeliveries.reduce((s, d) => s + d.cashCollected, 0);
  const cgBilled = todaysDeliveries.reduce((s, d) => s + d.amountBilled, 0);
  const petsCash = todaysBills.reduce((s, b) => s + b.cashCollected, 0);
  const petsBilled = todaysBills.reduce((s, b) => s + b.amountBilled, 0);
  const refunds = todaysReturns.reduce((s, r) => s + r.refundAmount, 0);

  const cansDelivered = todaysDeliveries.reduce((s, d) => s + d.cansDelivered, 0);
  const gallonsDelivered = todaysDeliveries.reduce((s, d) => s + d.gallonsDelivered, 0);
  const emptyCans =
    todaysDeliveries.reduce((s, d) => s + d.emptyCansCollected, 0) +
    todaysCollections.reduce((s, c) => s + c.cansCollected, 0);
  const emptyGallons =
    todaysDeliveries.reduce((s, d) => s + d.emptyGallonsCollected, 0) +
    todaysCollections.reduce((s, c) => s + c.gallonsCollected, 0);

  const pet600Sold = todaysBills.reduce((s, b) => s + b.pet600Packs, 0);
  const pet1500Sold = todaysBills.reduce((s, b) => s + b.pet1500Packs, 0);

  const expensesApproved = todaysExpenses
    .filter((e) => e.status === 'approved')
    .reduce((s, e) => s + e.amount, 0);
  const expensesPending = todaysExpenses.filter((e) => e.status === 'pending').length;

  const totalCash = cgCash + petsCash;
  const totalBilled = cgBilled + petsBilled;
  const credit = totalBilled - totalCash;
  const netCash = totalCash - expensesApproved - refunds;

  // Combined transaction log (sorted by time)
  type TxRow = { ts: number; type: string; who: string; detail: string; amount: number };
  const tx: TxRow[] = [];
  todaysDeliveries.forEach((d) => {
    const c = cgById.get(d.customerId);
    tx.push({
      ts: d.timestamp,
      type: 'C/G Delivery',
      who: c?.name ?? '—',
      detail: `${d.cansDelivered}c + ${d.gallonsDelivered}g (paid Rs ${d.cashCollected.toLocaleString()})`,
      amount: d.amountBilled,
    });
  });
  todaysCollections.forEach((c) => {
    const cust = cgById.get(c.customerId);
    tx.push({
      ts: c.timestamp,
      type: 'Empties',
      who: cust?.name ?? '—',
      detail: `Picked up ${c.cansCollected}c + ${c.gallonsCollected}g`,
      amount: 0,
    });
  });
  todaysBills.forEach((b) => {
    const cust = petById.get(b.customerId);
    tx.push({
      ts: b.timestamp,
      type: 'Pets Bill',
      who: cust?.name ?? '—',
      detail: `${b.pet600Packs}×600ml + ${b.pet1500Packs}×1.5L (paid Rs ${b.cashCollected.toLocaleString()})`,
      amount: b.amountBilled,
    });
  });
  todaysReturns.forEach((r) => {
    const cust = petById.get(r.customerId);
    tx.push({
      ts: r.timestamp,
      type: 'Pets Return',
      who: cust?.name ?? '—',
      detail: `Refund ${r.pet600Packs}×600ml + ${r.pet1500Packs}×1.5L`,
      amount: -r.refundAmount,
    });
  });
  todaysExpenses.forEach((e) => {
    tx.push({
      ts: e.submittedAt,
      type: `Expense (${e.status})`,
      who: e.submittedBy,
      detail: `${e.category}${e.notes ? ' — ' + e.notes : ''}`,
      amount: -e.amount,
    });
  });
  tx.sort((a, b) => a.ts - b.ts);

  const txRows = tx.length === 0
    ? `<tr><td colspan="5" style="text-align:center; color:${MUTED}; font-style:italic; padding:24px;">No activity logged for this day.</td></tr>`
    : tx.map((t) => `
      <tr>
        <td>${formatTime(t.ts)}</td>
        <td><span class="tx-type">${escapeHtml(t.type)}</span></td>
        <td>${escapeHtml(t.who)}</td>
        <td>${escapeHtml(t.detail)}</td>
        <td class="num ${t.amount < 0 ? 'neg' : 'pos'}">${t.amount === 0 ? '—' : (t.amount < 0 ? '−Rs ' + Math.abs(t.amount).toLocaleString() : 'Rs ' + t.amount.toLocaleString())}</td>
      </tr>`).join('');

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>AkvoPura — Day Report ${formatDate(ref)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: ${TEXT};
    padding: 22px;
    margin: 0;
    background: #fff;
    font-size: 12px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid ${PRIMARY};
    padding-bottom: 14px;
    margin-bottom: 18px;
  }
  .brand { font-size: 26px; font-weight: 900; color: ${PRIMARY_DARK}; letter-spacing: 1px; }
  .tagline { color: ${ACCENT}; font-size: 11px; font-weight: 600; margin-top: 2px; }
  .meta { text-align: right; color: ${MUTED}; font-size: 11px; }
  .meta .big { color: ${PRIMARY_DARK}; font-size: 16px; font-weight: 800; }

  h2 {
    color: ${PRIMARY_DARK};
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 18px 0 8px;
    border-bottom: 1px solid #D5E3EE;
    padding-bottom: 4px;
  }

  .kpis { display: flex; gap: 8px; margin-bottom: 12px; }
  .kpi {
    flex: 1;
    background: #F4FAFE;
    border-radius: 6px;
    padding: 10px 12px;
    border-left: 4px solid ${PRIMARY};
  }
  .kpi.cash { border-left-color: ${SUCCESS}; }
  .kpi.credit { border-left-color: ${DANGER}; }
  .kpi.net { border-left-color: ${ACCENT}; }
  .kpi-label { font-size: 10px; color: ${MUTED}; text-transform: uppercase; letter-spacing: 0.5px; }
  .kpi-value { font-size: 17px; font-weight: 900; color: ${PRIMARY_DARK}; margin-top: 2px; }
  .kpi.cash .kpi-value { color: ${SUCCESS}; }
  .kpi.credit .kpi-value { color: ${DANGER}; }

  table { width: 100%; border-collapse: collapse; }
  .summary-grid td {
    padding: 4px 0;
    font-size: 12px;
  }
  .summary-grid td.label { color: ${MUTED}; width: 60%; }
  .summary-grid td.value { text-align: right; font-weight: 700; color: ${PRIMARY_DARK}; }

  .tx-table th {
    background: ${PRIMARY};
    color: #fff;
    text-align: left;
    padding: 8px 10px;
    font-size: 11px;
    font-weight: 700;
  }
  .tx-table th.num { text-align: right; }
  .tx-table td {
    padding: 7px 10px;
    border-bottom: 1px solid #EAF3FA;
    font-size: 11px;
  }
  .tx-table td.num { text-align: right; font-weight: 700; }
  .tx-table .tx-type {
    background: #EAF3FA;
    color: ${PRIMARY_DARK};
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
  }
  .pos { color: ${SUCCESS}; }
  .neg { color: ${DANGER}; }

  .footer {
    margin-top: 24px;
    padding-top: 12px;
    border-top: 1px dashed #D5E3EE;
    color: ${MUTED};
    font-size: 10px;
    text-align: center;
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">AkvoPura</div>
      <div class="tagline">Pure Water · Pure Trust</div>
      <div class="tagline" style="color: ${MUTED}; font-weight: 500;">${escapeHtml(input.branchName)} Branch</div>
    </div>
    <div class="meta">
      <div>DAY REPORT</div>
      <div class="big">${formatDate(ref)}</div>
      <div style="margin-top: 6px;">Generated ${formatTime(ref)}</div>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi cash">
      <div class="kpi-label">Cash collected</div>
      <div class="kpi-value">Rs ${totalCash.toLocaleString()}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Total billed</div>
      <div class="kpi-value">Rs ${totalBilled.toLocaleString()}</div>
    </div>
    <div class="kpi credit">
      <div class="kpi-label">Credit (owed)</div>
      <div class="kpi-value">Rs ${Math.max(0, credit).toLocaleString()}</div>
    </div>
    <div class="kpi net">
      <div class="kpi-label">Net cash</div>
      <div class="kpi-value">Rs ${netCash.toLocaleString()}</div>
    </div>
  </div>

  <h2>Cans / Gallons</h2>
  <table class="summary-grid">
    <tr><td class="label">Deliveries</td><td class="value">${todaysDeliveries.length}</td></tr>
    <tr><td class="label">Cans delivered</td><td class="value">${cansDelivered}</td></tr>
    <tr><td class="label">Gallons delivered</td><td class="value">${gallonsDelivered}</td></tr>
    <tr><td class="label">Empty cans returned</td><td class="value">${emptyCans}</td></tr>
    <tr><td class="label">Empty gallons returned</td><td class="value">${emptyGallons}</td></tr>
    <tr><td class="label">CG cash collected</td><td class="value">Rs ${cgCash.toLocaleString()}</td></tr>
  </table>

  <h2>Pets</h2>
  <table class="summary-grid">
    <tr><td class="label">Bills</td><td class="value">${todaysBills.length}</td></tr>
    <tr><td class="label">600ml packs sold</td><td class="value">${pet600Sold}</td></tr>
    <tr><td class="label">1.5L packs sold</td><td class="value">${pet1500Sold}</td></tr>
    <tr><td class="label">Returns</td><td class="value">${todaysReturns.length}</td></tr>
    <tr><td class="label">Refunds</td><td class="value">Rs ${refunds.toLocaleString()}</td></tr>
    <tr><td class="label">Pets cash collected</td><td class="value">Rs ${petsCash.toLocaleString()}</td></tr>
  </table>

  <h2>Expenses</h2>
  <table class="summary-grid">
    <tr><td class="label">Submitted today</td><td class="value">${todaysExpenses.length}</td></tr>
    <tr><td class="label">Pending</td><td class="value">${expensesPending}</td></tr>
    <tr><td class="label">Approved (deducted from net)</td><td class="value">Rs ${expensesApproved.toLocaleString()}</td></tr>
  </table>

  <h2>Transaction log</h2>
  <table class="tx-table">
    <thead>
      <tr>
        <th>Time</th>
        <th>Type</th>
        <th>Customer / Actor</th>
        <th>Detail</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>${txRows}</tbody>
  </table>

  <div class="footer">
    AkvoPura · Day report for ${formatDate(ref)} · ${escapeHtml(input.branchName)} Branch
  </div>
</body>
</html>`;
}

/** Renders the daily PDF and opens the system share sheet. */
export async function generateAndShareDailyReport(input: DailyExportInput): Promise<boolean> {
  const html = generateDailyReportHtml(input);
  const { uri } = await Print.printToFileAsync({ html });

  const available = await Sharing.isAvailableAsync();
  if (!available) return false;

  const dateLabel = formatDate(input.reportedAt ?? Date.now());
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `AkvoPura Day Report — ${dateLabel}`,
    UTI: 'com.adobe.pdf',
  });
  return true;
}
