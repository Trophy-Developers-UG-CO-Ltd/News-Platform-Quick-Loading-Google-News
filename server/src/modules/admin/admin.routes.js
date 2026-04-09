/**
 * Admin routes
 * All routes protected server-side — never rely on frontend route protection alone
 * @module modules/admin/admin.routes
 */

const express = require('express');
const router = express.Router();

const adminController = require('./admin.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

// All admin routes require admin role — server-side enforced
router.use(protect, authorize('admin'));


// Admin dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Audit logs endpoint
router.get('/audit', adminController.getAuditLogs);

// Cache management endpoints
router.get('/cache/stats', adminController.getCacheStats);
router.post('/cache/clear', adminController.clearCache);

// Backup health endpoint
router.get('/backup-health', (req, res) => {
  try {
    const { getBackupHealth } = require('../../../scripts/backup');
    const health = getBackupHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    res.json({
      success: true,
      data: {
        lastBackup: null,
        totalBackups: 0,
        healthy: false,
        error: 'Backup module not available',
      },
    });
  }
});

module.exports = router;

// MukonoTalks

