/**
 * SEO Schema controller
 * HTTP handlers for global structured-data schema management
 * @module modules/seo/seo.controller
 */

const seoService = require('./legacy.service');
const { asyncHandler } = require('../../middlewares/error.middleware');

/**
 * GET /api/seo
 * List all schema records (admin)
 */
const getAllSchemas = asyncHandler(async (req, res) => {
  try {
    const schemas = await seoService.getAllSchemas();
    res.status(200).json({ success: true, schemas });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/seo/global
 * Get all active global schemas (public — for injection into every page)
 */
const getGlobalSchemas = asyncHandler(async (req, res) => {
  try {
    const schemas = await seoService.getGlobalSchemas();
    res.status(200).json({ success: true, schemas });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/seo/:key
 * Get a single schema by schemaKey
 */
const getSchemaByKey = asyncHandler(async (req, res) => {
  try {
    const schema = await seoService.getSchemaByKey(req.params.key);
    res.status(200).json({ success: true, schema });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/seo/:key
 * Create or update a schema by schemaKey (admin)
 */
const upsertSchema = asyncHandler(async (req, res) => {
  try {
    const schema = await seoService.upsertSchema(req.params.key, req.body, req.user?._id);
    res.status(200).json({ success: true, schema });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/seo/:key
 * Delete a non-default schema by schemaKey (admin)
 */
const deleteSchema = asyncHandler(async (req, res) => {
  try {
    const result = await seoService.deleteSchema(req.params.key, req.user?._id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

module.exports = { getAllSchemas, getGlobalSchemas, getSchemaByKey, upsertSchema, deleteSchema };

// MukonoTalks

