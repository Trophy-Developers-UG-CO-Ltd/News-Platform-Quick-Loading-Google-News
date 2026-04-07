/**
 * Analytics Service
 * Business intelligence data collection and reporting
 * @module modules/analytics/analytics.service
 */

const { ProductView, SearchTerm, PageView } = require('./analytics.model');
const logger = require('../../utils/logger');

class AnalyticsService {
  /**
   * Track a product view (fire-and-forget)
   */
  static async trackProductView(productId, { user = null, sessionId = null, ip = null } = {}) {
    try {
      await ProductView.create({
        product: productId,
        user: user?._id || null,
        sessionId,
        ipAddress: ip,
      });
    } catch (error) {
      logger.error('Failed to track product view:', error.message);
    }
  }

  /**
   * Track a search query (fire-and-forget)
   */
  static async trackSearch(term, { resultsCount = 0, user = null, filters = {}, language = 'en' } = {}) {
    try {
      await SearchTerm.create({
        term,
        normalizedTerm: term.toLowerCase().trim(),
        resultsCount,
        user: user?._id || null,
        filters,
        language,
      });
    } catch (error) {
      logger.error('Failed to track search:', error.message);
    }
  }

  /**
   * Track a page view
   */
  static async trackPageView(path, { user = null, sessionId = null, referrer = null, language = 'en' } = {}) {
    try {
      await PageView.create({
        path,
        user: user?._id || null,
        sessionId,
        referrer,
        language,
      });
    } catch (error) {
      logger.error('Failed to track page view:', error.message);
    }
  }

  /**
   * Get top viewed products (last N days)
   */
  static async getTopViewedProducts(days = 30, limit = 20) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const results = await ProductView.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$product', views: { $sum: 1 }, uniqueUsers: { $addToSet: '$user' } } },
      { $addFields: { uniqueViews: { $size: '$uniqueUsers' } } },
      { $sort: { views: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 1,
          views: 1,
          uniqueViews: 1,
          'product.title': 1,
          'product.slug': 1,
          'product.category': 1,
        },
      },
    ]);

    return results;
  }

  /**
   * Get top search terms (last N days)
   */
  static async getTopSearchTerms(days = 30, limit = 50) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const results = await SearchTerm.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: '$normalizedTerm',
          count: { $sum: 1 },
          avgResults: { $avg: '$resultsCount' },
          zeroResultCount: {
            $sum: { $cond: [{ $eq: ['$resultsCount', 0] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    return results;
  }

  /**
   * Get zero-result searches (potential product gaps)
   */
  static async getZeroResultSearches(days = 30, limit = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const results = await SearchTerm.aggregate([
      { $match: { createdAt: { $gte: since }, resultsCount: 0 } },
      { $group: { _id: '$normalizedTerm', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    return results;
  }

  /**
   * Get traffic analytics (views per day over period)
   */
  static async getTrafficOverview(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [productViews, pageViews, searches] = await Promise.all([
      ProductView.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      PageView.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      SearchTerm.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return { productViews, pageViews, searches };
  }

  /**
   * Get dashboard BI summary
   */
  static async getDashboardSummary(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [totalProductViews, totalSearches, totalPageViews, topProducts, topSearches] =
      await Promise.all([
        ProductView.countDocuments({ createdAt: { $gte: since } }),
        SearchTerm.countDocuments({ createdAt: { $gte: since } }),
        PageView.countDocuments({ createdAt: { $gte: since } }),
        AnalyticsService.getTopViewedProducts(days, 5),
        AnalyticsService.getTopSearchTerms(days, 10),
      ]);

    return {
      period: `${days} days`,
      totalProductViews,
      totalSearches,
      totalPageViews,
      topProducts,
      topSearches,
    };
  }
}

module.exports = AnalyticsService;

// MukonoTalks

