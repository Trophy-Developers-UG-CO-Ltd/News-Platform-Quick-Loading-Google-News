/**
 * Article routes
 * Admin-protected CRUD + publish/schedule + public endpoints
 * Cache on public reads, invalidation on mutations
 * @module modules/articles/article.routes
 */

const express = require('express');
const router = express.Router();

const articleController = require('./article.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { cacheResponse, invalidateCache } = require('../../middlewares/cache.middleware');
const {
  createArticleSchema,
  updateArticleSchema,
  publishArticleSchema,
  scheduleArticleSchema,
  getPublicArticleSchema,
  listArticlesQuerySchema,
} = require('./article.validation');

// ─── Admin Routes (Protected — admin only) ─────────────────────

router.get(
  '/admin/analytics',
  protect,
  authorize('admin'),
  articleController.getArticleAnalytics
);

router.get(
  '/admin/all',
  protect,
  authorize('admin'),
  articleController.getAllArticles
);

router.get(
  '/admin/:id',
  protect,
  authorize('admin'),
  articleController.getArticleById
);

router.post(
  '/',
  protect,
  authorize('admin'),
  validate(createArticleSchema),
  invalidateCache('/api/articles'),
  articleController.createArticle
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  validate(updateArticleSchema),
  invalidateCache('/api/articles'),
  articleController.updateArticle
);

router.patch(
  '/publish/:id',
  protect,
  authorize('admin'),
  validate(publishArticleSchema),
  invalidateCache('/api/articles'),
  articleController.publishArticle
);

router.patch(
  '/schedule/:id',
  protect,
  authorize('admin'),
  validate(scheduleArticleSchema),
  invalidateCache('/api/articles'),
  articleController.scheduleArticle
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  invalidateCache('/api/articles'),
  articleController.deleteArticle
);

// ─── Public Routes ─────────────────────────────────────────────

router.get(
  '/',
  validate(listArticlesQuerySchema),
  cacheResponse(180),
  articleController.listPublicArticles
);

router.get(
  '/:lang/:slug',
  validate(getPublicArticleSchema),
  cacheResponse(300),
  articleController.getPublicArticle
);

module.exports = router;

// MukonoTalks

