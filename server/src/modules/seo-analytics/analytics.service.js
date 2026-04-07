/**
 * SEO Analytics service
 * Aggregates SEO performance data from internal data sources.
 * Designed for extension with Google Search Console / Analytics APIs.
 * @module modules/seo-analytics/analytics.service
 */

'use strict';

const SeoMetadata = require('../seo-core/metadata.model');
const seoConfig   = require('../../config/seo.config');

const SeoAnalyticsService = {

  /**
   * Overall SEO health dashboard.
   */
  async getDashboard() {
    const [metaStats, schemaStats, redirectStats, linkStats] = await Promise.allSettled([
      this.getMetadataStats(),
      this.getSchemaStats(),
      this.getRedirectStats(),
      this.getLinkStats(),
    ]);

    return {
      metadata:  metaStats.value  || {},
      schema:    schemaStats.value  || {},
      redirects: redirectStats.value || {},
      links:     linkStats.value    || {},
      generatedAt: new Date().toISOString(),
    };
  },

  async getMetadataStats() {
    const total     = await SeoMetadata.countDocuments({ isActive: true });
    const indexed   = await SeoMetadata.countDocuments({ indexingStatus: 'indexed', isActive: true });
    const noTitle   = await SeoMetadata.countDocuments({ $or: [{ title: null }, { title: '' }], isActive: true });
    const noDesc    = await SeoMetadata.countDocuments({ $or: [{ metaDescription: null }, { metaDescription: '' }], isActive: true });
    const poorScore = await SeoMetadata.countDocuments({ seoScore: { $lt: 50, $ne: null }, isActive: true });
    const goodScore = await SeoMetadata.countDocuments({ seoScore: { $gte: 80 }, isActive: true });

    const avgResult = await SeoMetadata.aggregate([
      { $match: { seoScore: { $ne: null }, isActive: true } },
      { $group: { _id: null, avg: { $avg: '$seoScore' } } },
    ]);

    const byType = await SeoMetadata.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$pageType', count: { $sum: 1 }, avgScore: { $avg: '$seoScore' } } },
    ]);

    // Score distribution
    const distribution = await SeoMetadata.aggregate([
      { $match: { seoScore: { $ne: null }, isActive: true } },
      {
        $bucket: {
          groupBy: '$seoScore',
          boundaries: [0, 40, 60, 80, 101],
          default:    'unknown',
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    return {
      total,
      indexed,
      noTitle,
      noDescription: noDesc,
      poorScore,
      goodScore,
      averageScore: avgResult[0]?.avg ? Math.round(avgResult[0].avg) : 0,
      byType,
      scoreDistribution: distribution,
    };
  },

  async getSchemaStats() {
    let SchemaDoc;
    try { SchemaDoc = require('../seo-schema/schema.model'); } catch { return {}; }

    const total = await SchemaDoc.countDocuments({ isActive: true });
    const byType = await SchemaDoc.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$schemaType', count: { $sum: 1 } } },
    ]);

    return { total, byType };
  },

  async getRedirectStats() {
    let Redirect;
    try { Redirect = require('../seo-redirects/redirect.model'); } catch { return {}; }

    const [total, approved, pending, totalClicks] = await Promise.all([
      Redirect.countDocuments(),
      Redirect.countDocuments({ status: 'approved' }),
      Redirect.countDocuments({ status: 'pending' }),
      Redirect.aggregate([{ $group: { _id: null, total: { $sum: '$clickCount' } } }]),
    ]);

    const topRedirects = await Redirect.find({ status: 'approved' })
      .sort('-clickCount')
      .limit(10)
      .select('fromPath toPath clickCount statusCode')
      .lean();

    return {
      total,
      approved,
      pending,
      totalClicks: totalClicks[0]?.total || 0,
      topRedirects,
    };
  },

  async getLinkStats() {
    let LinkRule;
    try { LinkRule = require('../seo-links/link-rules.model'); } catch { return {}; }

    const total = await LinkRule.countDocuments({ isActive: true });
    const topUsed = await LinkRule.find({ isActive: true })
      .sort('-usageCount')
      .limit(10)
      .select('keyword targetURL usageCount priority')
      .lean();

    return { total, topUsed };
  },

  /**
   * Get top-performing pages (by SEO score).
   */
  async getTopPages(limit = 20) {
    return SeoMetadata.find({ seoScore: { $ne: null }, isActive: true })
      .sort('-seoScore')
      .limit(limit)
      .select('pageSlug pageLabel pageType seoScore readabilityScore updatedAt')
      .lean();
  },

  /**
   * Get pages needing SEO attention.
   */
  async getPagesNeedingAttention(limit = 20) {
    return SeoMetadata.find({
      isActive: true,
      $or: [
        { seoScore: { $lt: 50 } },
        { title:    { $in: [null, ''] } },
        { metaDescription: { $in: [null, ''] } },
      ],
    })
      .sort('seoScore')
      .limit(limit)
      .select('pageSlug pageLabel pageType seoScore title metaDescription')
      .lean();
  },

  /**
   * Score history trend for a specific page.
   */
  async getScoreHistory(pageSlug) {
    const doc = await SeoMetadata.findOne({ pageSlug: pageSlug.toLowerCase() }, 'scoreHistory').lean();
    return doc?.scoreHistory || [];
  },
};

module.exports = SeoAnalyticsService;

// MukonoTalks

