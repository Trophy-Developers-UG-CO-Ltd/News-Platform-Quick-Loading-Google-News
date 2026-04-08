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
    <div className="flex min-h-screen items-center justify-center bg-dark-charcoal px-4">
      <div className="w-full max-w-md rounded-2xl border border-dark-border bg-dark-slate p-10 text-center shadow-card">
        <div className="mb-5 flex justify-center text-accent-orange">
          <TriangleAlert size={64} strokeWidth={1.5} />
        </div>
        <h2 className="mb-3 font-display text-2xl font-bold text-text-primary">
          Something went wrong
        </h2>
        <p className="mb-2 text-sm leading-relaxed text-text-secondary">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <p className="mb-8 text-xs text-text-muted">
          If you are offline, reconnect and try again. Your unsaved work may
          have been preserved in the local cache.
        </p>
        <button
          onClick={resetErrorBoundary}
          className="inline-flex items-center justify-center gap-2 rounded-none bg-accent-blue px-8 py-3 font-semibold text-text-primary transition-all hover:bg-category-news active:scale-95"
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
