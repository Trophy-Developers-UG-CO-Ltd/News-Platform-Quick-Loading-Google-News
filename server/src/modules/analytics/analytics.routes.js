/**
 * Analytics Routes
 * Public tracking endpoints + admin reporting endpoints
 * @module modules/analytics/analytics.routes
 */

const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const {
  trackProductView,
  trackSearch,
  trackArticleView,
  getTrendingArticles,
  getDashboardSummary,
  getTopProducts,
  getTopSearches,
  getZeroResultSearches,
  getTrafficOverview,
} = require('./analytics.controller');

// Public tracking endpoints (fire-and-forget)
router.post('/product-view/:productId', optionalAuth, trackProductView);
router.post('/search', optionalAuth, trackSearch);
router.post('/track-view', optionalAuth, trackArticleView);
router.get('/trending', getTrendingArticles);

// Admin reporting endpoints
router.get('/dashboard', protect, authorize('admin'), getDashboardSummary);
router.get('/top-products', protect, authorize('admin'), getTopProducts);
router.get('/top-searches', protect, authorize('admin'), getTopSearches);
router.get('/zero-results', protect, authorize('admin'), getZeroResultSearches);
router.get('/traffic', protect, authorize('admin'), getTrafficOverview);

module.exports = router;

// MukonoTalks

