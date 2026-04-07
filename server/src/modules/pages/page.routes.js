/**
 * Page routes
 * Admin-protected CRUD + public fetch with RBAC enforcement
 * Cache on public endpoints, invalidation on mutations
 * @module modules/pages/page.routes
 */

const express = require('express');
const router = express.Router();

const pageController = require('./page.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { cacheResponse, invalidateCache } = require('../../middlewares/cache.middleware');
const {
  createPageSchema,
  updatePageSchema,
  publishPageSchema,
  getPublicPageSchema,
} = require('./page.validation');

// ─── Admin Routes (Protected — admin only) ─────────────────────
router.get(
  '/admin/all',
  protect,
  authorize('admin'),
  pageController.getAllPages
);

router.get(
  '/admin/key/:pageKey',
  protect,
  authorize('admin'),
  pageController.getPageByKey
);

router.get(
  '/admin/preview/:lang/:slug',
  protect,
  authorize('admin'),
  validate(getPublicPageSchema),
  pageController.previewPage
);

router.get(
  '/admin/:id',
  protect,
  authorize('admin'),
  pageController.getPageById
);

router.post(
  '/',
  protect,
  authorize('admin'),
  validate(createPageSchema),
  invalidateCache('/api/pages'),
  pageController.createPage
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  validate(updatePageSchema),
  invalidateCache('/api/pages'),
  pageController.updatePage
);

router.patch(
  '/publish/:id',
  protect,
  authorize('admin'),
  validate(publishPageSchema),
  invalidateCache('/api/pages'),
  pageController.publishPage
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  invalidateCache('/api/pages'),
  pageController.deletePage
);

// ─── Public Route ──────────────────────────────────────────────
router.get(
  '/:lang/:slug',
  validate(getPublicPageSchema),
  cacheResponse(300),
  pageController.getPublicPage
);

module.exports = router;

// MukonoTalks

