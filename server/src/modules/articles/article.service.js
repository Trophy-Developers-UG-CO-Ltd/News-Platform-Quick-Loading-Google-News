/**
 * Update an existing article
 */
const updateArticle = async (articleId, data, req) => {
  const article = await Article.findById(articleId);
  if (!article) {
    const error = new Error('Article not found');
    error.statusCode = 404;
    throw error;
  }

  if (data.localizedSlug) {
    await _validateSlugUniqueness(data.localizedSlug, articleId);
  }

  if (data.contentBlocks && data.contentBlocks.length > 0) {
    data.contentBlocks.sort((a, b) => a.order - b.order);
  }
  if (data.tags) {
    data.tags = data.tags.map((t) => t.toLowerCase().trim());
  }

  // Auto-translate English content to Swahili and Chinese
  await _injectArticleTranslations(data);

  // Track changes for audit
  const changes = {};
  if (data.title && JSON.stringify(data.title) !== JSON.stringify(article.title)) {
    changes.title = { from: article.title, to: data.title };
  }
  if (data.localizedSlug && JSON.stringify(data.localizedSlug) !== JSON.stringify(article.localizedSlug)) {
    changes.slug = { from: article.localizedSlug, to: data.localizedSlug };
  }
  // Snapshot old slugs before applying update
  const oldLocalizedSlug = { ...article.localizedSlug.toObject?.() ?? article.localizedSlug };
  if (data.contentBlocks) {
    changes.blocksCount = { from: article.contentBlocks.length, to: data.contentBlocks.length };
  }
  if (data.category && data.category !== article.category) {
    changes.category = { from: article.category, to: data.category };
  }
  if (data.seo && JSON.stringify(data.seo) !== JSON.stringify(article.seo)) {
    changes.seo = true;
  }

  Object.assign(article, data);
  article.updatedBy = req.user._id;
  await article.save();

  // Auto-create redirect requests if any localized slug changed
  if (changes.slug) {
    const newSlugs = data.localizedSlug;
    const userId = req.user?._id ?? null;
    const redirectTasks = SUPPORTED_LANGS
      .filter((lang) => oldLocalizedSlug[lang] && newSlugs[lang] && oldLocalizedSlug[lang] !== newSlugs[lang])
      .map((lang) =>
        RedirectService.createRedirect({
          fromPath: `/${lang}/blog/${oldLocalizedSlug[lang]}`,
          toPath: `/${lang}/blog/${newSlugs[lang]}`,
          statusCode: 301,
          source: 'auto',
          resourceType: 'article',
          resourceId: article._id,
          createdBy: userId,
        }).catch((err) => logger.warn('[ArticleService] Failed to queue redirect:', err.message))
      );
    await Promise.all(redirectTasks);
  }

  const actions = [];
  if (changes.title) actions.push('title_changed');
  if (changes.slug) actions.push('slug_changed');
  if (changes.blocksCount) actions.push('blocks_modified');
  if (changes.category) actions.push('category_changed');
  if (changes.seo) actions.push('seo_changed');

  AuditService.log({
    action: 'ARTICLE_UPDATE',
    req,
    targetModel: 'Article',
    targetId: article._id,
    targetIdentifier: article.localizedSlug.en,
    changes,
    metadata: { modifications: actions },
  });

  return article;
};
/**
 * Transition article status (review, approve, request edit, etc.)
 * Only allowed by specific roles for each transition
 */
const transitionArticleStatus = async (articleId, newStatus, req, note = '') => {
  const article = await Article.findById(articleId);
  if (!article) {
    const error = new Error('Article not found');
    error.statusCode = 404;
    throw error;
  }

  // Role-based permission enforcement
  const role = req.user.role;
  const allowedTransitions = {
    draft: ['in_review'],
    in_review: ['needs_edit', 'approved'],
    needs_edit: ['in_review'],
    approved: ['scheduled', 'published'],
    scheduled: ['published'],
    published: ['draft'],
  };
  const canTransition = allowedTransitions[article.publishStatus]?.includes(newStatus);
  if (!canTransition) {
    const error = new Error(`Cannot transition from ${article.publishStatus} to ${newStatus}`);
    error.statusCode = 400;
    throw error;
  }

  // Only editors/admins can approve, schedule, or publish
  if (["approved", "scheduled", "published"].includes(newStatus) && !['editor', 'admin', 'developer'].includes(role)) {
    const error = new Error('Only editors or admins can approve, schedule, or publish');
    error.statusCode = 403;
    throw error;
  }
  // Only writers can submit for review or request edit
  if (["in_review", "needs_edit"].includes(newStatus) && !['writer', 'editor', 'admin', 'developer'].includes(role)) {
    const error = new Error('Only writers, editors, or admins can submit for review or request edit');
    error.statusCode = 403;
    throw error;
  }

  // Save workflow history
  article.workflowHistory.push({
    status: newStatus,
    changedBy: req.user._id,
    changedAt: new Date(),
    note,
  });
  article.publishStatus = newStatus;
  article.updatedBy = req.user._id;
  await article.save();
  return article;
};

