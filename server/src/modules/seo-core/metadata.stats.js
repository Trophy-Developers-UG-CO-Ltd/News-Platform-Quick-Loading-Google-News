/**
 * SEO Metadata Stats
 * Dashboard-oriented aggregate queries: overall stats, score distribution,
 * poor-score pages, and canonical backfill utility.
 * @module modules/seo-core/metadata.stats
 */

'use strict';

const SeoMetadata = require('./metadata.model');
const seoConfig   = require('../../config/seo.config');

const MetadataStats = {
  /**
   * Get dashboard summary stats.
   */
  async getDashboardStats() {
    const [total, indexed, withScore, poorScore, noMeta] = await Promise.all([
      SeoMetadata.countDocuments({ isActive: true }),
      SeoMetadata.countDocuments({ indexingStatus: 'indexed', isActive: true }),
      SeoMetadata.countDocuments({ seoScore: { $exists: true, $ne: null }, isActive: true }),
      SeoMetadata.countDocuments({ seoScore: { $lt: 50 }, isActive: true }),
      SeoMetadata.countDocuments({
        $or: [{ title: { $in: [null, ''] } }, { metaDescription: { $in: [null, ''] } }],
        isActive: true,
      }),
    ]);

    const avgScoreResult = await SeoMetadata.aggregate([
      { $match: { seoScore: { $ne: null }, isActive: true } },
      { $group: { _id: null, avg: { $avg: '$seoScore' } } },
    ]);

    const byType = await SeoMetadata.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$pageType', count: { $sum: 1 }, avgScore: { $avg: '$seoScore' } } },
    ]);

    return {
      total, indexed, withScore, poorScore, noMeta,
      averageScore: avgScoreResult[0]?.avg ? Math.round(avgScoreResult[0].avg) : 0,
      byType,
    };
  },

  /**
   * Get pages with poor SEO scores (for dashboard alerts).
   */
  async getPoorScorePages(threshold = 50) {
    return SeoMetadata.find({ seoScore: { $lt: threshold }, isActive: true })
      .sort('seoScore')
      .limit(50)
      .lean();
  },

  /**
   * Bulk generate canonical URLs for records missing them.
   */
  async autoFillCanonicals() {
    const missing = await SeoMetadata.find({ canonical: { $in: [null, ''] }, isActive: true });
    const ops = missing.map(doc => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { canonical: `${seoConfig.siteUrl}${doc.pageSlug}` } },
      },
    }));
    if (ops.length) await SeoMetadata.bulkWrite(ops);
    return ops.length;
  },
};

module.exports = MetadataStats;

// MukonoTalks

