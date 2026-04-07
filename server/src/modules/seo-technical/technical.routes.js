/**
 * Technical SEO routes
 * @module modules/technical-seo/technical.routes
 */

const express  = require('express');
const router   = express.Router();
const service  = require('./technical.service');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

const admin = [protect, authorize('admin')];

// robots.txt
router.get('/robots',         ...admin, async (req, res, next) => {
  try { res.json({ success: true, data: await service.getRobots() }); }
  catch (err) { next(err); }
});

router.put('/robots',         ...admin, async (req, res, next) => {
  try {
    const saved = await service.saveRobots(req.body.content || '');
    res.json({ success: true, data: saved });
  } catch (err) { next(err); }
});

router.get('/robots/default', ...admin, async (req, res, next) => {
  try { res.json({ success: true, data: service.generateDefaultRobots() }); }
  catch (err) { next(err); }
});

// Serve robots.txt publicly (must also be mounted at root in server.js)
router.get('/robots.txt', async (req, res, next) => {
  try {
    const content = await service.getRobots();
    res.setHeader('Content-Type', 'text/plain');
    res.send(content);
  } catch (err) { next(err); }
});

// Audits
router.get('/audit',                  ...admin, async (req, res, next) => {
  try { res.json({ success: true, data: await service.runFullAudit() }); }
  catch (err) { next(err); }
});

router.get('/audit/canonical',        ...admin, async (req, res, next) => {
  try { res.json({ success: true, data: await service.runCanonicalAudit() }); }
  catch (err) { next(err); }
});

router.get('/audit/duplicates',       ...admin, async (req, res, next) => {
  try { res.json({ success: true, data: await service.detectDuplicateMeta() }); }
  catch (err) { next(err); }
});

router.get('/audit/orphans',          ...admin, async (req, res, next) => {
  try { res.json({ success: true, data: await service.detectOrphanPages() }); }
  catch (err) { next(err); }
});

router.get('/audit/url-cleanup',      ...admin, async (req, res, next) => {
  try { res.json({ success: true, data: await service.urlCleanupReport() }); }
  catch (err) { next(err); }
});

module.exports = router;

// MukonoTalks

