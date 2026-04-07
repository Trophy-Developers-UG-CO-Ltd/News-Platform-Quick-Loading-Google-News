/**
 * Application controller
 * HTTP handlers for application CRUD
 * @module modules/applications/application.controller
 */

const { asyncHandler }   = require('../../middlewares/error.middleware');
const applicationService = require('./application.service');

// ─── Public ───────────────────────────────────────────────────────────────────

/**
 * GET /api/applications
 * Search/list applications — used for typeahead (min 3 chars) and admin list
 */
const getApplications = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const result = await applicationService.getApplications({ search, page, limit });
  res.json(result);
});

/**
 * GET /api/applications/slug/:slug
 * Get application by slug — public product-application page
 */
const getApplicationBySlug = asyncHandler(async (req, res) => {
  const app = await applicationService.getApplicationBySlug(req.params.slug);
  if (!app) {
    const err = new Error('Application not found');
    err.statusCode = 404;
    throw err;
  }
  res.json({ application: app });
});

// ─── Admin ────────────────────────────────────────────────────────────────────

/**
 * GET /api/applications/:id  (admin only)
 */
const getApplicationById = asyncHandler(async (req, res) => {
  const app = await applicationService.getApplicationById(req.params.id);
  if (!app) {
    const err = new Error('Application not found');
    err.statusCode = 404;
    throw err;
  }
  res.json({ application: app });
});

/**
 * POST /api/applications  (admin only)
 */
const createApplication = asyncHandler(async (req, res) => {
  const app = await applicationService.createApplication(req.body);
  res.status(201).json({ application: app, message: 'Application created' });
});

/**
 * PUT /api/applications/:id  (admin only)
 */
const updateApplication = asyncHandler(async (req, res) => {
  const app = await applicationService.updateApplication(req.params.id, req.body);
  if (!app) {
    const err = new Error('Application not found');
    err.statusCode = 404;
    throw err;
  }
  res.json({ application: app, message: 'Application updated' });
});

/**
 * DELETE /api/applications/:id  (admin only)
 */
const deleteApplication = asyncHandler(async (req, res) => {
  await applicationService.deleteApplication(req.params.id);
  res.json({ message: 'Application deleted' });
});

module.exports = {
  getApplications,
  getApplicationBySlug,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
};

// MukonoTalks

