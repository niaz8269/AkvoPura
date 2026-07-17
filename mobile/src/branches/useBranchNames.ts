/**
 * useBranchNames — lightweight branch-slug → display-name resolver.
 *
 * Fetches /branches once per app session and caches in module scope so
 * every consumer (PDF headers, screen titles, receipts) can turn a slug
 * like "peshawar" into "Peshawar" without hardcoding a switch statement.
 *
 * Fallback: title-cases the slug when the server hasn't answered yet.
 */

import { useEffect, useState } from 'react';

import { listBranches, type ApiBranch } from '../api/branches';

// Module-scoped cache — one fetch per app session unless invalidated.
let cache: ApiBranch[] | null = null;
let inflight: Promise<ApiBranch[]> | null = null;

async function loadBranches(): Promise<ApiBranch[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = listBranches()
    .then((rows) => {
      cache = rows;
      inflight = null;
      return rows;
    })
    .catch((e) => {
      inflight = null;
      throw e;
    });
  return inflight;
}

/** Force a refresh — call after Owner adds a new branch. */
export function invalidateBranchesCache() {
  cache = null;
}

function titleCase(slug: string): string {
  if (!slug) return '';
  return slug
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(' ');
}

/** Hook: returns a function that maps slug → name. Names come from the
 *  cached branches list; unknown slugs fall back to title-cased slug. */
export function useBranchName() {
  const [, force] = useState(0);

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    loadBranches()
      .then(() => {
        if (!cancelled) force((n) => n + 1);
      })
      .catch(() => {
        // Silent — fallback is title-case; not worth alerting.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (slug: string | null | undefined): string => {
    if (!slug) return '';
    const hit = cache?.find((b) => b.slug === slug);
    return hit?.name ?? titleCase(slug);
  };
}
