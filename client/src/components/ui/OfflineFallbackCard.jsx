/**
 * OfflineFallbackCard — inline placeholder for any section whose live
 * data cannot be loaded offline and has no cached version.
 *
 * Usage:
 *   if (isError && !data) return <OfflineFallbackCard onRetry={refetch} />;
 *
 * @module components/ui/OfflineFallbackCard
 */

import React from 'react';

export default function OfflineFallbackCard({
  title   = 'Content unavailable offline',
  message,
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center gap-3">
      <div className="text-4xl">📡</div>

      <h3 className="font-semibold text-amber-900 text-base">{title}</h3>

      <p className="text-amber-700 text-sm max-w-sm leading-relaxed">
        {message ||
          'You appear to be offline. This section is showing last known data where available.'}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-sm font-medium py-2 px-5 rounded-none transition-all"
        >
          ↺ Retry
        </button>
      )}
    </div>
  );
}
