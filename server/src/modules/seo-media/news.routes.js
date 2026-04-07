/**
 * News SEO routes
 * @module modules/news-seo/news-seo.routes
 */

const express = require('express');
const router  = express.Router();
const SchemaBuilder = require('../../utils/schema-builder');
const SchemaService = require('../seo-schema/schema.service');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

const admin = [protect, authorize('admin')];

// Generate NewsArticle schema for an article
router.post('/schema', ...admin, async (req, res, next) => {
  try {
    const { pageSlug, article } = req.body;
    if (!pageSlug || !article) return res.status(400).json({ success: false, message: 'pageSlug and article are required' });

    const schema = SchemaBuilder.article({ ...article, isNews: true });
    const saved  = await SchemaService.upsert(pageSlug, 'NewsArticle', schema, req.user?._id);
    res.json({ success: true, data: saved });
  } catch (err) { next(err); }
});

module.exports = router;

// MukonoTalks

