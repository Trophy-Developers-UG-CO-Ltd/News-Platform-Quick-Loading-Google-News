/**
 * Link Rules model
 * Stores intelligent internal linking rules.
 * @module modules/internal-links/link-rules.model
 */

const mongoose = require('mongoose');

const linkRuleSchema = new mongoose.Schema(
  {
    /** Keyword or phrase to detect in content */
    keyword: {
      type: String,
      required: [true, 'Keyword is required'],
      trim: true,
      lowercase: true,
      index: true,
    },

    /** Target URL to link to when keyword is found */
    targetURL: {
      type: String,
      required: [true, 'Target URL is required'],
      trim: true,
    },

    /** Anchor text override (defaults to keyword) */
    anchorText: {
      type: String,
      trim: true,
      default: '',
    },

    /** Higher priority = applied first */
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },

    /** If true, automatically insert link when content is saved */
    autoInsert: {
      type: Boolean,
      default: false,
    },

    /** How many times this link has been suggested/inserted */
    usageCount: {
      type: Number,
      default: 0,
    },

    /** Page type this rule applies to (null = all) */
    appliesTo: {
      type: [String],
      default: [],
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

// Unique: same keyword → same target URL only once
linkRuleSchema.index({ keyword: 1, targetURL: 1 }, { unique: true });

const LinkRule = mongoose.model('SeoLinkRule', linkRuleSchema, 'seo_link_rules');
module.exports = LinkRule;

// MukonoTalks

