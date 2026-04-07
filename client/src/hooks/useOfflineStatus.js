/**
 * useOfflineStatus — detects online/offline transitions and emits
 * react-hot-toast notifications on each change.
 *
 * Also persists the time of the last successful online moment to
 * localStorage so OfflineIndicator can display "last synced X min ago"
 * across page reloads.
 *
 * @module hooks/useOfflineStatus
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const LAST_ONLINE_KEY = 'mukonoTalks_lastOnlineAt';

function readLastOnlineAt() {
  try {
    const stored = localStorage.getItem(LAST_ONLINE_KEY);
    return stored ? parseInt(stored, 10) : (navigator.onLine ? Date.now() : null);
  } catch {
    return null;
  }
}

function writeLastOnlineAt(ts) {
  try {
    localStorage.setItem(LAST_ONLINE_KEY, String(ts));
  } catch { /* ignore quota errors */ }
}

/**
 * @returns {{ isOnline: boolean, lastOnlineAt: number | null }}
 */
export function useOfflineStatus() {
  const [isOnline,     setIsOnline]     = useState(() => navigator.onLine);
  const [lastOnlineAt, setLastOnlineAt] = useState(readLastOnlineAt);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const now = Date.now();
      setLastOnlineAt(now);
      writeLastOnlineAt(now);
      // Dismiss any lingering offline toast, then show a brief success message
      toast.dismiss('offline-status');
      toast.success('Back online — syncing latest data', {
        id:       'online-status',
        duration: 3_500,
        icon:     '🟢',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline — showing cached content', {
        id:       'offline-status',
        duration: Infinity,  // persists until dismissed or back online
        icon:     '📡',
      });
    };

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, lastOnlineAt };
}
