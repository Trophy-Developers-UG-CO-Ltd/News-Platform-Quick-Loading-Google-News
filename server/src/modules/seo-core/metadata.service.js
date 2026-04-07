/**
 * SEO Metadata service
 * Business logic for per-page SEO metadata CRUD.
 * Aggregate/stats methods live in metadata.stats.js.
 * @module modules/seo-core/metadata.service
 */

'use strict';

const SeoMetadata = require('./metadata.model');
const MetadataStats = require('./metadata.stats');
const seoConfig   = require('../../config/seo.config');

function buildRobotsString(robots = {}) {
  const parts = [];
  parts.push(robots.index  === false ? 'noindex'  : 'index');
  parts.push(robots.follow === false ? 'nofollow' : 'follow');
  if (robots.nosnippet)    parts.push('nosnippet');
  if (robots.noarchive)    parts.push('noarchive');
  if (robots.noimageindex) parts.push('noimageindex');
  if (robots.maxSnippet != null && robots.maxSnippet !== -1) parts.push(`max-snippet:${robots.maxSnippet}`);
  if (robots.maxImagePreview && robots.maxImagePreview !== 'large') parts.push(`max-image-preview:${robots.maxImagePreview}`);
  return parts.join(', ');
}

const MetadataService = {
  async getAll({ page = 1, limit = 20, pageType, search, sort = '-updatedAt' } = {}) {
    const filter = { isActive: true };
    if (pageType) filter.pageType = pageType;
    if (search) {
      filter.$or = [
        { pageSlug:  { $regex: search, $options: 'i' } },
        { pageLabel: { $regex: search, $options: 'i' } },
        { title:     { $regex: search, $options: 'i' } },
      ];
    }
    const skip  = (page - 1) * limit;
    const total = await SeoMetadata.countDocuments(filter);
    const items = await SeoMetadata.find(filter)
      .sort(sort).skip(skip).limit(limit)
      .populate('updatedBy', 'name email')
      .lean({ virtuals: true });
    return { items, total, page, pages: Math.ceil(total / limit) };
  },

  async getBySlug(pageSlug) {
    return SeoMetadata.findOne({ pageSlug: pageSlug.toLowerCase(), isActive: true }).lean({ virtuals: true }) || null;
  },

  async getByResource(resourceId, resourceModel) {
    return SeoMetadata.findOne({ resourceId, resourceModel, isActive: true }).lean({ virtuals: true });
  },

  async upsert(pageSlug, data, userId) {
    const slug = pageSlug.toLowerCase().trim();
    const existing = await SeoMetadata.findOne({ pageSlug: slug });
    if (existing) {
      if (data.seoScore !== undefined && data.seoScore !== existing.seoScore) {
        existing.scoreHistory.push({ score: data.seoScore, readability: data.readabilityScore ?? existing.readabilityScore, recordedAt: new Date() });
        if (existing.scoreHistory.length > 30) existing.scoreHistory = existing.scoreHistory.slice(-30);
      }
      Object.assign(existing, data);
      existing.updatedBy = userId;
      return existing.save();
    }
    return SeoMetadata.create({ pageSlug: slug, ...data, updatedBy: userId });
  },

  async delete(pageSlug) {
    return SeoMetadata.findOneAndDelete({ pageSlug: pageSlug.toLowerCase() });
  },

  async updateScores(pageSlug, seoScore, readabilityScore, userId) {
    await SeoMetadata.findOneAndUpdate(
      { pageSlug: pageSlug.toLowerCase() },
      {
        $set: { seoScore, readabilityScore, lastAnalyzedAt: new Date(), updatedBy: userId },
        $push: { scoreHistory: { $each: [{ score: seoScore, readability: readabilityScore, recordedAt: new Date() }], $slice: -30 } },
      },
      { upsert: false }
    );
  },

  serpPreview(meta) {
    const url = `${seoConfig.siteUrl}${meta.pageSlug}`;
    return {
      url,
      displayUrl: url.replace(/^https?:\/\//, ''),
      title:       meta.title || '',
      description: meta.metaDescription || '',
      robots:      buildRobotsString(meta.robots),
      titleLength: meta.title ? meta.title.length : 0,
      descLength:  meta.metaDescription ? meta.metaDescription.length : 0,
      titleStatus: (() => { const l = meta.title?.length ?? 0; return l < seoConfig.meta.titleMin ? 'too_short' : l > seoConfig.meta.titleMax ? 'too_long' : 'good'; })(),
      descStatus:  (() => { const l = meta.metaDescription?.length ?? 0; return l < seoConfig.meta.descriptionMin ? 'too_short' : l > seoConfig.meta.descriptionMax ? 'too_long' : 'good'; })(),
    };
  },

  // Delegate stats methods
  getDashboardStats: () => MetadataStats.getDashboardStats(),
  getPoorScorePages: (t) => MetadataStats.getPoorScorePages(t),
  autoFillCanonicals: () => MetadataStats.autoFillCanonicals(),
};

module.exports = MetadataService;

// MukonoTalks

