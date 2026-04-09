/**
 * Audit logs API route for /api/audit/logs
 */
const express = require('express');
const router = express.Router();
const AuditService = require('../../audit/audit.service');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { asyncHandler } = require('../../middlewares/error.middleware');

// Only allow admin users
router.use(protect, authorize('admin'));

/**
 * GET /api/audit/logs
 * Returns paginated audit logs (with filters)
 */
router.get('/logs', asyncHandler(async (req, res) => {
  const {
    action,
    performedBy,
    targetModel,
    targetId,
    severity,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = req.query;

  const result = await AuditService.query({
    action,
    performedBy,
    targetModel,
    targetId,
    severity,
    startDate,
    endDate,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });
  res.status(200).json({ success: true, ...result });
}));

module.exports = router;
