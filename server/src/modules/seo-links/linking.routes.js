/**
 * Internal Links routes
 * @module modules/internal-links/linking.routes
 */

const express  = require('express');
const router   = express.Router();
const engine   = require('./linking.engine');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

const admin = [protect, authorize('admin')];

// ── Rules CRUD ───────────────────────────────────────────────
router.get('/', ...admin, async (req, res, next) => {
  try {
    const result = await engine.getAll({
      page:   parseInt(req.query.page)  || 1,
      limit:  parseInt(req.query.limit) || 20,
      search: req.query.search,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

router.post('/', ...admin, async (req, res, next) => {
  try {
    const rule = await engine.create(req.body, req.user?._id);
    res.status(201).json({ success: true, data: rule });
  } catch (err) { next(err); }
});

router.put('/:id', ...admin, async (req, res, next) => {
  try {
    const rule = await engine.update(req.params.id, req.body);
    res.json({ success: true, data: rule });
  } catch (err) { next(err); }
});

router.delete('/:id', ...admin, async (req, res, next) => {
  try {
    await engine.delete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

// ── Suggest links for content snippet ───────────────────────
router.post('/suggest', ...admin, async (req, res, next) => {
  try {
    const { content, pageSlug } = req.body;
    const suggestions = await engine.suggestLinks(content || '', pageSlug || '');
    res.json({ success: true, data: suggestions });
  } catch (err) { next(err); }
});

// ── Insert links into content ────────────────────────────────
router.post('/insert', ...admin, async (req, res, next) => {
  try {
    const { html, pageSlug } = req.body;
    const result = await engine.insertLinks(html || '', pageSlug || '');
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ── Link counts map ──────────────────────────────────────────
router.get('/counts', ...admin, async (req, res, next) => {
  try {
    const counts = await engine.getLinkCounts();
    res.json({ success: true, data: counts });
  } catch (err) { next(err); }
});

// ── Orphaned pages detection ─────────────────────────────────
router.post('/orphaned', ...admin, async (req, res, next) => {
  try {
    const { slugs } = req.body;
    const orphaned = await engine.detectOrphanedPages(Array.isArray(slugs) ? slugs : []);
    res.json({ success: true, data: orphaned });
  } catch (err) { next(err); }
});

module.exports = router;

// MukonoTalks

