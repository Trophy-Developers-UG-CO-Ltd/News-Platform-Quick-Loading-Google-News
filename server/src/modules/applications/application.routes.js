/**
 * Application routes
 * Public typeahead search + admin CRUD
 * @module modules/applications/application.routes
 */

const express = require('express');
const router  = express.Router();

const applicationController = require('./application.controller');
const { protect, optionalAuth } = require('../../middlewares/auth.middleware');
const { authorize }            = require('../../middlewares/role.middleware');
const { cacheResponse, invalidateCache } = require('../../middlewares/cache.middleware');

// ── Public ────────────────────────────────────────────────────────────────────
// Used by frontend typeahead and public application pages
router.get('/', cacheResponse(120), applicationController.getApplications);
router.get('/slug/:slug', optionalAuth, cacheResponse(120), applicationController.getApplicationBySlug);

// ── Admin (protected) ─────────────────────────────────────────────────────────
router.post(
  '/',
  protect, authorize('admin'),
  invalidateCache('/api/applications'),
  applicationController.createApplication
);
router.get(
  '/:id',
  protect, authorize('admin'),
  applicationController.getApplicationById
);
router.put(
  '/:id',
  protect, authorize('admin'),
  invalidateCache('/api/applications'),
  applicationController.updateApplication
);
router.delete(
  '/:id',
  protect, authorize('admin'),
  invalidateCache('/api/applications'),
  applicationController.deleteApplication
);

module.exports = router;

// MukonoTalks

