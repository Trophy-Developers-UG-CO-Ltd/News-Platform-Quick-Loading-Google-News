/**
 * SEO Rules routes
 * @module modules/seo-rules/rules.routes
 */

const express  = require('express');
const router   = express.Router();
const service  = require('./rules.service');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

const admin = [protect, authorize('admin')];

router.get('/',    ...admin, async (req, res, next) => {
  try {
    const rules = await service.getAll({ pageType: req.query.pageType });
    res.json({ success: true, data: rules });
  } catch (err) { next(err); }
});

router.post('/',   ...admin, async (req, res, next) => {
  try {
    const rule = await service.create(req.body, req.user?._id);
    res.status(201).json({ success: true, data: rule });
  } catch (err) { next(err); }
});

router.put('/:id', ...admin, async (req, res, next) => {
  try {
    const rule = await service.update(req.params.id, req.body);
    res.json({ success: true, data: rule });
  } catch (err) { next(err); }
});

router.delete('/:id', ...admin, async (req, res, next) => {
  try {
    await service.delete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

// Seed default rules
router.post('/seed', ...admin, async (req, res, next) => {
  try {
    await service.seedDefaults();
    res.json({ success: true, message: 'Default rules seeded' });
  } catch (err) { next(err); }
});

// Get computed defaults for a page type
router.get('/apply/:pageType', ...admin, async (req, res, next) => {
  try {
    const defaults = await service.applyRules(req.params.pageType);
    res.json({ success: true, data: defaults });
  } catch (err) { next(err); }
});

module.exports = router;

// MukonoTalks

