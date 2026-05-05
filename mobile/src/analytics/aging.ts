/**
 * Customer aging buckets — group customers with outstanding debt by how
 * long they have been inactive. Aging by *last activity* (not by debt-age,
 * which we don't track yet) — the longer a debtor has been quiet, the
 * higher the chase priority.
 */

const DAY_MS = 24 * 60 * 60_000;

export type AgingBucket = 'current' | 'd30_60' | 'd60_90' | 'd90_plus' | 'never';

export type AgingBucketInfo = {
  key: AgingBucket;
  label: string;
  /** Sub-label used in headings. */
  range: string;
};

export const AGING_BUCKETS: AgingBucketInfo[] = [
  { key: 'current',  label: 'Current',       range: 'Active in last 30 days' },
  { key: 'd30_60',   label: '30-60 days',    range: 'Inactive 30–60 days' },
  { key: 'd60_90',   label: '60-90 days',    range: 'Inactive 60–90 days' },
  { key: 'd90_plus', label: '90+ days',      range: 'Inactive 90+ days' },
  { key: 'never',    label: 'Never ordered', range: 'No activity recorded' },
];

export function agingBucket(lastActivityAt: number | undefined): AgingBucket {
  if (lastActivityAt == null) return 'never';
  const days = Math.floor((Date.now() - lastActivityAt) / DAY_MS);
  if (days < 30) return 'current';
  if (days < 60) return 'd30_60';
  if (days < 90) return 'd60_90';
  return 'd90_plus';
}
