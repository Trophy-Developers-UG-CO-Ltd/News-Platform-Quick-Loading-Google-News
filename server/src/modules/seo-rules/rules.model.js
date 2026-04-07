/**
 * SEO Rules model
 * Stores automation rules that drive schema auto-generation, sitemap config, etc.
 * @module modules/seo-rules/rules.model
 */

const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    /** The page type this rule targets */
    pageType: {
      type: String,
      required: true,
      enum: ['page', 'product', 'article', 'category', 'home', 'job', 'event', 'location', 'collection', 'news', 'video', 'custom', '*'],
      index: true,
    },
    /** Actions to execute when rule matches */
    actions: {
      generateSchema: {
        type: String,
        default: null,   // e.g. "Product", "Article"
      },
      generateSitemap: {
        type: Boolean,
        default: true,
      },
      autoCanonical: {
        type: Boolean,
        default: true,
      },
      defaultRobots: {
        index:  { type: Boolean, default: true },
        follow: { type: Boolean, default: true },
      },
      defaultChangeFreq: {
        type: String,
        enum: ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never', null],
        default: null,
      },
      defaultPriority: {
        type: Number,
        min:  0,
        max:  1,
        default: null,
      },
      autoIndex: {
        type: Boolean,
        default: false,  // submit to indexing APIs on publish
      },
    },
    /** Conditions for rule to fire */
    conditions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    priority: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

const SeoRule = mongoose.model('SeoRule', ruleSchema, 'seo_rules');
module.exports = SeoRule;

// MukonoTalks

