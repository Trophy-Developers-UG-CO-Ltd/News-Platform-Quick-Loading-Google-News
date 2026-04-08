/**
 * Page controller
 * HTTP handlers for CMS page operations
 * Admin CRUD + public fetch with publish enforcement
 * @module modules/pages/page.controller
 */

const pageService = require('./page.service');
const { asyncHandler } = require('../../middlewares/error.middleware');

/**
 * Create a new page (Admin)
 * POST /api/pages
 */
const createPage = asyncHandler(async (req, res) => {
  try {
    const page = await pageService.createPage(req.body, req);
    res.status(201).json({ success: true, page });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * Update a page (Admin)
 * PUT /api/pages/:id
 */
const updatePage = asyncHandler(async (req, res) => {
  try {
    const page = await pageService.updatePage(req.params.id, req.body, req);
    res.status(200).json({ success: true, page });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * Delete a page (Admin)
 * DELETE /api/pages/:id
 */
const deletePage = asyncHandler(async (req, res) => {
  try {
    const result = await pageService.deletePage(req.params.id, req);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * Publish or unpublish a page (Admin)
 * PATCH /api/pages/publish/:id
 */
const publishPage = asyncHandler(async (req, res) => {
  try {
    const page = await pageService.publishPage(req.params.id, req.body.action, req);
    res.status(200).json({ success: true, page });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * Preview page by language and slug (Admin — draft or published)
 * GET /api/pages/admin/preview/:lang/:slug
 */
const previewPage = asyncHandler(async (req, res) => {
  try {
    const page = await pageService.getPageForPreview(req.params.lang, req.params.slug);
    res.status(200).json({ success: true, page });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * Get public page by language and slug
 * GET /api/pages/:lang/:slug
 */
const getPublicPage = asyncHandler(async (req, res) => {
  try {
    const page = await pageService.getPublicPage(req.params.lang, req.params.slug);
    res.status(200).json({ success: true, page });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * Search published pages (public)
 * GET /api/pages/search
 */
const searchPublicPages = asyncHandler(async (req, res) => {
  try {
    const { query, lang = 'en', limit = 6 } = req.query;
    const pages = await pageService.searchPublicPages(query, {
      lang,
      limit: Number(limit),
    });
    res.status(200).json({ success: true, pages });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * Get all pages (Admin)
 * GET /api/pages/admin/all
 */
const getAllPages = asyncHandler(async (req, res) => {
  try {
    const result = await pageService.getAllPages(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * Get page by ID (Admin — includes drafts)
 * GET /api/pages/admin/:id
 */
const getPageById = asyncHandler(async (req, res) => {
  try {
    const page = await pageService.getPageById(req.params.id);
    res.status(200).json({ success: true, page });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * Get page by pageKey (Admin — includes drafts)
 * GET /api/pages/admin/key/:pageKey
 */
const getPageByKey = asyncHandler(async (req, res) => {
  try {
    const page = await pageService.getByPageKey(req.params.pageKey);
    res.status(200).json({ success: true, page });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

module.exports = {
  createPage,
  updatePage,
  deletePage,
  publishPage,
  getPublicPage,
  searchPublicPages,
  previewPage,
  getAllPages,
  getPageById,
  getPageByKey,
};

// MukonoTalks

