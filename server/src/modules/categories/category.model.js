/**
 * Category model
 * @module modules/categories/category.model
 */

const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    // Localized name — falls back to `name` (EN) when not set
    localizedName: {
      en: { type: String, default: null, trim: true, maxlength: 100 },
      zh: { type: String, default: null, trim: true, maxlength: 100 },
      sw: { type: String, default: null, trim: true, maxlength: 100 },
    },
    slug: {
      type: String,
      unique: true, // unique already creates an index
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    // Localized description — falls back to `description` (EN) when not set
    localizedDescription: {
      en: { type: String, default: null, maxlength: 500 },
      zh: { type: String, default: null, maxlength: 500 },
      sw: { type: String, default: null, maxlength: 500 },
    },
    image: {
      type: String,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // ── SEO ──────────────────────────────────────────────────
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
    seoKeywords: {
      type: [String],
      default: [],
    },
    ogTitle: {
      type: String,
      trim: true,
      maxlength: [70, 'OG title cannot exceed 70 characters'],
      default: '',
    },
    ogDescription: {
      type: String,
      trim: true,
      maxlength: [200, 'OG description cannot exceed 200 characters'],
      default: '',
    },
    ogImage: {
      type: String,
      trim: true,
      default: '',
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Generate slug before save
categorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// ─── Indexes ───────────────────────────────────────────────────
categorySchema.index({ parent: 1 }); // Tree queries (children of parent)
categorySchema.index({ isActive: 1 }); // Filter active categories

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;

// MukonoTalks

