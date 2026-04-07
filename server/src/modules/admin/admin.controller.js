/**
 * Admin controller
 * @module modules/admin/admin.controller
 */

const adminService = require('./admin.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { cache } = require('../../middlewares/cache.middleware');

/**
 * @desc    Get admin dashboard stats
 * @route   GET /api/admin/dashboard
 * @access  Admin
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json({ success: true, stats });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Get cache statistics
 * @route   GET /api/admin/cache/stats
 * @access  Admin
 */
const getCacheStats = asyncHandler(async (req, res) => {
  const stats = cache.getStats();
  res.status(200).json({ success: true, data: stats });
});

/**
 * @desc    Clear all in-memory cache entries
 * @route   POST /api/admin/cache/clear
 * @access  Admin
 */
const clearCache = asyncHandler(async (req, res) => {
  const before = cache.getStats().size;
  cache.clear();
  res.status(200).json({ success: true, message: `Cache cleared — ${before} entries removed` });
});

module.exports = { getDashboardStats, getCacheStats, clearCache };

// MukonoTalks

