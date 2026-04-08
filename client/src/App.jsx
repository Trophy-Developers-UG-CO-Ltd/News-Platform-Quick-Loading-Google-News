import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import AppRoutes from './app/routes';
import AdSenseScript from './components/ads/AdSenseScript';
import ThemeToggle from './components/ui/ThemeToggle';
import useThemeMode from './hooks/useThemeMode';

const App = () => {
  const { pathname } = useLocation();
  const isHomeRoute = pathname === '/';
  const { isDarkMode, toggleTheme } = useThemeMode();

  return (
    <div className="flex min-h-screen w-full max-w-full flex-col bg-light-body text-text-light-primary dark:bg-dark-charcoal dark:text-text-dark-primary">
      <AdSenseScript />
      {!isHomeRoute && (
        <header className="sticky top-0 z-40 border-b border-dark-border bg-dark-black/95 backdrop-blur-xs">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
            <Link to="/" className="font-display text-lg font-black tracking-tight text-brand-white">
              MukonoTalks
            </Link>
            <div className="flex items-center gap-4">
              <nav className="flex items-center gap-4 text-sm font-bold text-brand-white">
                <Link to="/news" className="transition-colors hover:text-light-muted">News</Link>
                <Link to="/entertainment" className="transition-colors hover:text-light-muted">Entertainment</Link>
                <Link to="/local" className="transition-colors hover:text-light-muted">Local Updates</Link>
                <Link to="/videos" className="transition-colors hover:text-light-muted">Videos</Link>
                <Link to="/editor" className="transition-colors hover:text-light-muted">Editorial CMS</Link>
              </nav>
              <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
            </div>
          </div>
        </header>
      )}
      <main className="flex-grow">
        <AppRoutes />
      </main>
      {!isHomeRoute && (
        <footer className="border-t border-dark-border bg-dark-black">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-brand-white">
            MukonoTalks · Fast local publishing platform for Mukono-focused stories.
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;

// MukonoTalks:  //  Designed by Trophy Developers Uganda : https://www.trophydevelopers.com/uganda-web-designers/

