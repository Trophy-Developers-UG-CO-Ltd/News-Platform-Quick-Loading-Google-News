/**
 * AppErrorBoundary — catches render-time React errors and displays a
 * friendly recovery screen instead of a blank white page.
 *
 * Wraps the entire application tree in main.jsx.
 * Dynamic sub-routes can add their own nested <RouteErrorBoundary> for
 * more granular recovery (see OfflineFallbackCard for non-fatal cases).
 *
 * @module components/ui/AppErrorBoundary
 */

import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { TriangleAlert, RotateCcw } from 'lucide-react';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center">
        <div className="flex justify-center mb-5 text-amber-400">
          <TriangleAlert size={64} strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Something went wrong
        </h2>
        <p className="text-gray-500 text-sm mb-2 leading-relaxed">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <p className="text-gray-400 text-xs mb-8">
          If you are offline, reconnect and try again. Your unsaved work may
          have been preserved in the local cache.
        </p>
        <button
          onClick={resetErrorBoundary}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold py-3 px-8 rounded-none transition-all"
        >
          <RotateCcw size={16} /> Try Again
        </button>
      </div>
    </div>
  );
}

export default function AppErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
      onError={(error, info) =>
        console.error('[AppErrorBoundary]', error, info)
      }
    >
      {children}
    </ErrorBoundary>
  );
}
