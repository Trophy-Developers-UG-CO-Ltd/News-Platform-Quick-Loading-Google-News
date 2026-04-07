/**
 * Page model
 * Structured block-based CMS schema with multilingual support
 * Enterprise-grade content management for MukonoTalks
 * @module modules/pages/page.model
 */

const mongoose = require('mongoose');

const contentBlockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['hero', 'page-hero', 'text', 'image', 'cta', 'grid', 'video', 'accordion'],
      required: [true, 'Block type is required'],
    },
    order: {
      type: Number,
      required: [true, 'Block order is required'],
      min: [0, 'Order must be non-negative'],
    },
    data: {
      en: { type: mongoose.Schema.Types.Mixed, required: [true, 'English block data is required'] },
      zh: { type: mongoose.Schema.Types.Mixed, default: null },
      sw: { type: mongoose.Schema.Types.Mixed, default: null },
    },
  },
  { _id: true }
);

const seoSchema = new mongoose.Schema(
  {
    title:         { type: String, trim: true, maxlength: 120 },
    description:   { type: String, trim: true, maxlength: 320 },
    keywords:      { type: String, trim: true, maxlength: 500 },
    canonicalUrl:  { type: String, trim: true, maxlength: 300 },
    ogTitle:       { type: String, trim: true, maxlength: 120 },
    ogDescription: { type: String, trim: true, maxlength: 300 },
    ogImage:       { type: String, trim: true, maxlength: 500 },
  },
  { _id: false }
);

const pageSchema = new mongoose.Schema(
  {
    pageKey: {
      type: String,
      required: [true, 'Page key is required'],
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Page key must contain only lowercase letters, numbers, and hyphens'],
    },

    localizedSlug: {
      en: {
        type: String,
        required: [true, 'English slug is required'],
        trim: true,
        lowercase: true,
      },
      zh: { type: String, trim: true, lowercase: true, default: null },
      sw: { type: String, trim: true, lowercase: true, default: null },
    },

    title: {
      en: {
        type: String,
        required: [true, 'English title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters'],
      },
      zh: { type: String, trim: true, maxlength: 200, default: null },
      sw: { type: String, trim: true, maxlength: 200, default: null },
    },

    contentBlocks: [contentBlockSchema],

    seo: {
      en: { type: seoSchema, default: () => ({}) },
      zh: { type: seoSchema, default: () => ({}) },
      sw: { type: seoSchema, default: () => ({}) },
    },

    publishStatus: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },

    publishedAt: { type: Date, default: null },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    /**
     * JSON-LD structured data schemas (e.g. WebPage, BreadcrumbList).
     * Each element is a plain object — rendered as <script type="application/ld+json">.
     */
    schemas: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    // ── Translation tracking ─────────────────────────────────────────────────
    /** Per-language translation completeness status */
    translationStatus: {
      en: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'completed' },
      sw: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
      zh: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    },
    /** Translation provenance metadata */
    translationMeta: {
      sourceLanguage: { type: String, default: 'en' },
      translatedAt: {
        sw: { type: Date, default: null },
        zh: { type: Date, default: null },
      },
      provider: {
        sw: { type: String, default: null }, // 'google' | 'manual' | null
        zh: { type: String, default: null },
      },
      approvedAt: {
        sw: { type: Date, default: null },
        zh: { type: Date, default: null },
      },
      approvedBy: {
        sw: { type: String, default: null },
        zh: { type: String, default: null },
      },
    },
    /**
     * SHA-256 hash of the English source content.
     * Used for idempotency: skip re-translation when content hasn't changed.
     */
    translationHash: {
      en: { type: String, default: null },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────
pageSchema.index({ pageKey: 1 }, { unique: true });
pageSchema.index({ 'localizedSlug.en': 1 }, { unique: true });
pageSchema.index({ 'localizedSlug.zh': 1 }, { sparse: true });
pageSchema.index({ 'localizedSlug.sw': 1 }, { sparse: true });
pageSchema.index({ publishStatus: 1 });
pageSchema.index({ publishStatus: 1, 'localizedSlug.en': 1 });

const Page = mongoose.model('Page', pageSchema);
module.exports = Page;

// MukonoTalks

