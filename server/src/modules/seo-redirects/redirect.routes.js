/**
 * Redirect routes
 * Public: resolve (GET) + track click (POST)
 * Admin: full CRUD + approve/reject workflow
 * @module modules/redirects/redirect.routes
 */

const express = require('express');

const router = express.Router();
const ctrl = require('./redirect.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { cacheResponse, invalidateCache } = require('../../middlewares/cache.middleware');

// ── Public endpoints ──────────────────────────────────────────────────────────
/** Resolve a path to its approved redirect target */
router.get('/resolve', cacheResponse(60), ctrl.resolve);

/** Client-side click tracking — fire-and-forget */
router.post('/track', ctrl.track);

// ── Admin-only — everything below requires authentication + admin role ─────────
router.use(protect, authorize('admin'));

router.get('/stats', ctrl.getStats);
router.get('/', ctrl.getAll);
router.post('/', invalidateCache('/api/redirects'), ctrl.create);
router.put('/:id', invalidateCache('/api/redirects'), ctrl.update);
router.patch('/:id/approve', invalidateCache('/api/redirects'), ctrl.approve);
router.patch('/:id/reject', invalidateCache('/api/redirects'), ctrl.reject);
router.delete('/:id', invalidateCache('/api/redirects'), ctrl.remove);

module.exports = router;

// MukonoTalks