/**
 * Save previous version on update
 */
const saveVersionOnUpdate = async (article, req) => {
  article.versions = article.versions || [];
  article.versions.push({
    contentBlocks: article.contentBlocks,
    title: article.title,
    excerpt: article.excerpt,
    seo: article.seo,
    videoMeta: article.videoMeta,
    updatedBy: req.user._id,
    updatedAt: new Date(),
  });
  // Limit version history to last 20
  if (article.versions.length > 20) article.versions = article.versions.slice(-20);
  await article.save();
};

/**
 * Rollback to a previous version
 */
const rollbackArticleVersion = async (articleId, versionIndex, req) => {
  const article = await Article.findById(articleId);
  if (!article) {
    const error = new Error('Article not found');
    error.statusCode = 404;
    throw error;
  }
  if (!article.versions || !article.versions[versionIndex]) {
    const error = new Error('Version not found');
    error.statusCode = 404;
    throw error;
  }
  // Only editors/admins can rollback
  if (!['editor', 'admin', 'developer'].includes(req.user.role)) {
    const error = new Error('Only editors or admins can rollback');
    error.statusCode = 403;
    throw error;
  }
  const version = article.versions[versionIndex];
  article.contentBlocks = version.contentBlocks;
  article.title = version.title;
  article.excerpt = version.excerpt;
  article.seo = version.seo;
  article.videoMeta = version.videoMeta || article.videoMeta;
  article.updatedBy = req.user._id;
  await article.save();
  return article;
};
/**
 * Article service layer
 * Business logic for enterprise publishing engine
 * CRUD, publish/schedule workflow, slug validation, analytics, audit trail
 * @module modules/articles/article.service
 */

const Article = require('./article.model');
const AuditService = require('../audit/audit.service');
const logger = require('../../utils/logger');
const RedirectService = require('../seo-redirects/redirect.service');
const translationService = require('../../services/translationService');

const SUPPORTED_LANGS = ['en', 'zh', 'sw'];

/**
 * Auto-translate article text fields and content blocks.
 * Translates: title, excerpt, seo title/description, and translatable content blocks.
 * Only fills missing sw/zh — never overwrites existing translations.
 * Non-fatal: errors are logged and the save continues.
 *
 * @param {object} data - Article data (mutated in-place)
 */
async function _injectArticleTranslations(data) {
  if (!process.env.GOOGLE_TRANSLATE_API_KEY) return;

  try {
    // ── Scalar fields ────────────────────────────────────────────────────────
    const fieldsToTranslate = {};
    const existing = {};

    if (data.title?.en) {
      fieldsToTranslate.title = data.title.en;
      existing.title = { sw: data.title?.sw || '', zh: data.title?.zh || '' };
    }

    if (data.excerpt?.en) {
      fieldsToTranslate.excerpt = data.excerpt.en;
      existing.excerpt = { sw: data.excerpt?.sw || '', zh: data.excerpt?.zh || '' };
    }

    // SEO fields: translate title + description from English SEO object
    if (data.seo?.en?.title) {
      fieldsToTranslate.seoTitle = data.seo.en.title;
      existing.seoTitle = {
        sw: data.seo?.sw?.title || '',
        zh: data.seo?.zh?.title || '',
      };
    }

    if (data.seo?.en?.description) {
      fieldsToTranslate.seoDescription = data.seo.en.description;
      existing.seoDescription = {
        sw: data.seo?.sw?.description || '',
        zh: data.seo?.zh?.description || '',
      };
    }

    if (Object.keys(fieldsToTranslate).length > 0) {
      const translations = await translationService.translateFields(fieldsToTranslate, existing);

      if (translations.title) {
        if (!data.title) data.title = {};
        if (translations.title.sw) data.title.sw = translations.title.sw;
        if (translations.title.zh) data.title.zh = translations.title.zh;
      }

      if (translations.excerpt) {
        if (!data.excerpt) data.excerpt = {};
        if (translations.excerpt.sw) data.excerpt.sw = translations.excerpt.sw;
        if (translations.excerpt.zh) data.excerpt.zh = translations.excerpt.zh;
      }

      if (translations.seoTitle || translations.seoDescription) {
        if (!data.seo) data.seo = {};
        for (const lang of translationService.TARGET_LANGS) {
          if (!data.seo[lang]) data.seo[lang] = {};
          if (translations.seoTitle?.[lang]) data.seo[lang].title = translations.seoTitle[lang];
          if (translations.seoDescription?.[lang]) data.seo[lang].description = translations.seoDescription[lang];
        }
      }
    }

    // ── Content blocks ────────────────────────────────────────────────────────
    if (data.contentBlocks?.length > 0) {
      data.contentBlocks = await translationService.translateContentBlocks(data.contentBlocks);
    }
  } catch (err) {
    logger.warn(`[ArticleService] Auto-translation failed (non-fatal): ${err.message}`);
  }
}

