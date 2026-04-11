/**
 * Not Found (404) page
 * Checks for approved redirects before showing 404.
 * If a redirect exists for the current path, auto-navigates and tracks the click.
 * @module pages/NotFound
 */

import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiLoader } from 'react-icons/fi';
import redirectService from '../features/redirects/redirectService';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const fromPath = location.pathname;
    let cancelled = false;

    redirectService
      .resolve(fromPath)
      .then((data) => {
        if (cancelled) return;
        if (data?.redirect?.toPath) {
          // Track click (fire-and-forget)
          redirectService.trackClick(fromPath);
          // Navigate to the new path, replacing history entry
          navigate(data.redirect.toPath, { replace: true });
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        if (!cancelled) setChecking(false);
      });

    return () => { cancelled = true; };
  }, [location.pathname, navigate]);

  if (checking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-gray-400">
        <FiLoader className="h-8 w-8 animate-spin" />
        <p className="text-sm">Checking for redirect…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-primary-200">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mt-4">Page Not Found</h2>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-black bg-black px-5 py-2.5 font-semibold text-white transition hover:bg-black/90 dark:border-white dark:bg-white dark:text-black dark:hover:bg-neutral-100"
        >
          <FiHome className="h-5 w-5" /> Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

// MukonoTalks

