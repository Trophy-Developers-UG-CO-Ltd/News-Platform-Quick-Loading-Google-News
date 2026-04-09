/**
 * Article validation schemas
 * Joi-based validation for publishing engine operations
 * Enforces multilingual content integrity, slug uniqueness, and scheduling rules
 * @module modules/articles/article.validation
 */

const Joi = require('joi');

const BLOCK_TYPES = ['text', 'image', 'quote', 'code', 'list', 'video'];
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
  title: Joi.string().max(120).allow('', null).default(''),
  description: Joi.string().max(320).allow('', null).default(''),
});

/**
 * Related product schema
 */
const relatedProductSchema = Joi.object({
  product: Joi.string().required(),
  label: Joi.string().max(200).allow('', null).default(''),
});

/**
 * Attachment schema
 */
const attachmentSchema = Joi.object({
  label: Joi.string().max(200).required(),
  url: Joi.string().uri().required(),
  fileType: Joi.string().max(50).allow('', null).default(''),
});

const videoMetaSchema = Joi.object({
  enabled: Joi.boolean().default(false),
  provider: Joi.string().max(100).allow('', null).default(null),
  videoUrl: Joi.string().max(1000).allow('', null).default(null),
  embedUrl: Joi.string().max(1000).allow('', null).default(null),
  directVideoUrl: Joi.string().max(1000).allow('', null).default(null),
  posterImage: Joi.string().max(1000).allow('', null).default(null),
  thumbnailUrl: Joi.string().max(1000).allow('', null).default(null),
  caption: Joi.string().max(500).allow('', null).default(null),
  captionFileUrl: Joi.string().max(1000).allow('', null).default(null),
  transcript: Joi.string().allow('', null).default(null),
  duration: Joi.string().max(50).allow('', null).default(null),
  uploadDate: Joi.date().iso().allow(null).default(null),
}).custom((value, helpers) => {
  if (value?.enabled && !(value.videoUrl || value.embedUrl || value.directVideoUrl)) {
    return helpers.error('custom.videoSourceRequired');
  }
  return value;
}).messages({
  'custom.videoSourceRequired': 'Primary video metadata requires a video URL, embed URL, or direct video upload URL',
});

/**
 * Create article validation
 */
const createArticleSchema = {
  body: Joi.object({
    title: Joi.object({
      en: Joi.string().min(1).max(300).required().messages({ 'any.required': 'English title is required' }),
      zh: Joi.string().max(300).allow('', null).default(null),
      sw: Joi.string().max(300).allow('', null).default(null),
    }).required(),

    localizedSlug: Joi.object({
      en: Joi.string().pattern(SLUG_PATTERN).min(2).max(200).required()
        .messages({ 'string.pattern.base': 'English slug must be URL-safe (lowercase, hyphens only)' }),
      zh: Joi.string().pattern(SLUG_PATTERN).max(200).allow('', null).default(null),
      sw: Joi.string().pattern(SLUG_PATTERN).max(200).allow('', null).default(null),
    }).required(),

    excerpt: Joi.object({
      en: Joi.string().max(500).allow('', null).default(null),
      zh: Joi.string().max(500).allow('', null).default(null),
      sw: Joi.string().max(500).allow('', null).default(null),
    }).default({}),

    contentBlocks: Joi.array()
      .items(contentBlockSchema)
      .default([])
      .custom((blocks, helpers) => {
        const orders = blocks.map((b) => b.order);
        const uniqueOrders = new Set(orders);
        if (orders.length !== uniqueOrders.size) {
          return helpers.error('custom.duplicateOrder');
        }
        return blocks;
      })
      .messages({ 'custom.duplicateOrder': 'Content blocks must have unique order values' }),

    category: Joi.string()
      .pattern(SLUG_PATTERN)
      .required()
      .messages({ 'string.pattern.base': 'Category must be a URL-safe slug (lowercase, hyphens only)' }),

    tags: Joi.array().items(Joi.string().max(50)).max(20).default([]),

    author: Joi.object({
      name: Joi.string().max(100).allow('', null).default(null),
      role: Joi.string().max(100).allow('', null).default(null),
    }).default({}),

    featuredImage: Joi.string().max(500).allow('', null).default(null),

    seo: Joi.object({
      en: seoLangSchema.default({}),
      zh: seoLangSchema.default({}),
      sw: seoLangSchema.default({}),
    }).default({}),
    videoMeta: videoMetaSchema.default({}),

    // Knowledge base extensions
    relatedProducts: Joi.array().items(relatedProductSchema).default([]),
    attachments: Joi.array().items(attachmentSchema).default([]),
    technicalReferences: Joi.array().items(Joi.string().max(500)).default([]),
  }).custom((value, helpers) => {
    if (String(value.category || '').includes('video')) {
      if (!value.videoMeta?.enabled) {
        return helpers.error('custom.videoMetaRequired');
      }
      if (!(value.videoMeta.videoUrl || value.videoMeta.embedUrl || value.videoMeta.directVideoUrl)) {
        return helpers.error('custom.videoSourceRequired');
      }
    }
    return value;
  }).messages({
    'custom.videoMetaRequired': 'Video articles must enable the primary video section',
    'custom.videoSourceRequired': 'Video articles require a video URL, embed URL, or direct video upload URL',
  }),
};