/**
 * Create a new article
 */
const createArticle = async (data, req) => {
  await _validateSlugUniqueness(data.localizedSlug, null);

  if (data.contentBlocks && data.contentBlocks.length > 0) {
    data.contentBlocks.sort((a, b) => a.order - b.order);
  }
  if (data.tags) {
    data.tags = data.tags.map((t) => t.toLowerCase().trim());
  }

  // Auto-translate English content to Swahili and Chinese
  await _injectArticleTranslations(data);

  const article = await Article.create({
    ...data,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  AuditService.log({
    action: 'ARTICLE_CREATE',
    req,
    targetModel: 'Article',
    targetId: article._id,
    targetIdentifier: article.localizedSlug.en,
    metadata: { category: article.category, slug: article.localizedSlug.en },
  });

  return article;
};

/**
 * Update an existing article
 */

const publishArticle = async (articleId, action, req) => {
  const logger = require('../../utils/logger');
  logger.info(`[publishArticle] Attempting to ${action} article: id=${articleId}`);
  const article = await Article.findById(articleId);
  if (!article) {
    logger.error(`[publishArticle] Article not found: id=${articleId}`);
    const error = new Error('Article not found');
    error.statusCode = 404;
    throw error;
  }

  if (action === 'publish') {
    _enforceEnglishContent(article);
    article.publishStatus = 'published';
    article.publishedAt = new Date();
    article.publishedBy = req.user._id;
    article.scheduledAt = null; // Clear any schedule
    logger.info(`[publishArticle] Article published: id=${articleId}, slug=${article.localizedSlug.en}, category=${article.category}`);
  } else {
    article.publishStatus = 'draft';
    logger.info(`[publishArticle] Article unpublished (set to draft): id=${articleId}`);
  }

  article.updatedBy = req.user._id;
  await article.save();

  AuditService.log({
    action: action === 'publish' ? 'ARTICLE_PUBLISH' : 'ARTICLE_UNPUBLISH',
    req,
    targetModel: 'Article',
    targetId: article._id,
    targetIdentifier: article.localizedSlug.en,
    severity: action === 'publish' ? 'info' : 'warning',
    metadata: { category: article.category, publishStatus: article.publishStatus },
  });


  return article;
};

/**
 * Delete an article
 */
const deleteArticle = async (articleId, req) => {
  const article = await Article.findById(articleId);
  if (!article) {
    const error = new Error('Article not found');
    error.statusCode = 404;
    throw error;
  }

  await Article.findByIdAndDelete(articleId);

  AuditService.log({
    action: 'ARTICLE_DELETE',
    req,
    targetModel: 'Article',
    targetId: article._id,
    targetIdentifier: article.localizedSlug.en,
    severity: 'warning',
    metadata: { category: article.category, wasPublished: article.publishStatus === 'published' },
  });

  return { message: 'Article deleted successfully' };
};



/**
 * Schedule an article for future publishing
 */
const scheduleArticle = async (articleId, scheduledAt, req) => {
  const article = await Article.findById(articleId);
  if (!article) {
    const error = new Error('Article not found');
    error.statusCode = 404;
    throw error;
  }

  _enforceEnglishContent(article);

  const scheduleDate = new Date(scheduledAt);
  if (scheduleDate <= new Date()) {
    const error = new Error('Scheduled date must be in the future');
    error.statusCode = 400;
    throw error;
  }

  article.publishStatus = 'scheduled';
  article.scheduledAt = scheduleDate;
  article.updatedBy = req.user._id;
  await article.save();

  AuditService.log({
    action: 'ARTICLE_SCHEDULE',
    req,
    targetModel: 'Article',
    targetId: article._id,
    targetIdentifier: article.localizedSlug.en,
    metadata: { scheduledAt: scheduleDate.toISOString(), category: article.category },
  });

  return article;
};

/**
 * Get public article by language and slug
 * Only returns published articles (not draft or scheduled)
 * Increments view count atomically
 */

const getPublicArticle = async (lang, slug) => {
  const logger = require('../../utils/logger');
  logger.info(`[getPublicArticle] Fetching article: lang=${lang}, slug=${slug}`);
  if (!SUPPORTED_LANGS.includes(lang)) {
    logger.warn(`[getPublicArticle] Unsupported language: ${lang}`);
    const error = new Error(`Unsupported language: ${lang}`);
    error.statusCode = 400;
    throw error;
  }

  const query = {
    publishStatus: 'published',
    [`localizedSlug.${lang}`]: slug,
  };
  logger.debug(`[getPublicArticle] Query: ${JSON.stringify(query)}`);

  // Atomically increment view count and return document
  const article = await Article.findOneAndUpdate(
    query,
    { $inc: { viewCount: 1 } },
    { new: true }
  )
    .select('-__v -createdBy -updatedBy -publishedBy')
    .populate('relatedProducts.product', 'name slug price featuredImage')
    .lean();

  if (!article) {
    // Extra diagnostics: check if article exists with this slug in any status/lang
    const alt = await Article.findOne({
      $or: [
        { [`localizedSlug.${lang}`]: slug },
        { [`localizedSlug.en`]: slug },
        { [`localizedSlug.zh`]: slug },
        { [`localizedSlug.sw`]: slug },
      ],
    });
    if (!alt) {
      logger.error(`[getPublicArticle] No article found for slug='${slug}' in any language.`);
    } else {
      logger.warn(`[getPublicArticle] Article found for slug='${slug}' but publishStatus='${alt.publishStatus}'.`);
    }
    const error = new Error('Article not found');
    error.statusCode = 404;
    throw error;
  }

  // Return localized content with English fallback
  const localizedArticle = {
    _id: article._id,
    slug: article.localizedSlug[lang] || article.localizedSlug.en,
    title: article.title[lang] || article.title.en,
    excerpt: article.excerpt[lang] || article.excerpt.en || null,
    contentBlocks: article.contentBlocks
      .sort((a, b) => a.order - b.order)
      .map((block) => ({
        _id: block._id,
        type: block.type,
        order: block.order,
        data: block.data[lang] || block.data.en,
      })),
    category: article.category,
    tags: article.tags,
    author: article.author,
    featuredImage: article.featuredImage,
    seo: article.seo[lang] || article.seo.en || {},
    videoMeta: article.videoMeta || {},
    publishedAt: article.publishedAt,
    viewCount: article.viewCount,
    relatedProducts: article.relatedProducts || [],
    attachments: article.attachments || [],
    technicalReferences: article.technicalReferences || [],
    availableSlugs: article.localizedSlug,
    availableLangs: SUPPORTED_LANGS.filter(
      (l) => article.localizedSlug[l] && article.title[l]
    ),
  };

  logger.info(`[getPublicArticle] Article found: id=${localizedArticle._id}, category=${localizedArticle.category}, publishStatus=published`);
  return localizedArticle;
};

/**
 * List articles (public — published only, or admin — all statuses)
 */
const listArticles = async (query = {}, isAdmin = false) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const sortField = query.sort || 'publishedAt';

  const filter = {};

  // Public: only published articles; Admin: all or filtered by status
  if (!isAdmin) {
    filter.publishStatus = 'published';
  } else if (query.status) {
    filter.publishStatus = query.status;
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.tag) {
    filter.tags = query.tag.toLowerCase().trim();
  }

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  const sortOrder = sortField === 'viewCount' ? { viewCount: -1 } : { [sortField]: -1 };

  const [articles, total] = await Promise.all([
    Article.find(filter)
      .select('title localizedSlug excerpt category tags author featuredImage publishStatus publishedAt scheduledAt viewCount createdAt updatedAt')
      .populate('createdBy', 'name email')
      .sort(sortOrder)
      .skip(skip)
      .limit(limit)
      .lean(),
    Article.countDocuments(filter),
  ]);

  return {
    articles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single article by ID (admin — includes drafts/scheduled)
 */
const getArticleById = async (articleId) => {
  const article = await Article.findById(articleId)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .populate('publishedBy', 'name email')
    .populate('relatedProducts.product', 'name slug price');

  if (!article) {
    const error = new Error('Article not found');
    error.statusCode = 404;
    throw error;
  }

  return article;
};

/**
 * Get article analytics summary (admin)
 */
const getArticleAnalytics = async () => {
  const [
    totalArticles,
    publishedCount,
    draftCount,
    scheduledCount,
    topByViews,
    byCategory,
    topTags,
  ] = await Promise.all([
    Article.countDocuments(),
    Article.countDocuments({ publishStatus: 'published' }),
    Article.countDocuments({ publishStatus: 'draft' }),
    Article.countDocuments({ publishStatus: 'scheduled' }),
    Article.find({ publishStatus: 'published' })
      .sort({ viewCount: -1 })
      .limit(10)
      .select('title.en localizedSlug.en category viewCount publishedAt')
      .lean(),
    Article.aggregate([
      { $match: { publishStatus: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 }, totalViews: { $sum: '$viewCount' } } },
      { $sort: { totalViews: -1 } },
    ]),
    Article.aggregate([
      { $match: { publishStatus: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
  ]);

  return {
    totalArticles,
    publishedCount,
    draftCount,
    scheduledCount,
    topByViews,
    byCategory,
    topTags,
  };
};

/**
 * Process scheduled articles — publish articles whose scheduledAt has passed
 * Called by a cron job or interval check
 */
const processScheduledArticles = async () => {
  const now = new Date();
  const articlesToPublish = await Article.find({
    publishStatus: 'scheduled',
    scheduledAt: { $lte: now },
  });

  let published = 0;
  for (const article of articlesToPublish) {
    article.publishStatus = 'published';
    article.publishedAt = now;
    article.scheduledAt = null;
    await article.save();

    AuditService.log({
      action: 'ARTICLE_AUTO_PUBLISH',
      targetModel: 'Article',
      targetId: article._id,
      targetIdentifier: article.localizedSlug.en,
      metadata: { category: article.category, autoPublished: true },
    });

    published++;
  }

  if (published > 0) {
    logger.info(`Auto-published ${published} scheduled article(s)`);
  }

  return { published };
};

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Enforce English content exists before publish/schedule
 */
const _enforceEnglishContent = (article) => {
  if (!article.title.en) {
    const error = new Error('English title is required before publishing');
    error.statusCode = 400;
    throw error;
  }
  if (!article.localizedSlug.en) {
    const error = new Error('English slug is required before publishing');
    error.statusCode = 400;
    throw error;
  }
  if (!article.contentBlocks || article.contentBlocks.length === 0) {
    const error = new Error('At least one content block is required before publishing');
    error.statusCode = 400;
    throw error;
  }
  const missingEnBlock = article.contentBlocks.find((b) => !b.data || !b.data.en);
  if (missingEnBlock) {
    const error = new Error(`Block at order ${missingEnBlock.order} is missing English content`);
    error.statusCode = 400;
    throw error;
  }
};

/**
 * Validate slug uniqueness across all languages
 */
const _validateSlugUniqueness = async (slugs, excludeArticleId) => {
  for (const lang of SUPPORTED_LANGS) {
    if (slugs[lang]) {
      const query = { [`localizedSlug.${lang}`]: slugs[lang] };
      if (excludeArticleId) {
        query._id = { $ne: excludeArticleId };
      }
      const existing = await Article.findOne(query).select('_id localizedSlug.en').lean();
      if (existing) {
        const error = new Error(
          `Slug "${slugs[lang]}" is already in use for language "${lang}" (article: ${existing.localizedSlug?.en})`
        );
        error.statusCode = 409;
        throw error;
      }
    }
  }
};

module.exports = {
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  scheduleArticle,
  getPublicArticle,
  listArticles,
  getArticleById,
  getArticleAnalytics,
  processScheduledArticles,
  transitionArticleStatus,
  rollbackArticleVersion,
  saveVersionOnUpdate,
};

// MukonoTalks
