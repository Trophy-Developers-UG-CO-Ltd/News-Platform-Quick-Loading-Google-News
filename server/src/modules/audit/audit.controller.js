/**
 * Audit Controller
 * Admin endpoints for viewing audit logs
 * @module modules/audit/audit.controller
 */

const AuditService = require('./audit.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { ApiError } = require('../../middlewares/error.middleware');

/**
 * @route GET /api/audit/logs
 * @desc Get paginated audit logs with filters
 * @access Admin
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  try {
    const { action, performedBy, targetModel, targetId, severity, startDate, endDate, page, limit } = req.query;
    const result = await AuditService.query({
      action,
      performedBy,
      targetModel,
      targetId,
      severity,
      startDate,
      endDate,
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 50, 200),
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/audit/entity/:model/:id
 * @desc Get audit trail for a specific entity
 * @access Admin
 */
const getEntityAuditTrail = asyncHandler(async (req, res) => {
  try {
    const { model, id } = req.params;
    const { page, limit } = req.query;

    const validModels = ['User', 'Product', 'Order', 'Category', 'Document', 'Inquiry'];
    if (!validModels.includes(model)) {
      return res.status(400).json({ success: false, message: 'Invalid model name' });
    }

    const result = await AuditService.getEntityTrail(model, id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/audit/user/:userId
 * @desc Get activity log for a specific user
 * @access Admin
 */
const getUserActivity = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { page, limit } = req.query;
    const result = await AuditService.getUserActivity(userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/audit/security
 * @desc Get security events (warnings & criticals)
 * @access Admin
 */
const getSecurityEvents = asyncHandler(async (req, res) => {
  try {
    const { page, limit, startDate, endDate } = req.query;
    const result = await AuditService.getSecurityEvents({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      startDate,
      endDate,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/audit/summary
 * @desc Get action summary for dashboard (last N days)
 * @access Admin
 */
const getActionSummary = asyncHandler(async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const summary = await AuditService.getActionSummary(days);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

module.exports = {
  getAuditLogs,
  getEntityAuditTrail,
  getUserActivity,
  getSecurityEvents,
  getActionSummary,
};

// MukonoTalks

