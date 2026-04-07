/**
 * Image SEO routes
 * @module modules/image-seo/image-seo.routes
 */

const express   = require('express');
const router    = express.Router();
const optimizer = require('./image-optimizer');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

const admin = [protect, authorize('admin')];

// Analyze a single image
router.post('/analyze', ...admin, async (req, res, next) => {
  try {
    const result = optimizer.analyzeImage(req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Scan HTML content for all images
router.post('/scan-content', ...admin, async (req, res, next) => {
  try {
    const { html } = req.body;
    const result = optimizer.scanContentImages(html || '');
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Suggest alt text for an image
router.post('/alt-suggestion', ...admin, async (req, res, next) => {
  try {
    const { filename, keywords, context } = req.body;
    const suggestion = optimizer.generateAltSuggestion(filename || '', keywords || [], context || '');
    res.json({ success: true, data: { suggestion } });
  } catch (err) { next(err); }
});

// Optimize a filename
router.post('/optimize-filename', ...admin, async (req, res, next) => {
  try {
    const { filename } = req.body;
    const optimized = optimizer.optimizeFilename(filename || '');
    res.json({ success: true, data: { optimized } });
  } catch (err) { next(err); }
});

module.exports = router;

// MukonoTalks