/**
 * Update article validation
 */
const updateArticleSchema = {
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    title: Joi.object({
      en: Joi.string().min(1).max(300),
      zh: Joi.string().max(300).allow('', null),
      sw: Joi.string().max(300).allow('', null),
    }),

    localizedSlug: Joi.object({
      en: Joi.string().pattern(SLUG_PATTERN).min(2).max(200)
        .messages({ 'string.pattern.base': 'English slug must be URL-safe (lowercase, hyphens only)' }),
      zh: Joi.string().pattern(SLUG_PATTERN).max(200).allow('', null),
      sw: Joi.string().pattern(SLUG_PATTERN).max(200).allow('', null),
    }),

    excerpt: Joi.object({
      en: Joi.string().max(500).allow('', null),
      zh: Joi.string().max(500).allow('', null),
      sw: Joi.string().max(500).allow('', null),
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

    category: Joi.string()
      .pattern(SLUG_PATTERN)
      .messages({ 'string.pattern.base': 'Category must be a URL-safe slug (lowercase, hyphens only)' }),

    tags: Joi.array().items(Joi.string().max(50)).max(20),

    author: Joi.object({
      name: Joi.string().max(100).allow('', null),
      role: Joi.string().max(100).allow('', null),
    }),

    featuredImage: Joi.string().max(500).allow('', null),

    seo: Joi.object({
      en: seoLangSchema,
      zh: seoLangSchema,
      sw: seoLangSchema,
    }),
    videoMeta: videoMetaSchema,

    relatedProducts: Joi.array().items(relatedProductSchema),
    attachments: Joi.array().items(attachmentSchema),
    technicalReferences: Joi.array().items(Joi.string().max(500)),
  }).min(1).custom((value, helpers) => {
    if (String(value.category || '').includes('video')) {
      if (!value.videoMeta?.enabled) {
        return helpers.error('custom.videoMetaRequired');
      }
      if (!(value.videoMeta.videoUrl || value.videoMeta.embedUrl || value.videoMeta.directVideoUrl)) {
        return helpers.error('custom.videoSourceRequired');
      }
    }
    return value;
  }).messages({
    'object.min': 'At least one field must be provided for update',
    'custom.videoMetaRequired': 'Video articles must enable the primary video section',
    'custom.videoSourceRequired': 'Video articles require a video URL, embed URL, or direct video upload URL',
  }),
};

/**
 * Publish / unpublish article validation
 */
const publishArticleSchema = {
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    action: Joi.string().valid('publish', 'unpublish').required(),
  }),
};

/**
 * Schedule article validation
 */
const scheduleArticleSchema = {
  params: Joi.object({
    id: Joi.string().required(),
  }),
  body: Joi.object({
    scheduledAt: Joi.date().iso().greater('now').required()
      .messages({ 'date.greater': 'Scheduled date must be in the future' }),
  }),
};

/**
 * Get public article validation
 */
const getPublicArticleSchema = {
  params: Joi.object({
    lang: Joi.string()
      .valid(...SUPPORTED_LANGS)
      .required()
      .messages({ 'any.only': `Language must be one of: ${SUPPORTED_LANGS.join(', ')}` }),
    slug: Joi.string().pattern(SLUG_PATTERN).required(),
  }),
};

/**
 * List articles query validation
 */
const listArticlesQuerySchema = {
  query: Joi.object({
    category: Joi.string().pattern(SLUG_PATTERN).allow('', null),
    tag: Joi.string().max(50).allow('', null),
    search: Joi.string().max(200).allow('', null),
    status: Joi.string().valid('draft', 'scheduled', 'published').allow('', null),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('publishedAt', 'viewCount', 'createdAt').default('publishedAt'),
    lang: Joi.string().valid(...SUPPORTED_LANGS).default('en'),
  }),
};

module.exports = {
  createArticleSchema,
  updateArticleSchema,
  publishArticleSchema,
  scheduleArticleSchema,
  getPublicArticleSchema,
  listArticlesQuerySchema,
  BLOCK_TYPES,
  SUPPORTED_LANGS,
};

// MukonoTalks
