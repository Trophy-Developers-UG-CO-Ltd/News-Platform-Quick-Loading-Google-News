/**
 * Local SEO routes + service
 * @module modules/local-seo/location.routes
 */

const express  = require('express');
const router   = express.Router();
const Location = require('./location.model');
const SchemaBuilder = require('../../utils/schema-builder');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

const admin = [protect, authorize('admin')];

// ── Public ───────────────────────────────────────────────────
router.get('/public', async (req, res, next) => {
  try {
    const locations = await Location.find({ isActive: true }).sort('-isPrimary name').lean();
    res.json({ success: true, data: locations });
  } catch (err) { next(err); }
});

router.get('/public/:slug', async (req, res, next) => {
  try {
    const loc = await Location.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!loc) return res.status(404).json({ success: false, message: 'Location not found' });

    const schema = SchemaBuilder.localBusiness(loc);
    res.json({ success: true, data: { location: loc, schema } });
  } catch (err) { next(err); }
});

// ── Admin ────────────────────────────────────────────────────
router.get('/', ...admin, async (req, res, next) => {
  try {
    const locations = await Location.find().sort('-isPrimary name').lean();
    res.json({ success: true, data: locations });
  } catch (err) { next(err); }
});

router.post('/', ...admin, async (req, res, next) => {
  try {
    const loc = await Location.create(req.body);
    res.status(201).json({ success: true, data: loc });
  } catch (err) { next(err); }
});

router.put('/:id', ...admin, async (req, res, next) => {
  try {
    const loc = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: loc });
  } catch (err) { next(err); }
});

router.delete('/:id', ...admin, async (req, res, next) => {
  try {
    await Location.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

// Generate LocalBusiness schema for a location
router.get('/:id/schema', ...admin, async (req, res, next) => {
  try {
    const loc = await Location.findById(req.params.id).lean();
    if (!loc) return res.status(404).json({ success: false, message: 'Not found' });
    const schema = SchemaBuilder.localBusiness(loc);
    res.json({ success: true, data: schema });
  } catch (err) { next(err); }
});

module.exports = router;

// MukonoTalks

