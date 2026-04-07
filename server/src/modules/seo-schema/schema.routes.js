/**
 * Schema Engine controller + routes
 * @module modules/schema-engine/schema.routes
 */

const express = require('express');
const SchemaService = require('./schema.service');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

const router = express.Router();
const admin  = [protect, authorize('admin')];

// ── Public ──────────────────────────────────────────────────
// Get injectable schemas for a page (used by frontend)
router.get('/public/:pageSlug', async (req, res, next) => {
  try {
    const schemas = await SchemaService.getInjectable(req.params.pageSlug);
    res.json({ success: true, data: schemas });
  } catch (err) {
    next(err);
  }
});

// ── Admin ────────────────────────────────────────────────────
router.get('/', ...admin, async (req, res, next) => {
  try {
    const result = await SchemaService.getAll({
      page:       parseInt(req.query.page)  || 1,
      limit:      parseInt(req.query.limit) || 20,
      schemaType: req.query.schemaType,
      search:     req.query.search,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.get('/:pageSlug', ...admin, async (req, res, next) => {
  try {
    const schemas = await SchemaService.getBySlug(req.params.pageSlug);
    res.json({ success: true, data: schemas });
  } catch (err) {
    next(err);
  }
});

router.put('/:pageSlug/:schemaType', ...admin, async (req, res, next) => {
  try {
    const { pageSlug, schemaType } = req.params;
    const doc = await SchemaService.upsert(
      pageSlug,
      schemaType,
      req.body.schemaJSON,
      req.user?._id
    );
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

router.delete('/:pageSlug', ...admin, async (req, res, next) => {
  try {
    await SchemaService.delete(req.params.pageSlug, req.query.schemaType);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

// MukonoTalks

