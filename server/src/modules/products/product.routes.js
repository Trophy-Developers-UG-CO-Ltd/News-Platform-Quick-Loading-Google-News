/**
 * Product routes
 * Enterprise caching on public endpoints, invalidation on mutations
 * @module modules/products/product.routes
 */

const express = require('express');
const router = express.Router();

const productController = require('./product.controller');
const { protect, optionalAuth } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { cacheResponse, invalidateCache } = require('../../middlewares/cache.middleware');
const {
  createProductSchema,
  updateProductSchema,
  getProductsQuerySchema,
} = require('./product.validation');

// Public routes (optionalAuth to determine tech specs visibility)
router.get('/', optionalAuth, validate(getProductsQuerySchema), cacheResponse(120), productController.getProducts);
router.get('/filters', cacheResponse(600), productController.getFilterOptions);
router.get('/slug/:slug', optionalAuth, cacheResponse(120), productController.getProductBySlug);

// Admin routes (with cache invalidation)
router.post('/', protect, authorize('admin'), validate(createProductSchema), invalidateCache('/api/products', '/api/categories'), productController.createProduct);
router.delete('/bulk', protect, authorize('admin'), invalidateCache('/api/products', '/api/categories'), productController.bulkDeleteProducts);
router.get('/:id', protect, authorize('admin'), productController.getProductById);
router.put('/:id', protect, authorize('admin'), validate(updateProductSchema), invalidateCache('/api/products', '/api/categories'), productController.updateProduct);
router.delete('/:id', protect, authorize('admin'), invalidateCache('/api/products', '/api/categories'), productController.deleteProduct);

module.exports = router;

// MukonoTalks

