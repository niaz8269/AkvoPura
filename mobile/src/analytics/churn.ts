/**
 * Customer churn helpers.
 *
 * Per spec checklist item #27: "Customer churn detection — flag customers
 * who haven't ordered in 30+ days."
 */

const DAY_MS = 24 * 60 * 60_000;
const CHURN_THRESHOLD_DAYS = 30;

export type ChurnRisk = 'fine' | 'borderline' | 'at_risk' | 'never';

/** Map a lastActivityAt timestamp (or undefined) into a risk bucket. */
export function classifyChurn(lastActivityAt: number | undefined): ChurnRisk {
  if (lastActivityAt == null) return 'never';
  const days = Math.floor((Date.now() - lastActivityAt) / DAY_MS);
  if (days >= CHURN_THRESHOLD_DAYS) return 'at_risk';
  if (days >= 20) return 'borderline';
  return 'fine';
}

/** Days since last activity (rounded down). null if never active. */
export function daysSince(lastActivityAt: number | undefined): number | null {
  if (lastActivityAt == null) return null;
  return Math.max(0, Math.floor((Date.now() - lastActivityAt) / DAY_MS));
}

/** Just the threshold for callers that want their own messaging. */
export const CHURN_DAYS = CHURN_THRESHOLD_DAYS;
