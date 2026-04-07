/**
 * Application model
 * Represents a product application / use-case — supports programmatic SEO pages
 * URL pattern: /products/:productSlug/application/:applicationSlug
 * @module modules/applications/application.model
 */

const mongoose = require('mongoose');
const slugify  = require('slugify');

const applicationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Application title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [50000, 'Description cannot exceed 50000 characters'],
      default: '',
    },
    industryUse: {
      type: String,
      trim: true,
      maxlength: [500, 'Industry use cannot exceed 500 characters'],
      default: '',
    },
    advantages: {
      type: [String],
      default: [],
    },
    recommendedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    seoTitle: {
      type: String,
      trim: true,
      maxlength: [70, 'SEO title cannot exceed 70 characters'],
      default: '',
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'SEO description cannot exceed 160 characters'],
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// ─── Pre-save: auto-generate slug from title ──────────────────────────────────
applicationSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;

// MukonoTalks

