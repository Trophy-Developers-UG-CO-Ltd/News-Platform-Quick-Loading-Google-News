/**
 * SEO Analytics routes
 * @module modules/seo-analytics/analytics.routes
 */

const express  = require('express');
const router   = express.Router();
const service  = require('./analytics.service');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

const admin = [protect, authorize('admin')];

router.get('/dashboard',         ...admin, async (req, res, next) => {
  try { res.json({ success: true, data: await service.getDashboard() }); }
  catch (err) { next(err); }
});

router.get('/top-pages',         ...admin, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    res.json({ success: true, data: await service.getTopPages(limit) });
  } catch (err) { next(err); }
});

router.get('/needs-attention',   ...admin, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    res.json({ success: true, data: await service.getPagesNeedingAttention(limit) });
  } catch (err) { next(err); }
});

router.get('/score-history/:pageSlug', ...admin, async (req, res, next) => {
  try { res.json({ success: true, data: await service.getScoreHistory(req.params.pageSlug) }); }
  catch (err) { next(err); }
});

module.exports = router;

// MukonoTalks

