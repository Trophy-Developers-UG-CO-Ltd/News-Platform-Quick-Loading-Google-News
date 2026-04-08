/**
 * App entry point for the publishing platform.
 *
 * Provider stack (outer → inner):
 *   AppErrorBoundary           — catches render crashes, shows recovery UI
 *   PersistQueryClientProvider — restores TanStack Query cache from IndexedDB
 *   Provider (Redux)           — global app state
 *   HelmetProvider             — <head> / SEO management
 *   BrowserRouter              — client-side routing
 *
 * @module index
 */

import React                          from 'react';
import ReactDOM                        from 'react-dom/client';
import { BrowserRouter }              from 'react-router-dom';
import { Provider }                   from 'react-redux';
import { HelmetProvider }            from 'react-helmet-async';
import { Toaster }                    from 'react-hot-toast';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import App                     from './App';
import store                  from './app/store';
import { queryClient, idbPersister } from './lib/queryClient';
import AppErrorBoundary        from './components/ui/AppErrorBoundary';
import './styles/index.css';
import './i18n'; // Initialize i18n before rendering

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: idbPersister,
          maxAge:    7 * 24 * 60 * 60 * 1_000, // 7 days
          buster:    import.meta.env.VITE_APP_VERSION ?? '1',
          onSuccess: () => {
            // Resume any mutations that were paused while offline
            queryClient.resumePausedMutations();
          },
        }}
      >
        <Provider store={store}>
          <HelmetProvider>
            <BrowserRouter>
              <App />
              <Toaster position="top-right" toastOptions={{ duration: 4_000 }} />
            </BrowserRouter>
          </HelmetProvider>
        </Provider>
      </PersistQueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);

// MukonoTalks

