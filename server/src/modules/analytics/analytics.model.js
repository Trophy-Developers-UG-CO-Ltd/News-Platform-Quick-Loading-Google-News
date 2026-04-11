/**
 * Analytics Model
 * Tracks product views, search terms, and business intelligence data
 * @module modules/analytics/analytics.model
 */

const mongoose = require('mongoose');

// Product View Tracking
const productViewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    sessionId: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'product_views',
  }
);

productViewSchema.index({ product: 1, createdAt: -1 });
productViewSchema.index({ createdAt: -1 });
productViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

// Search Term Tracking
const searchTermSchema = new mongoose.Schema(
  {
    term: {
      type: String,
      required: true,
      index: true,
    },
    normalizedTerm: {
      type: String,
      required: true,
      index: true,
    },
    resultsCount: {
      type: Number,
      default: 0,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    language: {
      type: String,
      default: 'en',
    },
  },
  {
    timestamps: true,
    collection: 'search_terms',
  }
);

searchTermSchema.index({ normalizedTerm: 1, createdAt: -1 });
searchTermSchema.index({ createdAt: -1 });
searchTermSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

// Page View Tracking (general)
const pageViewSchema = new mongoose.Schema(
  {
    path: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    sessionId: { type: String, default: null },
    referrer: { type: String, default: null },
    language: { type: String, default: 'en' },
  },
  {
    timestamps: true,
    collection: 'page_views',
  }
);

pageViewSchema.index({ path: 1, createdAt: -1 });
pageViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

const articleViewEventSchema = new mongoose.Schema(
  {
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      default: null,
      index: true,
    },
    fingerprint: {
      type: String,
      default: null,
      index: true,
    },
    ipHash: {
      type: String,
      default: null,
      index: true,
    },
    userAgent: {
      type: String,
      default: '',
    },
    referrer: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'en',
    },
    isBot: {
      type: Boolean,
      default: false,
      index: true,
    },
    counted: {
      type: Boolean,
      default: true,
      index: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'article_view_events',
  }
);

articleViewEventSchema.index({ article: 1, viewedAt: -1 });
articleViewEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const ProductView = mongoose.model('ProductView', productViewSchema);
const SearchTerm = mongoose.model('SearchTerm', searchTermSchema);
const PageView = mongoose.model('PageView', pageViewSchema);
const ArticleViewEvent = mongoose.model('ArticleViewEvent', articleViewEventSchema);

module.exports = { ProductView, SearchTerm, PageView, ArticleViewEvent };

// MukonoTalks

