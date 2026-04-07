/**
 * Product model
 * Production-ready schema for B2B industrial chemicals — Premium Edition
 * @module modules/products/product.model
 */

const mongoose = require('mongoose');
const slugify  = require('slugify');

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const variantSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: [true, 'Variant size is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    packagingType: {
      type: String,
      trim: true,
      enum: ['drum', 'bucket', 'bag', 'bottle', 'ibc', 'tank', 'sachet', 'other'],
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    weight: String,
  },
  { _id: true }
);

const certificationSchema = new mongoose.Schema(
  {
    name:   { type: String, trim: true, required: true },
    body:   { type: String, trim: true },
    number: { type: String, trim: true },
    validUntil: Date,
    documentUrl: { type: String, trim: true },
  },
  { _id: false }
);

const videoSchema = new mongoose.Schema(
  {
    title:       { type: String, trim: true },
    url:         { type: String, trim: true, required: true },
    platform:    { type: String, trim: true, enum: ['youtube', 'vimeo', 'other'], default: 'youtube' },
    description: { type: String, trim: true },
    alt:         { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const documentFileSchema = new mongoose.Schema(
  {
    title:       { type: String, trim: true, required: true },
    url:         { type: String, trim: true, required: true },
    fileType:    { type: String, trim: true, enum: ['pdf', 'xlsx', 'docx', 'dwg', 'other'], default: 'pdf' },
    isRestricted: { type: Boolean, default: false },
  },
  { _id: false }
);

// ─── Main product schema ──────────────────────────────────────────────────────

const productSchema = new mongoose.Schema(
  {
    // ── Core identity ───────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    // Localized title — falls back to `title` (EN) when not set
    localizedTitle: {
      en: { type: String, default: null, trim: true, maxlength: 200 },
      zh: { type: String, default: null, trim: true, maxlength: 200 },
      sw: { type: String, default: null, trim: true, maxlength: 200 },
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
      index: true,
    },

    // ── Content ─────────────────────────────────────────────────────────────
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    // Localized description — falls back to `description` (EN) when not set
    localizedDescription: {
      en: { type: String, default: null, maxlength: 5000 },
      zh: { type: String, default: null, maxlength: 5000 },
      sw: { type: String, default: null, maxlength: 5000 },
    },
    overview: {
      type: String,
      trim: true,
      maxlength: [1000, 'Overview cannot exceed 1000 characters'],
    },
    // Localized overview — falls back to `overview` (EN) when not set
    localizedOverview: {
      en: { type: String, default: null, trim: true, maxlength: 1000 },
      zh: { type: String, default: null, trim: true, maxlength: 1000 },
      sw: { type: String, default: null, trim: true, maxlength: 1000 },
    },
    features: {
      type: [String],
      default: [],
    },
    // Localized features array — falls back to `features` (EN) when not set
    localizedFeatures: {
      en: { type: [String], default: null },
      zh: { type: [String], default: null },
      sw: { type: [String], default: null },
    },
    benefits: {
      type: [String],
      default: [],
    },
    applications: {
      type: [String],
      default: [],
    },
    industriesServed: {
      type: [String],
      default: [],
    },

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

    keyFeatures: {
      type: [String],
      default: [],
    },

    // ── Technical data (RESTRICTED) ─────────────────────────────────────────
    technicalSpecifications: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ── Media ────────────────────────────────────────────────────────────────
    images: [
      {
        url:       { type: String, required: true },
        alt:       { type: String, default: '' },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    gallery: [
      {
        url:     { type: String, required: true },
        alt:     { type: String, default: '' },
        caption: { type: String, default: '' },
      },
    ],
    videos: [videoSchema],

    // ── Documents & certifications ───────────────────────────────────────────
    documents:     [documentFileSchema],
    certifications: [certificationSchema],

    // ── Logistics ────────────────────────────────────────────────────────────
    availability: {
      type: String,
      trim: true,
      enum: ['in_stock', 'made_to_order', 'limited', 'discontinued'],
      default: 'in_stock',
    },
    minimumOrderQuantity: {
      type: Number,
      min: [0, 'MOQ cannot be negative'],
      default: 1,
    },
    leadTime: {
      type: String,
      trim: true,
    },
    packaging: {
      type: String,
      trim: true,
    },

    // ── Commerce ─────────────────────────────────────────────────────────────
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    priceCurrency: {
      type: String,
      trim: true,
      uppercase: true,
      enum: ['USD', 'EUR', 'TZS', 'UGX'],
      default: 'USD',
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    variants: [variantSchema],

    // ── Relationships ────────────────────────────────────────────────────────
    relatedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    // Many-to-many: linked application pages (SEO expansion)
    applicationRefs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
      },
    ],

    // ── Visibility & status ──────────────────────────────────────────────────
    isRestricted: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    publishStatus: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },

    // ── Filtering identifiers ────────────────────────────────────────────────
    resinType:   { type: String, trim: true },
    pigmentType: { type: String, trim: true },
    casNumber:   { type: String, trim: true },
    chemicalFormula: { type: String, trim: true },

    // ── SEO ─────────────────────────────────────────────────────────────────
    seoTitle:          { type: String, trim: true, maxlength: 70 },
    seoDescription:    { type: String, trim: true, maxlength: 160 },
    seoKeywords:       [String],
    // Open Graph / Social sharing (Twitter, Facebook, LinkedIn)
    ogTitle:           { type: String, trim: true, maxlength: 100 },
    ogDescription:     { type: String, trim: true, maxlength: 300 },
    ogImage: {
      url: { type: String, trim: true },
      alt: { type: String, trim: true, default: '' },
      width:  { type: Number },
      height: { type: Number },
    },
    twitterCardType: {
      type: String,
      enum: ['summary', 'summary_large_image', 'player'],
      default: 'summary_large_image',
    },

    // ── Structured Data (Schema.org) ─────────────────────────────────────────
    brand:        { type: String, trim: true },
    manufacturer: { type: String, trim: true },
    material:     { type: String, trim: true },

    // schema.org/PropertyValue pairs — appended as additionalProperty in JSON-LD
    additionalProperty: {
      type: [
        new mongoose.Schema(
          {
            name:  { type: String, trim: true, required: true },
            value: { type: String, trim: true, required: true },
          },
          { _id: false }
        ),
      ],
      default: [],
    },

    // FAQ entries — rendered as FAQPage JSON-LD on the product page
    faqs: {
      type: [
        new mongoose.Schema(
          {
            question: { type: String, trim: true, required: true },
            answer:   { type: String, trim: true, required: true },
          },
          { _id: false }
        ),
      ],
      default: [],
    },

    // Custom JSON-LD overrides / extra schemas (admin-supplied raw objects)
    seoSchemas: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    // ── Metadata ─────────────────────────────────────────────────────────────
    metaTitle:       { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    tags:            [String],
    technicalKeywords: {
      type: [String],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
productSchema.index({ category: 1, industriesServed: 1 });
productSchema.index({ resinType: 1 });
productSchema.index({ pigmentType: 1 });
productSchema.index({ isActive: 1, isRestricted: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ publishStatus: 1, isActive: 1 });
productSchema.index(
  {
    title:             'text',
    description:       'text',
    overview:          'text',
    tags:              'text',
    technicalKeywords: 'text',
    applications:      'text',
    keyFeatures:       'text',
    benefits:          'text',
  },
  {
    weights: {
      title: 10,
      tags: 8,
      technicalKeywords: 7,
      keyFeatures: 5,
      applications: 4,
      benefits: 3,
      overview: 2,
      description: 1,
    },
    name: 'product_fulltext_search',
  }
);

// ─── Pre-save: Generate slug ──────────────────────────────────────────────────
productSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

// ─── Virtual: inStock ─────────────────────────────────────────────────────────
productSchema.virtual('inStock').get(function () {
  if (this.variants && this.variants.length > 0) {
    return this.variants.some((v) => v.stock > 0);
  }
  return this.stock > 0;
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

// MukonoTalks

