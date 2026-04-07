/**
 * Redirect controller
 * HTTP handlers wrapping RedirectService with asyncHandler
 * @module modules/redirects/redirect.controller
 */

const { asyncHandler } = require('../../middlewares/error.middleware');
const RedirectService = require('./redirect.service');

const getAll = asyncHandler(async (req, res) => {
  const result = await RedirectService.getAllRedirects(req.query);
  res.json({ success: true, ...result });
});

const getStats = asyncHandler(async (req, res) => {
  const stats = await RedirectService.getStats();
  res.json({ success: true, stats });
});

const create = asyncHandler(async (req, res) => {
  const { fromPath, toPath, statusCode, note } = req.body;
  const redirect = await RedirectService.createRedirect({
    fromPath,
    toPath,
    statusCode: statusCode || 301,
    source: 'manual',
    createdBy: req.user._id,
    note: note || '',
  });
  res.status(201).json({ success: true, redirect });
});

const approve = asyncHandler(async (req, res) => {
  const redirect = await RedirectService.approveRedirect(req.params.id, req);
  res.json({ success: true, redirect });
});

const reject = asyncHandler(async (req, res) => {
  const redirect = await RedirectService.rejectRedirect(req.params.id, req);
  res.json({ success: true, redirect });
});

const update = asyncHandler(async (req, res) => {
  const redirect = await RedirectService.updateRedirect(req.params.id, req.body, req);
  res.json({ success: true, redirect });
});

const remove = asyncHandler(async (req, res) => {
  await RedirectService.deleteRedirect(req.params.id, req);
  res.json({ success: true, message: 'Redirect deleted' });
});

const resolve = asyncHandler(async (req, res) => {
  const { from } = req.query;
  const redirect = await RedirectService.resolveRedirect(from);
  res.json({ success: true, redirect: redirect || null });
});

const track = asyncHandler(async (req, res) => {
  const { fromPath } = req.body;
  await RedirectService.trackClick(fromPath);
  res.json({ success: true });
});

module.exports = { getAll, getStats, create, approve, reject, update, remove, resolve, track };

// MukonoTalks

