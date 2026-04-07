/**
 * IndexedDB helpers — offline-first data persistence layer.
 * Uses the `idb` library for a promise-based IndexedDB API.
 *
 * Two object stores:
 *   tanstack-query  — serialised TanStack Query cache (used by the async persister)
 *   offline-pages   — last-known CMS page payloads keyed by slug
 *
 * @module lib/idb
 */

import { openDB } from 'idb';

const DB_NAME    = 'mukonoTalksCMS';
const DB_VERSION = 1;

const QUERY_STORE = 'tanstack-query';
const PAGES_STORE = 'offline-pages';

let _db = null;

async function getDb() {
  if (!_db) {
    _db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(QUERY_STORE)) {
          db.createObjectStore(QUERY_STORE);
        }
        if (!db.objectStoreNames.contains(PAGES_STORE)) {
          db.createObjectStore(PAGES_STORE, { keyPath: 'slug' });
        }
      },
    });
  }
  return _db;
}

/**
 * Async storage adapter compatible with
 * @tanstack/query-async-storage-persister.
 */
export const idbQueryStorage = {
  getItem: async (key) => {
    try {
      const db  = await getDb();
      const raw = await db.get(QUERY_STORE, key);
      return raw ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      const db = await getDb();
      await db.put(QUERY_STORE, value, key);
    } catch {
      /* silently ignore storage errors (private browsing quota) */
    }
  },
  removeItem: async (key) => {
    try {
      const db = await getDb();
      await db.delete(QUERY_STORE, key);
    } catch {
      /* ignore */
    }
  },
};

/**
 * Persist last-known page data so dynamic CMS pages can render offline.
 * @param {string} slug   - URL slug / cache key
 * @param {*}      data   - API response payload
 */
export async function savePageOffline(slug, data) {
  try {
    const db = await getDb();
    await db.put(PAGES_STORE, { slug, data, savedAt: Date.now() });
  } catch { /* ignore */ }
}

/**
 * Retrieve last-known page data.
 * Returns null if not cached.
 * @param {string} slug
 * @returns {{ slug: string, data: *, savedAt: number } | null}
 */
export async function getPageOffline(slug) {
  try {
    const db = await getDb();
    return (await db.get(PAGES_STORE, slug)) ?? null;
  } catch {
    return null;
  }
}
