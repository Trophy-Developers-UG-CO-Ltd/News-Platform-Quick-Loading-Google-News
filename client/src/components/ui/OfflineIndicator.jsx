/**
 * OfflineIndicator — a compact floating pill anchored to the bottom-center
 * of the viewport. Only visible when the browser is offline.
 *
 * Shows:
 *   • An animated amber dot
 *   • "Offline – cached content" label
 *   • "Last synced X min ago" timestamp (updates every 30 s)
 *
 * Pairs with useOfflineStatus which handles toast notifications for
 * connectivity change events.
 *
 * @module components/ui/OfflineIndicator
 */

import React, { useState, useEffect } from 'react';
import { useOfflineStatus }           from '../../hooks/useOfflineStatus';

function formatTimeSince(timestamp) {
  if (!timestamp) return null;
  const diffSec = Math.floor((Date.now() - timestamp) / 1_000);
  if (diffSec < 60)   return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export default function OfflineIndicator() {
  const { isOnline, lastOnlineAt } = useOfflineStatus();
  const [, forceUpdate] = useState(0);

  // Re-render every 30 s so the "last synced" text stays current
  useEffect(() => {
    if (isOnline) return;
    const id = setInterval(() => forceUpdate((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [isOnline]);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-2.5 bg-gray-900/95 backdrop-blur-sm text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-2xl ring-1 ring-white/10 select-none"
    >
      {/* Animated connectivity dot */}
      <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
      </span>

      <span>Offline — cached content</span>

      {lastOnlineAt && (
        <span className="text-gray-400">
          · last synced {formatTimeSince(lastOnlineAt)}
        </span>
      )}
    </div>
  );
}
