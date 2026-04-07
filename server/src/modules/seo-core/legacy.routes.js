/**
 * SEO Schema routes
 * Admin-protected write operations, public read for global schemas
 * @module modules/seo/seo.routes
 */

const express = require('express');
const router = express.Router();
const seoController = require('./legacy.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { cacheResponse, invalidateCache } = require('../../middlewares/cache.middleware');

// ─── Public endpoints ───────────────────────────────────────────────────────
// Used by the React app to inject schemas on every page
router.get('/global', cacheResponse(300), seoController.getGlobalSchemas);
router.get('/:key',   cacheResponse(300), seoController.getSchemaByKey);

// ─── Admin endpoints ────────────────────────────────────────────────────────
router.get(
  '/',
  protect,
  authorize('admin'),
  seoController.getAllSchemas
);

router.put(
  '/:key',
  protect,
  authorize('admin'),
  invalidateCache('/api/seo'),
  seoController.upsertSchema
);

router.delete(
  '/:key',
  protect,
  authorize('admin'),
  invalidateCache('/api/seo'),
  seoController.deleteSchema
);

module.exports = router;

// MukonoTalks

