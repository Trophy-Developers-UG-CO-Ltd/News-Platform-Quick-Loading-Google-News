import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import AppRoutes from './app/routes';
import AdSenseScript from './components/ads/AdSenseScript';
import PremiumSiteHeader from './components/layout/PremiumSiteHeader';
import PremiumSiteFooter from './components/layout/PremiumSiteFooter';
import { loadUser } from './features/auth/authSlice';

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <div className="flex min-h-screen w-full max-w-full flex-col bg-light-body text-text-light-primary dark:bg-dark-charcoal dark:text-text-dark-primary">
      <AdSenseScript />
      <PremiumSiteHeader />
      <main className="flex-grow">
        <AppRoutes />
      </main>
      <PremiumSiteFooter />
    </div>
  );
};

export default App;

// MukonoTalks:  //  Designed by Trophy Developers Uganda : https://www.trophydevelopers.com/uganda-web-designers/

