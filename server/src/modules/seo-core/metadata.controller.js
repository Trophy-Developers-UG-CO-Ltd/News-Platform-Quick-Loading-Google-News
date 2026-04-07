/**
 * SEO Metadata controller
 * HTTP handlers for per-page SEO metadata CRUD + SERP preview.
 * @module modules/seo-metadata/metadata.controller
 */

const MetadataService = require('./metadata.service');
const AnalyzerService = require('../seo-analyzer/analyzer.service');

// ─── GET /seo-metadata ────────────────────────────────────────
exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, pageType, search, sort } = req.query;
    const result = await MetadataService.getAll({
      page:     parseInt(page)  || 1,
      limit:    parseInt(limit) || 20,
      pageType,
      search,
      sort,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─── GET /seo-metadata/stats ──────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const stats = await MetadataService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

// ─── GET /seo-metadata/slug/:pageSlug ────────────────────────
exports.getBySlug = async (req, res, next) => {
  try {
    const doc = await MetadataService.getBySlug(req.params.pageSlug);
    if (!doc) return res.status(404).json({ success: false, message: 'SEO metadata not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

// ─── GET /seo-metadata/slug/:pageSlug/preview ────────────────
exports.getSerpPreview = async (req, res, next) => {
  try {
    const doc = await MetadataService.getBySlug(req.params.pageSlug);
    if (!doc) return res.status(404).json({ success: false, message: 'SEO metadata not found' });
    const preview = MetadataService.serpPreview(doc);
    res.json({ success: true, data: preview });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /seo-metadata/:pageSlug ─────────────────────────────
exports.upsert = async (req, res, next) => {
  try {
    const doc = await MetadataService.upsert(
      req.params.pageSlug,
      req.body,
      req.user?._id
    );
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

// ─── POST /seo-metadata/:pageSlug/analyze ────────────────────
exports.analyze = async (req, res, next) => {
  try {
    const { content, pageSlug } = req.body;
    const meta = await MetadataService.getBySlug(pageSlug || req.params.pageSlug);
    if (!meta) return res.status(404).json({ success: false, message: 'SEO metadata not found' });

    const analysis = await AnalyzerService.analyze({
      content:          content || '',
      title:            meta.title        || '',
      metaDescription:  meta.metaDescription || '',
      focusKeywords:    meta.focusKeywords || [],
      secondaryKeywords: meta.secondaryKeywords || [],
    });

    // Persist scores back to metadata
    await MetadataService.updateScores(
      meta.pageSlug,
      analysis.seoScore,
      analysis.readabilityScore,
      req.user?._id
    );

    res.json({ success: true, data: analysis });
  } catch (err) {
    next(err);
  }
};

// ─── POST /seo-metadata/canonicals/auto-fill ─────────────────
exports.autoFillCanonicals = async (req, res, next) => {
  try {
    const count = await MetadataService.autoFillCanonicals();
    res.json({ success: true, message: `Auto-filled canonicals for ${count} pages` });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /seo-metadata/:pageSlug ──────────────────────────
exports.remove = async (req, res, next) => {
  try {
    const deleted = await MetadataService.delete(req.params.pageSlug);
    if (!deleted) return res.status(404).json({ success: false, message: 'SEO metadata not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

// MukonoTalks

