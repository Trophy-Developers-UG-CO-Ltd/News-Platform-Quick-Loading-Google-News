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
import { TriangleAlert, X } from 'lucide-react';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-light-body px-4 dark:bg-dark-charcoal">
      <div className="w-full max-w-md rounded-2xl border border-dark-border bg-light-surface p-10 text-center shadow-card dark:bg-dark-slate">
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
          className="inline-flex items-center justify-center gap-2 rounded-none bg-black px-8 py-3 font-semibold text-brand-white transition-all hover:bg-[#1f1f1f] active:scale-95 dark:bg-brand-white dark:text-black dark:hover:bg-[#e9e9e9]"
        >
          <X size={16} /> Try Again
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
