/**
 * Analytics Controller
 * Admin endpoints for business intelligence data
 * @module modules/analytics/analytics.controller
 */

const AnalyticsService = require('./analytics.service');
const { asyncHandler } = require('../../middlewares/error.middleware');

/**
 * @route POST /api/analytics/product-view/:productId
 * @desc Track a product view (public, fire-and-forget)
 * @access Public
 */
const trackProductView = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip;
  const sessionId = req.headers['x-session-id'] || null;

  // Fire and forget — don't block the response
  AnalyticsService.trackProductView(productId, {
    user: req.user || null,
    sessionId,
    ip,
  });

  res.status(202).json({ success: true });
});

/**
 * @route POST /api/analytics/search
 * @desc Track a search query (public, fire-and-forget)
 * @access Public
 */
const trackSearch = asyncHandler(async (req, res) => {
  const { term, resultsCount, filters, language } = req.body;

  AnalyticsService.trackSearch(term, {
    resultsCount,
    user: req.user || null,
    filters,
    language,
  });

  res.status(202).json({ success: true });
});

/**
 * @route POST /api/v1/track-view
 * @desc Track a published article view
 * @access Public
 */
const trackArticleView = asyncHandler(async (req, res) => {
  try {
    const { articleId, sessionId = null, fingerprint = null } = req.body || {};
    const result = await AnalyticsService.trackArticleView(articleId, req, {
      sessionId,
      fingerprint,
    });
    res.status(200).json({ success: true, message: 'View tracked', ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/v1/trending
 * @desc Get trending published articles
 * @access Public
 */
const getTrendingArticles = asyncHandler(async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const articles = await AnalyticsService.getTrendingArticles(limit);
    res.json({ success: true, count: articles.length, articles });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/analytics/dashboard
 * @desc Get analytics dashboard summary
 * @access Admin
 */
const getDashboardSummary = asyncHandler(async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await AnalyticsService.getDashboardSummary(days);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/analytics/top-products
 * @desc Get most viewed products
 * @access Admin
 */
const getTopProducts = asyncHandler(async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const data = await AnalyticsService.getTopViewedProducts(days, limit);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/analytics/top-searches
 * @desc Get most popular search terms
 * @access Admin
 */
const getTopSearches = asyncHandler(async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const data = await AnalyticsService.getTopSearchTerms(days, limit);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/analytics/zero-results
 * @desc Get search terms with zero results (product gaps)
 * @access Admin
 */
const getZeroResultSearches = asyncHandler(async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await AnalyticsService.getZeroResultSearches(days);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/analytics/traffic
 * @desc Get traffic overview (daily breakdown)
 * @access Admin
 */
const getTrafficOverview = asyncHandler(async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await AnalyticsService.getTrafficOverview(days);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

module.exports = {
  trackProductView,
  trackSearch,
  trackArticleView,
  getTrendingArticles,
  getDashboardSummary,
  getTopProducts,
  getTopSearches,
  getZeroResultSearches,
  getTrafficOverview,
};

// MukonoTalks

