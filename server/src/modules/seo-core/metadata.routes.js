/**
 * SEO Metadata routes
 * @module modules/seo-metadata/metadata.routes
 */

const express  = require('express');
const router   = express.Router();
const ctrl     = require('./metadata.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize }         = require('../../middlewares/role.middleware');

const admin = [protect, authorize('admin')];

// ── Public ──────────────────────────────────────────────────
// Returns minimal SEO data for frontend rendering
router.get('/public/:pageSlug', ctrl.getBySlug);

// ── Admin ────────────────────────────────────────────────────
router.get('/stats',                    ...admin, ctrl.getStats);
router.get('/',                         ...admin, ctrl.getAll);
router.get('/:pageSlug/preview',        ...admin, ctrl.getSerpPreview);
router.get('/:pageSlug',                ...admin, ctrl.getBySlug);
router.put('/:pageSlug',                ...admin, ctrl.upsert);
router.post('/:pageSlug/analyze',       ...admin, ctrl.analyze);
router.post('/canonicals/auto-fill',    ...admin, ctrl.autoFillCanonicals);
router.delete('/:pageSlug',             ...admin, ctrl.remove);

module.exports = router;

// MukonoTalks

