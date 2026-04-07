/**
 * SEO Analyzer controller + routes
 * @module modules/seo-analyzer/analyzer.controller
 */

const express = require('express');
const AnalyzerService = require('./analyzer.service');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

const router = express.Router();
const admin  = [protect, authorize('admin')];

// POST /api/seo-analyzer/analyze
router.post('/analyze', ...admin, async (req, res, next) => {
  try {
    const { content, title, metaDescription, focusKeywords, secondaryKeywords } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'content is required' });

    const result = await AnalyzerService.analyze({
      content,
      title:             title || '',
      metaDescription:   metaDescription || '',
      focusKeywords:     Array.isArray(focusKeywords) ? focusKeywords : (focusKeywords ? [focusKeywords] : []),
      secondaryKeywords: Array.isArray(secondaryKeywords) ? secondaryKeywords : [],
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

// MukonoTalks

