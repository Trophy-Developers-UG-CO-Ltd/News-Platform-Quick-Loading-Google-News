/**
 * useOfflineAwareQuery — thin wrapper around TanStack Query's useQuery that:
 *
 *  1. Never retries while offline (avoids infinite spinner).
 *  2. Returns `isOfflineData: true` when returning stale cache without a
 *     fresh network response, so UI can show a small "cached" badge.
 *  3. Keeps staleTime = Infinity while offline so the cached value is
 *     considered fresh and the query does not automatically refetch on mount.
 *
 * @module hooks/useOfflineAwareQuery
 */

import { useQuery } from '@tanstack/react-query';

/**
 * @template TData
 * @param {import('@tanstack/react-query').QueryKey}     queryKey
 * @param {() => Promise<TData>}                        queryFn
 * @param {import('@tanstack/react-query').UseQueryOptions<TData>} [options]
 * @returns {import('@tanstack/react-query').UseQueryResult<TData> & { isOfflineData: boolean }}
 */
export function useOfflineAwareQuery(queryKey, queryFn, options = {}) {
  const online = navigator.onLine;

  const result = useQuery({
    queryKey,
    queryFn,
    ...options,
    // While offline: never retry and treat cached data as eternally fresh
    retry:     online ? (options.retry  ?? 2)      : false,
    staleTime: online ? (options.staleTime ?? 5 * 60 * 1_000) : Infinity,
  });

  return {
    ...result,
    // True when we are offline but still have a previously cached value
    isOfflineData: !online && result.data !== undefined,
  };
}
