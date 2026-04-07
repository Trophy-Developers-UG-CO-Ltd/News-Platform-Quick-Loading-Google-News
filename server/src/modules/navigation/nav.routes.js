/**
 * Navigation routes
 * Public GET + admin-protected CRUD for nav menu items
 * @module modules/navigation/nav.routes
 */

const express = require('express');
const router = express.Router();

const navController = require('./nav.controller');
const { protect }   = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { cacheResponse, invalidateCache } = require('../../middlewares/cache.middleware');

/* ─── Public ─────────────────────────────────────────────────── */
router.get('/', cacheResponse(300), navController.getPublicNav);

/* ─── Admin ──────────────────────────────────────────────────── */
router.get('/admin', protect, authorize('admin'), navController.getAllNav);

router.put(
  '/',
  protect,
  authorize('admin'),
  invalidateCache('/api/navigation'),
  navController.bulkUpdate
);

router.post(
  '/',
  protect,
  authorize('admin'),
  invalidateCache('/api/navigation'),
  navController.createNavItem
);

router.patch(
  '/:id',
  protect,
  authorize('admin'),
  invalidateCache('/api/navigation'),
  navController.updateNavItem
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  invalidateCache('/api/navigation'),
  navController.deleteNavItem
);

module.exports = router;

// MukonoTalks

