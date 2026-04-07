/**
 * Product controller
 * HTTP handlers for product operations
 * Enterprise audit logging on admin mutations
 * @module modules/products/product.controller
 */

const productService = require('./product.service');
const AuditService = require('../audit/audit.service');
const { asyncHandler } = require('../../middlewares/error.middleware');

/**
 * @desc    Get all products (public with restrictions)
 * @route   GET /api/products
 * @access  Public (tech specs stripped for unauthenticated)
 */
const getProducts = asyncHandler(async (req, res) => {
  try {
    const isAuthenticated = !!req.user;
    const isAdmin = req.user?.role === 'admin';
    const result = await productService.getProducts(req.query, isAuthenticated, isAdmin);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @desc    Get product by slug (public with restrictions)
 * @route   GET /api/products/slug/:slug
 * @access  Public (tech specs stripped for unauthenticated)
 */
const getProductBySlug = asyncHandler(async (req, res) => {
  try {
    const isAuthenticated = !!req.user;
    const lang = req.query.lang || req.headers['x-language'] || 'en';
    const product = await productService.getProductBySlug(req.params.slug, isAuthenticated, lang);
    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @desc    Get product by ID (admin)
 * @route   GET /api/products/:id
 * @access  Admin
 */
const getProductById = asyncHandler(async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @desc    Create new product (admin)
 * @route   POST /api/products
 * @access  Admin
 */
const createProduct = asyncHandler(async (req, res) => {
  try {
    const product = await productService.createProduct(req.body);

    AuditService.log({
      action: 'PRODUCT_CREATE',
      req,
      targetModel: 'Product',
      targetId: product._id,
      targetIdentifier: product.name,
      metadata: { sku: product.sku, category: product.category },
    });

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @desc    Update product (admin)
 * @route   PUT /api/products/:id
 * @access  Admin
 */
const updateProduct = asyncHandler(async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);

    AuditService.log({
      action: 'PRODUCT_UPDATE',
      req,
      targetModel: 'Product',
      targetId: req.params.id,
      targetIdentifier: product.name,
      changes: { after: req.body },
    });

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @desc    Delete (deactivate) product (admin)
 * @route   DELETE /api/products/:id
 * @access  Admin
 */
const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const result = await productService.deleteProduct(req.params.id);

    AuditService.log({
      action: 'PRODUCT_DELETE',
      req,
      targetModel: 'Product',
      targetId: req.params.id,
      severity: 'warning',
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @desc    Bulk delete products (admin)
 * @route   DELETE /api/products/bulk
 * @access  Admin
 */
const bulkDeleteProducts = asyncHandler(async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids array is required' });
    }

    const result = await productService.bulkDeleteProducts(ids);

    AuditService.log({
      action: 'BULK_ACTION',
      req,
      targetModel: 'Product',
      metadata: { ids, count: ids.length, operation: 'bulk_delete' },
      severity: 'warning',
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Get filter options (backend-driven)
 * @route   GET /api/products/filters
 * @access  Public
 */
const getFilterOptions = asyncHandler(async (req, res) => {
  try {
    const filters = await productService.getFilterOptions();
    res.status(200).json({
      success: true,
      filters,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = {
  getProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  getFilterOptions,
};

// MukonoTalks

