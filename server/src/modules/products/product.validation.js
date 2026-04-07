/**
 * Product validation schemas (Joi) — Premium Edition
 * @module modules/products/product.validation
 */

const Joi = require('joi');

// Accept both absolute URIs (https://…) and storage-relative paths (/uploads/…, /products/…)
const urlSchema = Joi.string().custom((value, helpers) => {
  if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value;
  return helpers.error('string.uri');
}, 'url or relative path');

// ─── Reusable sub-schemas ─────────────────────────────────────────────────────
const imageItemSchema = Joi.object({
  url:       urlSchema.required(),
  alt:       Joi.string().allow('').default(''),
  isPrimary: Joi.boolean().default(false),
});

const galleryItemSchema = Joi.object({
  url:     urlSchema.required(),
  alt:     Joi.string().allow('').default(''),
  caption: Joi.string().allow('').default(''),
});

const variantItemSchema = Joi.object({
  size:         Joi.string().trim().required(),
  sku:          Joi.string().trim().uppercase().required(),
  packagingType: Joi.string().valid('drum','bucket','bag','bottle','ibc','tank','sachet','other'),
  price:        Joi.number().min(0),
  stock:        Joi.number().integer().min(0).default(0),
  weight:       Joi.string().allow(''),
});

const documentItemSchema = Joi.object({
  title:       Joi.string().trim().required(),
  url:         urlSchema.required(),
  fileType:    Joi.string().valid('pdf','xlsx','docx','dwg','other').default('pdf'),
  isRestricted: Joi.boolean().default(false),
});

const videoItemSchema = Joi.object({
  title:       Joi.string().trim(),
  url:         urlSchema.required(),
  platform:    Joi.string().valid('youtube','vimeo','other').default('youtube'),
  description: Joi.string().trim().allow(''),
});

const certificationItemSchema = Joi.object({
  name:        Joi.string().trim().required(),
  body:        Joi.string().trim().allow(''),
  number:      Joi.string().trim().allow(''),
  validUntil:  Joi.date().iso(),
  documentUrl: urlSchema.allow(''),
});

const ogImageSchema = Joi.object({
  url:    urlSchema.allow(''),
  alt:    Joi.string().allow('').default(''),
  width:  Joi.number().integer().positive(),
  height: Joi.number().integer().positive(),
});

// ─── Shared fields object (used in both create and update) ────────────────────
const sharedFields = {
  // Core content
  description: Joi.string().trim().min(10).max(5000),
  overview:    Joi.string().trim().max(1000).allow(''),
  features:    Joi.array().items(Joi.string().trim()),
  benefits:    Joi.array().items(Joi.string().trim()),
  applications:     Joi.array().items(Joi.string().trim()),
  industriesServed: Joi.array().items(Joi.string().trim()),
  keyFeatures:      Joi.array().items(Joi.string().trim()),
  technicalSpecifications: Joi.object(),
  casNumber:      Joi.string().trim().allow(''),
  chemicalFormula: Joi.string().trim().allow(''),

  // Media
  images:  Joi.array().items(imageItemSchema),
  gallery: Joi.array().items(galleryItemSchema),
  videos:  Joi.array().items(videoItemSchema),

  // Assets
  documents:     Joi.array().items(documentItemSchema),
  certifications: Joi.array().items(certificationItemSchema),

  // Commerce
  price:        Joi.number().min(0),
  priceCurrency: Joi.string().valid('USD','EUR','TZS','UGX').allow(''),
  stock:        Joi.number().integer().min(0),
  variants:     Joi.array().items(variantItemSchema),

  // Logistics
  availability:         Joi.string().valid('in_stock','made_to_order','limited','discontinued'),
  minimumOrderQuantity: Joi.number().integer().min(0),
  leadTime:   Joi.string().trim().allow(''),
  packaging:  Joi.string().trim().allow(''),

  // Relations
  relatedProducts:  Joi.array().items(Joi.string().hex().length(24)),
  applicationRefs:  Joi.array().items(Joi.string().hex().length(24)),

  // Visibility
  isRestricted:  Joi.boolean(),
  isActive:      Joi.boolean(),
  publishStatus: Joi.string().valid('draft','published','archived'),

  // Identifiers
  resinType:   Joi.string().trim().allow(''),
  pigmentType: Joi.string().trim().allow(''),

  // SEO
  seoTitle:       Joi.string().trim().max(70).allow(''),
  seoDescription: Joi.string().trim().max(160).allow(''),
  seoKeywords:    Joi.array().items(Joi.string().trim()),
  ogTitle:        Joi.string().trim().max(100).allow(''),
  ogDescription:  Joi.string().trim().max(300).allow(''),
  ogImage:        ogImageSchema,
  twitterCardType: Joi.string().valid('summary','summary_large_image','player'),

  // Legacy meta fields
  metaTitle:       Joi.string().trim().allow(''),
  metaDescription: Joi.string().trim().allow(''),
  tags:            Joi.array().items(Joi.string().trim()),
  technicalKeywords: Joi.array().items(Joi.string().trim()),
};

// ─── createProductSchema ──────────────────────────────────────────────────────
const createProductSchema = {
  body: Joi.object({
    title:    Joi.string().trim().min(2).max(200).required(),
    category: Joi.string().hex().length(24).required(),
    ...sharedFields,
  }),
};

// ─── updateProductSchema ──────────────────────────────────────────────────────
const updateProductSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    title:    Joi.string().trim().min(2).max(200),
    category: Joi.string().hex().length(24),
    ...sharedFields,
  }).min(1),
};

// ─── getProductsQuerySchema ───────────────────────────────────────────────────
const getProductsQuerySchema = {
  query: Joi.object({
    page:          Joi.number().integer().min(1).default(1),
    limit:         Joi.number().integer().min(1).max(50).default(12),
    sort:          Joi.string().trim(),
    search:        Joi.string().trim().allow(''),
    category:      Joi.string().hex().length(24),
    industry:      Joi.string().trim(),
    resinType:     Joi.string().trim(),
    pigmentType:   Joi.string().trim(),
    availability:  Joi.string().trim(),
    publishStatus: Joi.string().valid('draft','published','archived'),
    minPrice:      Joi.number().min(0),
    maxPrice:      Joi.number().min(0),
    inStock:       Joi.boolean(),
  }),
};

module.exports = {
  createProductSchema,
  updateProductSchema,
  getProductsQuerySchema,
};

// MukonoTalks

