/**
 * Article model
 * Enterprise publishing engine — blog, insights, knowledge base, case studies, announcements
 * Multilingual block-based content with scheduled publishing and analytics
 * @module modules/articles/article.model
 */

const mongoose = require('mongoose');

// ─── Content Block Schema ──────────────────────────────────────
const articleBlockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['text', 'image', 'quote', 'code', 'list', 'video'],
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

// ─── SEO Schema ────────────────────────────────────────────────
const seoSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 320 },
  },
  { _id: false }
);

// ─── Related Product Link ──────────────────────────────────────
const relatedProductSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    label: { type: String, trim: true },
  },
  { _id: false }
);

// ─── Attachment Schema (Knowledge Base) ────────────────────────
const attachmentSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, required: true },
    url: { type: String, trim: true, required: true },
    fileType: { type: String, trim: true },
  },
  { _id: false }
);

// ─── Main Article Schema ───────────────────────────────────────
const articleSchema = new mongoose.Schema(
  {
    title: {
      en: {
        type: String,
        required: [true, 'English title is required'],
        trim: true,
        maxlength: [300, 'Title cannot exceed 300 characters'],
      },
      zh: { type: String, trim: true, maxlength: 300, default: null },
      sw: { type: String, trim: true, maxlength: 300, default: null },
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

    excerpt: {
      en: { type: String, trim: true, maxlength: 500, default: null },
      zh: { type: String, trim: true, maxlength: 500, default: null },
      sw: { type: String, trim: true, maxlength: 500, default: null },
    },

    contentBlocks: [articleBlockSchema],

    // ── Translation tracking ─────────────────────────────────────────────────
    translationStatus: {
      en: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'completed' },
      sw: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
      zh: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    },
    translationMeta: {
      sourceLanguage: { type: String, default: 'en' },
      translatedAt: {
        sw: { type: Date, default: null },
        zh: { type: Date, default: null },
      },
      provider: {
        sw: { type: String, default: null },
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
    translationHash: {
      en: { type: String, default: null },
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      lowercase: true,
    },

    tags: {
      type: [String],
      default: [],
      set: (tags) => tags.map((t) => t.toLowerCase().trim()),
    },

    author: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, trim: true, default: null },
      role: { type: String, trim: true, default: null },
    },

    featuredImage: { type: String, trim: true, default: null },

    seo: {
      en: { type: seoSchema, default: () => ({}) },
      zh: { type: seoSchema, default: () => ({}) },
      sw: { type: seoSchema, default: () => ({}) },
    },

    publishStatus: {
      type: String,
      enum: ['draft', 'in_review', 'needs_edit', 'approved', 'scheduled', 'published'],
      default: 'draft',
    },

    // ── Editorial Workflow ─────────────────────────────────────────────
    workflowHistory: [
      {
        status: {
          type: String,
          enum: ['draft', 'in_review', 'needs_edit', 'approved', 'scheduled', 'published'],
        },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, trim: true },
      }
    ],

    // ── Version History ───────────────────────────────────────────────
    versions: [
      {
        contentBlocks: [articleBlockSchema],
        title: {
          en: String,
          zh: String,
          sw: String,
        },
        excerpt: {
          en: String,
          zh: String,
          sw: String,
        },
        seo: {
          en: Object,
          zh: Object,
          sw: Object,
        },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now },
      }
    ],

    scheduledAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    viewCount: { type: Number, default: 0, min: 0 },

    // ─── Knowledge Base Extensions ───────────────────────────
    relatedProducts: [relatedProductSchema],
    attachments: [attachmentSchema],
    technicalReferences: [{ type: String, trim: true }],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ─────────────────────────────────────────────────
articleSchema.index({ 'localizedSlug.en': 1 }, { unique: true });
articleSchema.index({ 'localizedSlug.zh': 1 }, { sparse: true });
articleSchema.index({ 'localizedSlug.sw': 1 }, { sparse: true });
articleSchema.index({ publishStatus: 1 });
articleSchema.index({ category: 1 });
articleSchema.index({ tags: 1 });
articleSchema.index({ publishedAt: -1 });
articleSchema.index({ viewCount: -1 });
articleSchema.index({ publishStatus: 1, category: 1, publishedAt: -1 });
articleSchema.index({ 'title.en': 'text', 'excerpt.en': 'text', tags: 'text' });

const Article = mongoose.model('Article', articleSchema);
module.exports = Article;

// MukonoTalks

