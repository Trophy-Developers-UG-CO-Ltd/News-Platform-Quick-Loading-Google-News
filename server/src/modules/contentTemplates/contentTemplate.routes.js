/**
 * ContentTemplate routes
 * Admin: full CRUD + version restore
 * Public (cached): read by type (used by application page renderer)
 * @module modules/contentTemplates/contentTemplate.routes
 */

const express = require('express');
const router = express.Router();

const ctrl = require('./contentTemplate.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { cacheResponse, invalidateCache } = require('../../middlewares/cache.middleware');
const {
  createTemplateSchema,
  updateTemplateSchema,
  restoreRevisionSchema,
} = require('./contentTemplate.validation');

const adminGuard = [protect, authorize('admin')];
const invalidate = invalidateCache('/api/content-templates');

// ── Public (cached 10 min) ─────────────────────────────────────
router.get('/type/:type', cacheResponse(600), ctrl.getTemplateByType);

// ── Preview render (admin only, no cache) ──────────────────────
router.get('/render/:type', ...adminGuard, ctrl.renderPreview);

// ── Admin list + create ────────────────────────────────────────
router.get('/', ...adminGuard, ctrl.getAllTemplates);
router.post('/', ...adminGuard, validate(createTemplateSchema), invalidate, ctrl.createTemplate);

// ── Admin single record ────────────────────────────────────────
router.get('/:id', ...adminGuard, ctrl.getTemplateById);
router.put('/:id', ...adminGuard, validate(updateTemplateSchema), invalidate, ctrl.updateTemplate);
router.delete('/:id', ...adminGuard, invalidate, ctrl.deleteTemplate);

// ── Version restore ────────────────────────────────────────────
router.post(
  '/:id/restore/:revisionIndex',
  ...adminGuard,
  validate(restoreRevisionSchema),
  invalidate,
  ctrl.restoreRevision
);

module.exports = router;

// MukonoTalks

