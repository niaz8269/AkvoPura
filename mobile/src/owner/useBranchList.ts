/**
 * useAllBranchStats — fetches the branch list from /branches, then fetches
 * per-branch stats in parallel. Owner-only. Returns an array of summaries
 * plus loading / error state.
 *
 * Refreshes when the screen regains focus so newly-added branches (via the
 * Manage Branches flow) or freshly-logged deliveries show up.
 */

import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { listBranches, type ApiBranch } from '../api/branches';
import { ApiError } from '../api/client';
import { fetchBranchStats, emptyBranchSummary } from './branchStats';
import type { BranchSummary } from './types';

export type BranchesState = {
  branches: ApiBranch[];
  stats: BranchSummary[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
};

export function useAllBranchStats(): BranchesState {
  const [branches, setBranches] = useState<ApiBranch[]>([]);
  const [stats, setStats] = useState<BranchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const list = await listBranches();
      const active = list.filter((b) => b.active);
      setBranches(active);

      // Fetch stats per branch in parallel. If a single branch fails we
      // still show the others with an empty summary — not an error state.
      const results = await Promise.all(
        active.map(async (b) => {
          try {
            return await fetchBranchStats(b.slug, b.name);
          } catch {
            return emptyBranchSummary(b.slug, b.name);
          }
        }),
      );
      setStats(results);
    } catch (e: unknown) {
      const msg =
        e instanceof ApiError
          ? e.code === 'network_error'
            ? 'Cannot reach the server. Check Wi-Fi.'
            : `Server error: ${e.message}`
          : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const refresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  return { branches, stats, loading, refreshing, error, refresh };
}

/** Hook for a single branch overview screen. */
export function useOneBranchStats(slug: string, displayName: string) {
  const [summary, setSummary] = useState<BranchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setSummary(await fetchBranchStats(slug, displayName));
    } catch (e: unknown) {
      const msg =
        e instanceof ApiError
          ? e.code === 'network_error'
            ? 'Cannot reach the server. Check Wi-Fi.'
            : `Server error: ${e.message}`
          : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slug, displayName]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const refresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  return { summary, loading, refreshing, error, refresh };
}
