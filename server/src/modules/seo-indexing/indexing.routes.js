/**
 * Indexing routes
 * @module modules/indexing/indexing.routes
 */

const express  = require('express');
const router   = express.Router();
const IndexNow = require('./indexnow.service');
const Google   = require('./google-indexing.service');
const SeoMetadata = require('../seo-core/metadata.model');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

const admin = [protect, authorize('admin')];

// Submit URL(s) to IndexNow
router.post('/indexnow', ...admin, async (req, res, next) => {
  try {
    const urls   = req.body.urls || [req.body.url];
    const result = await IndexNow.submitUrls(urls);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Submit URL(s) to Google Indexing API
router.post('/google', ...admin, async (req, res, next) => {
  try {
    const urls   = req.body.urls || [req.body.url];
    const type   = req.body.type || 'URL_UPDATED';
    const result = await Google.submitUrls(urls, type);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Submit all active pages to both engines
router.post('/submit-all', ...admin, async (req, res, next) => {
  try {
    const pages   = await SeoMetadata.find({ isActive: true, includeInSitemap: true }, 'pageSlug').lean();
    const slugs   = pages.map(p => p.pageSlug);

    const [indexNowResult, googleResult] = await Promise.allSettled([
      IndexNow.submitUrls(slugs),
      Google.submitUrls(slugs),
    ]);

    // Update indexing status
    await SeoMetadata.updateMany(
      { pageSlug: { $in: slugs } },
      { indexingStatus: 'submitted', lastIndexedAt: new Date() }
    );

    res.json({
      success: true,
      data: {
        total:    slugs.length,
        indexNow: indexNowResult.value || indexNowResult.reason,
        google:   googleResult.value   || googleResult.reason,
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;

// MukonoTalks

