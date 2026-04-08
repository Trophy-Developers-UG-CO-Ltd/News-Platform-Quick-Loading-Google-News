/**
 * Page validation schemas
 * Joi-based validation for CMS page operations
 * Enforces multilingual content integrity and block structure
 * @module modules/pages/page.validation
 */

const Joi = require('joi');

const BLOCK_TYPES = ['hero', 'page-hero', 'text', 'image', 'cta', 'grid', 'video', 'accordion'];
const SUPPORTED_LANGS = ['en', 'zh', 'sw'];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Content block schema
 */
const contentBlockSchema = Joi.object({
  _id: Joi.string().optional(),
  type: Joi.string()
    .valid(...BLOCK_TYPES)
    .required()
    .messages({ 'any.only': `Block type must be one of: ${BLOCK_TYPES.join(', ')}` }),
  order: Joi.number().integer().min(0).required(),
  data: Joi.object({
    en: Joi.object().required().messages({ 'any.required': 'English block data is required' }),
    zh: Joi.object().allow(null).default(null),
    sw: Joi.object().allow(null).default(null),
  }).required(),
});

/**
 * SEO sub-schema per language
 */
const seoLangSchema = Joi.object({
  title:         Joi.string().max(120).allow('', null).default(''),
  description:   Joi.string().max(320).allow('', null).default(''),
  keywords:      Joi.string().max(500).allow('', null).default(''),
  canonicalUrl:  Joi.string().uri().max(300).allow('', null).default(''),
  ogTitle:       Joi.string().max(120).allow('', null).default(''),
  ogDescription: Joi.string().max(300).allow('', null).default(''),
  ogImage:       Joi.string().max(500).allow('', null).default(''),
});

/**
 * Create page validation
 */
const createPageSchema = {
  body: Joi.object({
    pageKey: Joi.string()
      .pattern(/^[a-z0-9-]+$/)
      .min(2)
      .max(100)
      .required()
      .messages({ 'string.pattern.base': 'Page key must contain only lowercase letters, numbers, and hyphens' }),

    localizedSlug: Joi.object({
      en: Joi.string().pattern(SLUG_PATTERN).min(2).max(150).required()
        .messages({ 'string.pattern.base': 'English slug must be URL-safe (lowercase, hyphens only)' }),
      zh: Joi.string().pattern(SLUG_PATTERN).max(150).allow('', null).default(null),
      sw: Joi.string().pattern(SLUG_PATTERN).max(150).allow('', null).default(null),
    }).required(),

    title: Joi.object({
      en: Joi.string().min(1).max(200).required().messages({ 'any.required': 'English title is required' }),
      zh: Joi.string().max(200).allow('', null).default(null),
      sw: Joi.string().max(200).allow('', null).default(null),
    }).required(),

    contentBlocks: Joi.array()
      .items(contentBlockSchema)
      .default([])
      .custom((blocks, helpers) => {
        // Enforce no duplicate order values
        const orders = blocks.map((b) => b.order);
        const uniqueOrders = new Set(orders);
        if (orders.length !== uniqueOrders.size) {
          return helpers.error('custom.duplicateOrder');
        }
        return blocks;
      })
      .messages({ 'custom.duplicateOrder': 'Content blocks must have unique order values' }),

    seo: Joi.object({
      en: seoLangSchema.default({}),
      zh: seoLangSchema.default({}),
      sw: seoLangSchema.default({}),
    }).default({}),

    schemas: Joi.array().items(Joi.object()).default([]),
  }),
};

/**
 * Update page validation
 */
const updatePageSchema = {
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    pageKey: Joi.string()
      .pattern(/^[a-z0-9-]+$/)
      .min(2)
      .max(100)
      .messages({ 'string.pattern.base': 'Page key must contain only lowercase letters, numbers, and hyphens' }),

    localizedSlug: Joi.object({
      en: Joi.string().pattern(SLUG_PATTERN).min(2).max(150)
        .messages({ 'string.pattern.base': 'English slug must be URL-safe (lowercase, hyphens only)' }),
      zh: Joi.string().pattern(SLUG_PATTERN).max(150).allow('', null),
      sw: Joi.string().pattern(SLUG_PATTERN).max(150).allow('', null),
    }),

    title: Joi.object({
      en: Joi.string().min(1).max(200),
      zh: Joi.string().max(200).allow('', null),
      sw: Joi.string().max(200).allow('', null),
    }),

    contentBlocks: Joi.array()
      .items(contentBlockSchema)
      .custom((blocks, helpers) => {
        const orders = blocks.map((b) => b.order);
        const uniqueOrders = new Set(orders);
        if (orders.length !== uniqueOrders.size) {
          return helpers.error('custom.duplicateOrder');
        }
        return blocks;
      })
      .messages({ 'custom.duplicateOrder': 'Content blocks must have unique order values' }),

    seo: Joi.object({
      en: seoLangSchema,
      zh: seoLangSchema,
      sw: seoLangSchema,
    }),

    schemas: Joi.array().items(Joi.object()),
  }).min(1).messages({ 'object.min': 'At least one field must be provided for update' }),
};

/**
 * Publish / unpublish page validation
 */
const publishPageSchema = {
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    action: Joi.string().valid('publish', 'unpublish').required(),
  }),
};

/**
 * Get public page validation
 */
const getPublicPageSchema = {
  params: Joi.object({
    lang: Joi.string()
      .valid(...SUPPORTED_LANGS)
      .required()
      .messages({ 'any.only': `Language must be one of: ${SUPPORTED_LANGS.join(', ')}` }),
    slug: Joi.string().pattern(SLUG_PATTERN).required(),
  }),
};

/**
 * Search published pages (public)
 */
const searchPublicPagesSchema = {
  query: Joi.object({
    query: Joi.string().trim().min(2).max(120).required(),
    lang: Joi.string().valid(...SUPPORTED_LANGS).default('en'),
    limit: Joi.number().integer().min(1).max(20).default(6),
  }),
};

module.exports = {
  createPageSchema,
  updatePageSchema,
  publishPageSchema,
  getPublicPageSchema,
  searchPublicPagesSchema,
  BLOCK_TYPES,
  SUPPORTED_LANGS,
};

// MukonoTalks

