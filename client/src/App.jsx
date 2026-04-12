import React, { Suspense, lazy, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import AppRoutes from './app/routes';
import AdSenseScript from './components/ads/AdSenseScript';
import Footer from './components/layout/Footer';
import PremiumSiteHeader from './components/layout/PremiumSiteHeader';
import PremiumSiteFooter from './components/layout/PremiumSiteFooter';
import CookieConsent from './components/ui/CookieConsent';
import Spinner from './components/ui/Spinner';
import { loadUser } from './features/auth/authSlice';
import { fetchMaintenanceStatus } from './features/maintenance/maintenanceSlice';

const MAINTENANCE_BYPASS_PATHS = new Set(['/login', '/mukono11login', '/maintenance']);
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));
let appBootstrapRequested = false;

const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, isLoading: isAuthLoading } = useSelector((state) => state.auth);
  const {
    isEnabled: isMaintenanceEnabled,
    isLoading: isMaintenanceLoading,
    hasLoaded: hasMaintenanceLoaded,
  } = useSelector((state) => state.maintenance);

  useEffect(() => {
    if (appBootstrapRequested) return;
    appBootstrapRequested = true;
    dispatch(loadUser());
    dispatch(fetchMaintenanceStatus());
  }, [dispatch]);

  if (isAuthLoading || !hasMaintenanceLoaded || isMaintenanceLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-body text-text-light-primary dark:bg-dark-charcoal dark:text-text-dark-primary">
        <Spinner size="lg" />
      </div>
    );
  }

  const isDeveloper = user?.role === 'developer';
  const isBypassedPath = MAINTENANCE_BYPASS_PATHS.has(location.pathname);
  const isAdminRoute = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  if (isMaintenanceEnabled && !isDeveloper && !isBypassedPath) {
    return (
      <Suspense
        fallback={(
          <div className="flex min-h-screen items-center justify-center bg-light-body text-text-light-primary dark:bg-dark-charcoal dark:text-text-dark-primary">
            <Spinner size="lg" />
          </div>
        )}
      >
        <MaintenancePage />
      </Suspense>
    );
  }

  return (
    <div className="flex min-h-screen w-full max-w-full flex-col bg-light-body text-text-light-primary dark:bg-dark-charcoal dark:text-text-dark-primary">
      <AdSenseScript />
      {!isAdminRoute ? <PremiumSiteHeader /> : null}
      <main className="flex-grow">
        <AppRoutes />
      </main>
      {!isAdminRoute ? <Footer /> : null}
      {!isAdminRoute ? <PremiumSiteFooter /> : null}
      {!isAdminRoute ? <CookieConsent /> : null}
    </div>
  );
};

export default App;

// MukonoTalks:  //  Designed by Trophy Developers Uganda : https://www.trophydevelopers.com/uganda-web-designers/
