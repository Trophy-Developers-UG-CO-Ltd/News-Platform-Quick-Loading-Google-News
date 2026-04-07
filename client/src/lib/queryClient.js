/**
 * TanStack Query client — offline-first configuration.
 *
 * Key decisions:
 *  - gcTime: 7 days  → cached data is NEVER evicted while the browser tab is
 *    open; the IDB persister also stores it across full page reloads.
 *  - staleTime: 5 min → background refetch only after 5 minutes of silence.
 *  - networkMode: 'offlineFirst' → return the cached value immediately,
 *    attempt a background fetch only when online.
 *  - retry: 0 while offline so we never spin forever.
 *
 * @module lib/queryClient
 */

import { QueryClient }                      from '@tanstack/react-query';
import { createAsyncStoragePersister }      from '@tanstack/query-async-storage-persister';
import { idbQueryStorage }                  from './idb';

// ─── Query Client ────────────────────────────────────────────────────────────

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:           5  * 60 * 1_000,           // 5 minutes
      gcTime:              7  * 24 * 60 * 60 * 1_000, // 7 days
      networkMode:         'offlineFirst',
      refetchOnWindowFocus: true,
      refetchOnReconnect:  'always',
      retry: (failureCount, error) => {
        if (!navigator.onLine)                   return false; // never retry offline
        if (error?.response?.status === 404)     return false;
        if (error?.response?.status === 401)     return false;
        if (error?.response?.status === 403)     return false;
        return failureCount < 2;
      },
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: (failureCount) => {
        if (!navigator.onLine) return false;
        return failureCount < 1;
      },
    },
  },
});

// ─── IDB Persister ───────────────────────────────────────────────────────────

/**
 * Async IndexedDB persister.
 * Cache key includes app version so a new deploy busts the stored cache.
 */
export const idbPersister = createAsyncStoragePersister({
  storage:      idbQueryStorage,
  throttleTime: 1_000, // debounce IDB writes by 1 s (reduces write amplification)
  key:          'MUKONOTALKS_QUERY_CACHE_v1',
});
