/**
 * SEO Metadata model
 * Per-page SEO metadata: title, description, canonical, OG, Twitter, robots, keywords.
 * Sub-schemas imported from metadata.schemas.js.
 * @module modules/seo-core/metadata.model
 */

'use strict';

const mongoose = require('mongoose');
const { openGraphSchema, twitterSchema, robotsSchema, scoreHistorySchema } = require('./metadata.schemas');

const seoMetadataSchema = new mongoose.Schema(
  {
    pageSlug:   { type: String, required: [true, 'Page slug is required'], trim: true, lowercase: true, unique: true },
    pageLabel:  { type: String, trim: true, maxlength: 200 },
    pageType: {
      type: String,
      enum: ['page', 'product', 'article', 'category', 'home', 'job', 'event', 'location', 'collection', 'news', 'video', 'custom'],
      default: 'page', index: true,
    },

    // Title & Description
    title:           { type: String, trim: true, maxlength: [120, 'SEO title must be under 120 characters'] },
    metaDescription: { type: String, trim: true, maxlength: [360, 'Meta description must be under 360 characters'] },
    canonical:       { type: String, trim: true },
    robots:          { type: robotsSchema,   default: () => ({}) },

    // Keywords
    focusKeywords:     { type: [String], default: [] },
    secondaryKeywords: { type: [String], default: [] },

    // Social
    openGraph: { type: openGraphSchema, default: () => ({}) },
    twitter:   { type: twitterSchema,   default: () => ({}) },

    // SEO Scores
    seoScore:         { type: Number, min: 0, max: 100, default: null },
    readabilityScore: { type: Number, min: 0, max: 100, default: null },
    scoreHistory:     { type: [scoreHistorySchema], default: [] },

    // Sitemap
    includeInSitemap: { type: Boolean, default: true },
    changeFrequency: {
      type: String,
      enum: ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'],
      default: 'weekly',
    },
    sitemapPriority: { type: Number, min: 0.0, max: 1.0, default: 0.6 },

    // Hreflang
    hreflang: { type: Map, of: String, default: () => new Map() },

    // Head tags
    customHeadTags: { type: String, trim: true, default: '' },

    // Resource ref
    resourceId:    { type: mongoose.Schema.Types.ObjectId, default: null },
    resourceModel: { type: String, enum: ['Product', 'Article', 'Page', 'Category', null], default: null },

    // Analysis
    lastAnalyzedAt: { type: Date, default: null },

    // Indexing
    lastIndexedAt:  { type: Date, default: null },
    indexingStatus: { type: String, enum: ['not_submitted', 'submitted', 'indexed', 'error'], default: 'not_submitted' },

    // Audit
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtuals
seoMetadataSchema.virtual('robotsString').get(function () {
  const r = this.robots || {};
  const parts = [];
  parts.push(r.index  === false ? 'noindex'  : 'index');
  parts.push(r.follow === false ? 'nofollow' : 'follow');
  if (r.nosnippet)    parts.push('nosnippet');
  if (r.noarchive)    parts.push('noarchive');
  if (r.noimageindex) parts.push('noimageindex');
  if (r.maxSnippet !== undefined && r.maxSnippet !== -1) parts.push(`max-snippet:${r.maxSnippet}`);
  if (r.maxImagePreview && r.maxImagePreview !== 'large') parts.push(`max-image-preview:${r.maxImagePreview}`);
  if (r.maxVideoPreview !== undefined && r.maxVideoPreview !== -1) parts.push(`max-video-preview:${r.maxVideoPreview}`);
  return parts.join(', ');
});
seoMetadataSchema.virtual('titleLength').get(function () { return this.title ? this.title.length : 0; });
seoMetadataSchema.virtual('descriptionLength').get(function () { return this.metaDescription ? this.metaDescription.length : 0; });

// Indexes
seoMetadataSchema.index({ pageType: 1, isActive: 1 });
seoMetadataSchema.index({ seoScore: -1 });
seoMetadataSchema.index({ updatedAt: -1 });
seoMetadataSchema.index({ resourceId: 1, resourceModel: 1 });

const SeoMetadata = mongoose.model('SeoMetadata', seoMetadataSchema);
module.exports = SeoMetadata;

// MukonoTalks

