/**
 * Article controller
 * HTTP handlers for enterprise publishing engine
 * Admin CRUD + publish/schedule + public fetch + analytics
 * @module modules/articles/article.controller
 */

const articleService = require('./article.service');
const { asyncHandler } = require('../../middlewares/error.middleware');

/**
 * Transition article status (review, approve, request edit, etc.)
 * PATCH /api/articles/transition/:id
 */
const transitionArticleStatus = asyncHandler(async (req, res) => {
  try {
    const { newStatus, note } = req.body;
    const article = await articleService.transitionArticleStatus(req.params.id, newStatus, req, note);
    res.status(200).json({ success: true, article });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * Rollback to a previous version
 * PATCH /api/articles/rollback/:id
 */
const rollbackArticleVersion = asyncHandler(async (req, res) => {
  try {
    const { versionIndex } = req.body;
    const article = await articleService.rollbackArticleVersion(req.params.id, versionIndex, req);
    res.status(200).json({ success: true, article });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * Create a new article (Admin)
 * POST /api/articles
 */
const createArticle = asyncHandler(async (req, res) => {
  try {
    const article = await articleService.createArticle(req.body, req);
    res.status(201).json({ success: true, article });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * Update an article (Admin)
 * PUT /api/articles/:id
 */
const updateArticle = asyncHandler(async (req, res) => {
  try {
    const article = await articleService.updateArticle(req.params.id, req.body, req);
    res.status(200).json({ success: true, article });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * Delete an article (Admin)
 * DELETE /api/articles/:id
 */
const deleteArticle = asyncHandler(async (req, res) => {
  try {
    const result = await articleService.deleteArticle(req.params.id, req);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * Publish or unpublish an article (Admin)
 * PATCH /api/articles/publish/:id
 */
const publishArticle = asyncHandler(async (req, res) => {
  try {
    const article = await articleService.publishArticle(req.params.id, req.body.action, req);
    res.status(200).json({ success: true, article });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * Schedule an article (Admin)
 * PATCH /api/articles/schedule/:id
 */
const scheduleArticle = asyncHandler(async (req, res) => {
  try {
    const article = await articleService.scheduleArticle(req.params.id, req.body.scheduledAt, req);
    res.status(200).json({ success: true, article });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * Get public article by language and slug
 * GET /api/articles/:lang/:slug
 */
const getPublicArticle = asyncHandler(async (req, res) => {
  try {
    const article = await articleService.getPublicArticle(req.params.lang, req.params.slug);
    res.status(200).json({ success: true, article });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * List articles (public — published only)
 * GET /api/articles?category=&tag=&search=&page=
 */
const listPublicArticles = asyncHandler(async (req, res) => {
  try {
    const result = await articleService.listArticles(req.query, false);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * Get all articles (Admin — includes draft/scheduled)
 * GET /api/articles/admin/all
 */
const getAllArticles = asyncHandler(async (req, res) => {
  try {
    const result = await articleService.listArticles(req.query, true);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * Get article by ID (Admin — includes drafts)
 * GET /api/articles/admin/:id
 */
const getArticleById = asyncHandler(async (req, res) => {
  try {
    const article = await articleService.getArticleById(req.params.id);
    res.status(200).json({ success: true, article });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * Get article analytics (Admin)
 * GET /api/articles/admin/analytics
 */
const getArticleAnalytics = asyncHandler(async (req, res) => {
  try {
    const analytics = await articleService.getArticleAnalytics();
    res.status(200).json({ success: true, analytics });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

module.exports = {
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  scheduleArticle,
  getPublicArticle,
  listPublicArticles,
  getAllArticles,
  getArticleById,
  getArticleAnalytics,
  transitionArticleStatus,
  rollbackArticleVersion,
};

// MukonoTalks

