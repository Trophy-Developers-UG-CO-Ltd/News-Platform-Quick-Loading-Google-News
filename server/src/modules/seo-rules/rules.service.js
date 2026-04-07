/**
 * SEO Rules service
 * Automation engine: applies rules to page metadata on publish/update events.
 * @module modules/seo-rules/rules.service
 */

'use strict';

const SeoRule    = require('./rules.model');
const seoConfig  = require('../../config/seo.config');

// ─── Seed default rules ────────────────────────────────────────

const DEFAULT_RULES = [
  {
    name:        'Product pages: auto schema + sitemap',
    description: 'Automatically apply Product schema and add to sitemap',
    pageType:    'product',
    actions: {
      generateSchema:    'Product',
      generateSitemap:   true,
      autoCanonical:     true,
      defaultChangeFreq: 'weekly',
      defaultPriority:   0.8,
      autoIndex:         false,
      defaultRobots:     { index: true, follow: true },
    },
    priority: 10,
  },
  {
    name:        'Article pages: Article schema + sitemap',
    description: 'Automatically apply Article schema and add to sitemap',
    pageType:    'article',
    actions: {
      generateSchema:    'Article',
      generateSitemap:   true,
      autoCanonical:     true,
      defaultChangeFreq: 'weekly',
      defaultPriority:   0.7,
      autoIndex:         false,
      defaultRobots:     { index: true, follow: true },
    },
    priority: 9,
  },
  {
    name:        'Category pages: CollectionPage schema',
    description: 'Automatically apply CollectionPage schema',
    pageType:    'category',
    actions: {
      generateSchema:    'CollectionPage',
      generateSitemap:   true,
      autoCanonical:     true,
      defaultChangeFreq: 'weekly',
      defaultPriority:   0.7,
      defaultRobots:     { index: true, follow: true },
    },
    priority: 8,
  },
  {
    name:        'Home page: WebPage + highest priority',
    description: 'Set home page SEO defaults',
    pageType:    'home',
    actions: {
      generateSchema:    'WebPage',
      generateSitemap:   true,
      autoCanonical:     true,
      defaultChangeFreq: 'daily',
      defaultPriority:   1.0,
      defaultRobots:     { index: true, follow: true },
    },
    priority: 10,
  },
  {
    name:        'Job pages: JobPosting schema',
    description: 'Auto apply JobPosting schema',
    pageType:    'job',
    actions: {
      generateSchema:    'JobPosting',
      generateSitemap:   true,
      autoCanonical:     true,
      defaultChangeFreq: 'daily',
      defaultPriority:   0.7,
      defaultRobots:     { index: true, follow: true },
    },
    priority: 7,
  },
  {
    name:        'Event pages: Event schema',
    description: 'Auto apply Event schema',
    pageType:    'event',
    actions: {
      generateSchema:    'Event',
      generateSitemap:   true,
      autoCanonical:     true,
      defaultChangeFreq: 'daily',
      defaultPriority:   0.7,
      defaultRobots:     { index: true, follow: true },
    },
    priority: 7,
  },
];

const RulesService = {

  async seedDefaults() {
    for (const rule of DEFAULT_RULES) {
      const exists = await SeoRule.findOne({ pageType: rule.pageType, name: rule.name });
      if (!exists) {
        await SeoRule.create(rule);
      }
    }
  },

  async getAll({ pageType } = {}) {
    const filter = { isActive: true };
    if (pageType) filter.pageType = pageType;
    return SeoRule.find(filter).sort('-priority').lean();
  },

  async create(data, userId) {
    return SeoRule.create({ ...data, createdBy: userId });
  },

  async update(id, data) {
    return SeoRule.findByIdAndUpdate(id, data, { new: true });
  },

  async delete(id) {
    return SeoRule.findByIdAndDelete(id);
  },

  /**
   * Apply rules for a given page and return a merged defaults object.
   * This is called when creating/updating SEO metadata for a page.
   * @param {string} pageType
   * @returns {object} defaults to apply to the metadata
   */
  async applyRules(pageType) {
    const rules = await SeoRule.find({ pageType: { $in: [pageType, '*'] }, isActive: true })
      .sort('-priority')
      .lean();

    if (!rules.length) return {};

    // Merge rules in priority order — highest priority overrides lower
    const merged = {};
    for (const rule of rules.reverse()) {
      const actions = rule.actions || {};
      if (actions.defaultRobots)    merged.robots        = actions.defaultRobots;
      if (actions.defaultChangeFreq) merged.changeFrequency = actions.defaultChangeFreq;
      if (actions.defaultPriority !== null)  merged.sitemapPriority = actions.defaultPriority;
      if (actions.autoCanonical)    merged.autoCanonical  = true;
      if (actions.generateSitemap !== undefined) merged.includeInSitemap = actions.generateSitemap;
    }

    return merged;
  },

  /**
   * Find which schema type to auto-generate for a page type.
   */
  async getAutoSchema(pageType) {
    const rule = await SeoRule.findOne({
      pageType: { $in: [pageType, '*'] },
      isActive: true,
      'actions.generateSchema': { $ne: null },
    }).sort('-priority').lean();

    return rule?.actions?.generateSchema || null;
  },
};

module.exports = RulesService;

// MukonoTalks

