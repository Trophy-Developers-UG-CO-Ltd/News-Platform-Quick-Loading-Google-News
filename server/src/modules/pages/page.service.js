/**
 * Page service layer
 * Business logic for CMS pages — CRUD, publish workflow, slug validation
 * Audit-logged content changes with immutable trail
 * @module modules/pages/page.service
 */

const Page = require('./page.model');
const NavItem = require('../navigation/nav.model');
const AuditService = require('../audit/audit.service');
const logger = require('../../utils/logger');
const RedirectService = require('../seo-redirects/redirect.service');
const translationService = require('../../services/translationService');

const SUPPORTED_LANGS = ['en', 'zh', 'sw'];

/**
 * Auto-translate page text fields and content blocks.
 * Translates: title, seo title/description, and translatable content blocks.
 * Only fills missing sw/zh — never overwrites existing admin-entered translations.
 * Non-fatal: errors are logged and the save continues.
 *
 * @param {object} data - Page data object (mutated in-place)
 */
async function _injectPageTranslations(data) {
  if (!process.env.GOOGLE_TRANSLATE_API_KEY) return;

  try {
    const fieldsToTranslate = {};
    const existing = {};

    if (data.title?.en) {
      fieldsToTranslate.title = data.title.en;
      existing.title = { sw: data.title?.sw || '', zh: data.title?.zh || '' };
    }

    if (data.seo?.en?.title) {
      fieldsToTranslate.seoTitle = data.seo.en.title;
      existing.seoTitle = { sw: data.seo?.sw?.title || '', zh: data.seo?.zh?.title || '' };
    }

    if (data.seo?.en?.description) {
      fieldsToTranslate.seoDescription = data.seo.en.description;
      existing.seoDescription = { sw: data.seo?.sw?.description || '', zh: data.seo?.zh?.description || '' };
    }

    if (Object.keys(fieldsToTranslate).length > 0) {
      const translations = await translationService.translateFields(fieldsToTranslate, existing);

      if (translations.title) {
        if (!data.title) data.title = {};
        if (translations.title.sw) data.title.sw = translations.title.sw;
        if (translations.title.zh) data.title.zh = translations.title.zh;
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

    // Translate content blocks (text, quote, list types only)
    if (data.contentBlocks?.length > 0) {
      data.contentBlocks = await translationService.translateContentBlocks(data.contentBlocks);
    }
  } catch (err) {
    logger.warn(`[PageService] Auto-translation failed (non-fatal): ${err.message}`);
  }
}

/**
 * Create a new page
 */
const createPage = async (data, req) => {
  // Verify slug uniqueness across all languages
  await _validateSlugUniqueness(data.localizedSlug, null);

  // Sort content blocks by order
  if (data.contentBlocks && data.contentBlocks.length > 0) {
    data.contentBlocks.sort((a, b) => a.order - b.order);
  }

  // Auto-translate English content to Swahili and Chinese
  await _injectPageTranslations(data);

  const page = await Page.create({
    ...data,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  // Audit: page created
  AuditService.log({
    action: 'PAGE_CREATE',
    req,
    targetModel: 'Page',
    targetId: page._id,
    targetIdentifier: page.pageKey,
    metadata: { pageKey: page.pageKey, slug: page.localizedSlug.en },
  });

  return page;
};

/**
 * Update an existing page
 */
const updatePage = async (pageId, data, req) => {
  const page = await Page.findById(pageId);
  if (!page) {
    const error = new Error('Page not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify slug uniqueness if slugs are being updated
  if (data.localizedSlug) {
    await _validateSlugUniqueness(data.localizedSlug, pageId);
  }

  // Sort content blocks by order
  if (data.contentBlocks && data.contentBlocks.length > 0) {
    data.contentBlocks.sort((a, b) => a.order - b.order);
  }

  // Auto-translate English content to Swahili and Chinese
  await _injectPageTranslations(data);

  // Track changes for audit
  const changes = {};
  if (data.title && JSON.stringify(data.title) !== JSON.stringify(page.title)) {
    changes.title = { from: page.title, to: data.title };
  }
  if (data.localizedSlug && JSON.stringify(data.localizedSlug) !== JSON.stringify(page.localizedSlug)) {
    changes.slug = { from: page.localizedSlug, to: data.localizedSlug };
  }
  // Snapshot old slugs before applying update
  const oldLocalizedSlug = { ...page.localizedSlug.toObject?.() ?? page.localizedSlug };
  if (data.contentBlocks) {
    changes.blocksCount = { from: page.contentBlocks.length, to: data.contentBlocks.length };
  }
  if (data.seo && JSON.stringify(data.seo) !== JSON.stringify(page.seo)) {
    changes.seo = true;
  }

  // Apply updates
  Object.assign(page, data);
  page.updatedBy = req.user._id;
  await page.save();

  // Auto-create redirect requests if any localized slug changed
  if (changes.slug) {
    const newSlugs = data.localizedSlug;
    const userId = req.user?._id ?? null;
    const redirectTasks = SUPPORTED_LANGS
      .filter((lang) => oldLocalizedSlug[lang] && newSlugs[lang] && oldLocalizedSlug[lang] !== newSlugs[lang])
      .map((lang) =>
        RedirectService.createRedirect({
          fromPath: `/${lang}/page/${oldLocalizedSlug[lang]}`,
          toPath: `/${lang}/page/${newSlugs[lang]}`,
          statusCode: 301,
          source: 'auto',
          resourceType: 'page',
          resourceId: page._id,
          createdBy: userId,
        }).catch((err) => logger.warn('[PageService] Failed to queue redirect:', err.message))
      );
    await Promise.all(redirectTasks);

    // Auto-update every nav item whose href pointed at an old slug path.
    // This runs server-side so the fix is guaranteed regardless of whether
    // the admin clicks "Apply & Sync" in the client dialog.
    const navUpdateTasks = SUPPORTED_LANGS
      .filter((lang) => oldLocalizedSlug[lang] && newSlugs[lang] && oldLocalizedSlug[lang] !== newSlugs[lang])
      .map((lang) => {
        const oldHref = `/${lang}/page/${oldLocalizedSlug[lang]}`;
        const newHref = `/${lang}/page/${newSlugs[lang]}`;
        return NavItem.updateMany(
          { href: oldHref },
          { $set: { href: newHref } }
        ).then((res) => {
          if (res.modifiedCount > 0) {
            logger.info(`[PageService] Updated ${res.modifiedCount} nav item(s): ${oldHref} → ${newHref}`);
          }
        }).catch((err) => logger.warn('[PageService] Failed to update nav items:', err.message));
      });
    await Promise.all(navUpdateTasks);
  }

  // Audit: page updated
  const actions = [];
  if (changes.blocksCount) actions.push('blocks_modified');
  if (changes.seo) actions.push('seo_changed');
  if (changes.title) actions.push('title_changed');
  if (changes.slug) actions.push('slug_changed');

  AuditService.log({
    action: 'PAGE_UPDATE',
    req,
    targetModel: 'Page',
    targetId: page._id,
    targetIdentifier: page.pageKey,
    changes,
    metadata: { modifications: actions },
  });

  return page;
};

/**
 * Delete a page
 */
const deletePage = async (pageId, req) => {
  const page = await Page.findById(pageId);
  if (!page) {
    const error = new Error('Page not found');
    error.statusCode = 404;
    throw error;
  }

  await Page.findByIdAndDelete(pageId);

  // Audit: page deleted
  AuditService.log({
    action: 'PAGE_DELETE',
    req,
    targetModel: 'Page',
    targetId: page._id,
    targetIdentifier: page.pageKey,
    severity: 'warning',
    metadata: { pageKey: page.pageKey, wasPublished: page.publishStatus === 'published' },
  });

  return { message: 'Page deleted successfully' };
};

/**
 * Publish or unpublish a page
 * Enforces: English content must exist before publishing
 */
const publishPage = async (pageId, action, req) => {
  const page = await Page.findById(pageId);
  if (!page) {
    const error = new Error('Page not found');
    error.statusCode = 404;
    throw error;
  }

  if (action === 'publish') {
    // ── Enforce English content requirement ───────────────────────────────────
    if (!page.title.en) {
      const error = new Error('English title is required before publishing');
      error.statusCode = 400;
      throw error;
    }
    if (!page.localizedSlug.en) {
      const error = new Error('English slug is required before publishing');
      error.statusCode = 400;
      throw error;
    }
    if (!page.contentBlocks || page.contentBlocks.length === 0) {
      const error = new Error('At least one content block is required before publishing');
      error.statusCode = 400;
      throw error;
    }
    // Ensure all blocks have English data
    const missingEnBlock = page.contentBlocks.find((b) => !b.data || !b.data.en);
    if (missingEnBlock) {
      const error = new Error(`Block at order ${missingEnBlock.order} is missing English content`);
      error.statusCode = 400;
      throw error;
    }

    // ── Strict multilingual completeness check ────────────────────────────────
    // Pages are strict-mode content: all translations must be completed
    // before the page is fully multilingual-published.
    const tsw = page.translationStatus?.sw;
    const tzh = page.translationStatus?.zh;
    const allTranslationsComplete = tsw === 'completed' && tzh === 'completed';

    if (!allTranslationsComplete) {
      const missing = [];
      if (tsw !== 'completed') missing.push(`Kiswahili (${tsw || 'pending'})`);
      if (tzh !== 'completed') missing.push(`Chinese (${tzh || 'pending'})`);
      const error = new Error(
        `Cannot publish: translations not yet complete for ${missing.join(', ')}. ` +
        `Wait for auto-translation to finish or trigger manual translation.`
      );
      error.statusCode = 400;
      error.code = 'TRANSLATION_INCOMPLETE';
      error.translationStatus = page.translationStatus;
      throw error;
    }

    page.publishStatus = 'published';
    page.publishedAt = new Date();
    page.publishedBy = req.user._id;
  } else {
    page.publishStatus = 'draft';
  }

  page.updatedBy = req.user._id;
  await page.save();

  // Audit: publish/unpublish
  AuditService.log({
    action: action === 'publish' ? 'PAGE_PUBLISH' : 'PAGE_UNPUBLISH',
    req,
    targetModel: 'Page',
    targetId: page._id,
    targetIdentifier: page.pageKey,
    severity: action === 'publish' ? 'info' : 'warning',
    metadata: { pageKey: page.pageKey, publishStatus: page.publishStatus },
  });

  return page;
};

/**
 * Get page by language and slug (public)
 * Only returns published pages
 */
const getPublicPage = async (lang, slug) => {
  if (!SUPPORTED_LANGS.includes(lang)) {
    const error = new Error(`Unsupported language: ${lang}`);
    error.statusCode = 400;
    throw error;
  }

  const query = {
    publishStatus: 'published',
    $or: [
      { [`localizedSlug.${lang}`]: slug },
      { pageKey: slug },
    ],
  };

  const page = await Page.findOne(query).select('-__v -createdBy -updatedBy -publishedBy').lean();

  if (!page) {
    const error = new Error('Page not found');
    error.statusCode = 404;
    throw error;
  }

  // Return page with localized content, fallback to English
  const servedLang = page.title[lang] ? lang : 'en';
  const isFallback = servedLang !== lang;

  const localizedPage = {
    _id: page._id,
    pageKey: page.pageKey,
    slug: page.localizedSlug[lang] || page.localizedSlug.en,
    title: page.title[lang] || page.title.en,
    contentBlocks: page.contentBlocks
      .sort((a, b) => a.order - b.order)
      .map((block) => ({
        _id: block._id,
        type: block.type,
        order: block.order,
        data: block.data[lang] || block.data.en,
      })),
    seo: page.seo[lang] || page.seo.en || {},
    publishedAt: page.publishedAt,
    // ── Language resolution metadata ──────────────────────────────────────────
    language: {
      requested: lang,
      served: servedLang,
      fallback: isFallback,
    },
    // Provide all available slugs for language switcher / hreflang
    availableSlugs: page.localizedSlug,
    availableLangs: SUPPORTED_LANGS.filter(
      (l) => page.localizedSlug[l] && page.title[l]
    ),
    translationStatus: page.translationStatus || null,
  };

  return localizedPage;
};

/**
 * Get all pages (admin)
 */
const getAllPages = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.status) filter.publishStatus = query.status;
  if (query.search) {
    filter.$or = [
      { pageKey: { $regex: query.search, $options: 'i' } },
      { 'title.en': { $regex: query.search, $options: 'i' } },
    ];
  }

  const [pages, total] = await Promise.all([
    Page.find(filter)
      .select('pageKey title localizedSlug publishStatus publishedAt createdAt updatedAt')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Page.countDocuments(filter),
  ]);

  return {
    pages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get page by pageKey (admin — includes drafts, for CMS status check)
 */
const getByPageKey = async (pageKey) => {
  const page = await Page.findOne({ pageKey })
    .select('_id pageKey title localizedSlug publishStatus publishedAt updatedAt')
    .lean();
  return page || null;
};

/**
 * Get single page by ID (admin — includes drafts)
 */
const getPageById = async (pageId) => {
  const page = await Page.findById(pageId)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .populate('publishedBy', 'name email');

  if (!page) {
    const error = new Error('Page not found');
    error.statusCode = 404;
    throw error;
  }

  return page;
};

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Validate slug uniqueness across all languages
 */
const _validateSlugUniqueness = async (slugs, excludePageId) => {
  for (const lang of SUPPORTED_LANGS) {
    if (slugs[lang]) {
      const query = { [`localizedSlug.${lang}`]: slugs[lang] };
      if (excludePageId) {
        query._id = { $ne: excludePageId };
      }
      const existing = await Page.findOne(query).select('_id pageKey').lean();
      if (existing) {
        const error = new Error(
          `Slug "${slugs[lang]}" is already in use for language "${lang}" (page: ${existing.pageKey})`
        );
        error.statusCode = 409;
        throw error;
      }
    }
  }
};

/**
 * Get page for admin preview (draft or published)
 * Identical to getPublicPage but ignores publishStatus so admins can preview drafts.
 */
const getPageForPreview = async (lang, slug) => {
  if (!SUPPORTED_LANGS.includes(lang)) {
    const error = new Error(`Unsupported language: ${lang}`);
    error.statusCode = 400;
    throw error;
  }

  const page = await Page.findOne({ [`localizedSlug.${lang}`]: slug })
    .select('-__v -createdBy -updatedBy -publishedBy')
    .lean();

  if (!page) {
    const error = new Error('Page not found');
    error.statusCode = 404;
    throw error;
  }

  return {
    _id: page._id,
    pageKey: page.pageKey,
    slug: page.localizedSlug[lang] || page.localizedSlug.en,
    title: page.title[lang] || page.title.en,
    publishStatus: page.publishStatus,
    contentBlocks: page.contentBlocks
      .sort((a, b) => a.order - b.order)
      .map((block) => ({
        _id: block._id,
        type: block.type,
        order: block.order,
        data: block.data[lang] || block.data.en,
      })),
    seo: page.seo[lang] || page.seo.en || {},
    publishedAt: page.publishedAt,
    availableSlugs: page.localizedSlug,
    availableLangs: SUPPORTED_LANGS.filter((l) => page.localizedSlug[l] && page.title[l]),
  };
};

module.exports = {
  createPage,
  updatePage,
  deletePage,
  publishPage,
  getPublicPage,
  getPageForPreview,
  getAllPages,
  getPageById,
  getByPageKey,
};

// MukonoTalks

