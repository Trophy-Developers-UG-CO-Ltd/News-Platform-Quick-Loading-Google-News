/**
 * Redux store configuration for the publishing platform.
 *
 * Only active publishing and editorial slices are mounted here.
 * Legacy commerce reducers have been removed from the runtime store.
 *
 * @module app/store
 */

import { configureStore } from '@reduxjs/toolkit';

import authReducer        from '../features/auth/authSlice';
import adminReducer       from '../features/admin/adminSlice';
import pageReducer        from '../features/pages/pageSlice';
import articleReducer     from '../features/articles/articleSlice';
import navReducer         from '../features/nav/navSlice';
import footerReducer      from '../features/footer/footerSlice';
import seoReducer         from '../features/seo/seoSlice';
import redirectReducer    from '../features/redirects/redirectSlice';
import seoDashboardReducer from '../features/seo-dashboard/seoDashboardSlice';
import brandingReducer    from '../features/branding/brandingSlice';
import maintenanceReducer from '../features/maintenance/maintenanceSlice';

const store = configureStore({
  reducer: {
    auth:         authReducer,
    admin:        adminReducer,
    pages:        pageReducer,
    articles:     articleReducer,
    nav:          navReducer,
    footer:       footerReducer,
    seo:          seoReducer,
    redirects:    redirectReducer,
    seoDashboard: seoDashboardReducer,
    branding:     brandingReducer,
    maintenance:  maintenanceReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;

// MukonoTalks

