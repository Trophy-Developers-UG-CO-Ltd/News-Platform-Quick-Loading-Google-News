/**
 * Category routes
 * Enterprise caching on public endpoints
 * @module modules/categories/category.routes
 */

const express = require('express');
const router = express.Router();

const categoryController = require('./category.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { cacheResponse, invalidateCache } = require('../../middlewares/cache.middleware');
const { createCategorySchema, updateCategorySchema } = require('./category.validation');

// Public (cached 10 min — categories change infrequently)
router.get('/', cacheResponse(600), categoryController.getAllCategories);
router.get('/tree', cacheResponse(600), categoryController.getCategoryTree);
router.get('/:slug', cacheResponse(600), categoryController.getCategoryBySlug);

// Admin (with cache invalidation)
router.post('/', protect, authorize('admin'), validate(createCategorySchema), invalidateCache('/api/categories', '/api/products'), categoryController.createCategory);
router.put('/:id', protect, authorize('admin'), validate(updateCategorySchema), invalidateCache('/api/categories', '/api/products'), categoryController.updateCategory);
router.delete('/:id', protect, authorize('admin'), invalidateCache('/api/categories', '/api/products'), categoryController.deleteCategory);

module.exports = router;

// MukonoTalks

