import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import AppRoutes from './app/routes';
import AdSenseScript from './components/ads/AdSenseScript';

const App = () => {
  const { pathname } = useLocation();
  const isHomeRoute = pathname === '/';

  return (
    <div className="flex min-h-screen w-full max-w-full flex-col bg-gray-50 text-gray-900">
      <AdSenseScript />
      {!isHomeRoute && (
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
            <Link to="/" className="text-lg font-bold tracking-tight text-gray-900">
              MukonoTalks
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-gray-600">
              <Link to="/news" className="hover:text-primary-700">News</Link>
              <Link to="/entertainment" className="hover:text-primary-700">Entertainment</Link>
              <Link to="/local" className="hover:text-primary-700">Local Updates</Link>
              <Link to="/videos" className="hover:text-primary-700">Videos</Link>
              <Link to="/editor" className="hover:text-primary-700">Editorial CMS</Link>
            </nav>
          </div>
        </header>
      )}
      <main className="flex-grow">
        <AppRoutes />
      </main>
      {!isHomeRoute && (
        <footer className="border-t border-gray-200 bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-gray-600">
            MukonoTalks · Fast local publishing platform for Mukono-focused stories.
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;

// MukonoTalks

