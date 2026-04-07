/**
 * Audit Routes
 * Admin-only audit log viewing endpoints
 * @module modules/audit/audit.routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const {
  getAuditLogs,
  getEntityAuditTrail,
  getUserActivity,
  getSecurityEvents,
  getActionSummary,
} = require('./audit.controller');

// All audit routes require admin access
router.use(protect, authorize('admin'));

router.get('/logs', getAuditLogs);
router.get('/security', getSecurityEvents);
router.get('/summary', getActionSummary);
router.get('/entity/:model/:id', getEntityAuditTrail);
router.get('/user/:userId', getUserActivity);

module.exports = router;

// MukonoTalks

