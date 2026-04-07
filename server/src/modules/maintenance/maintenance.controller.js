/**
 * Maintenance controller
 * HTTP handlers for maintenance mode
 * @module modules/maintenance/maintenance.controller
 */

const maintenanceService = require('./maintenance.service');
const AuditService = require('../audit/audit.service');
const { asyncHandler } = require('../../middlewares/error.middleware');

/**
 * @desc    Get maintenance status (public — needed by frontend to show maintenance page)
 * @route   GET /api/maintenance
 * @access  Public
 */
const getStatus = asyncHandler(async (req, res) => {
  const status = await maintenanceService.getStatus();
  res.status(200).json({
    success: true,
    maintenance: {
      isEnabled: status.isEnabled,
      message: status.message,
      estimatedEnd: status.estimatedEnd,
    },
  });
});

/**
 * @desc    Update maintenance mode (toggle on/off, update message)
 * @route   PUT /api/maintenance
 * @access  Developer only
 */
const updateStatus = asyncHandler(async (req, res) => {
  const status = await maintenanceService.updateStatus(req.body, req.user._id);

  AuditService.log({
    action: 'SETTINGS_CHANGE',
    req,
    targetModel: 'Maintenance',
    targetId: 'default',
    targetIdentifier: 'maintenance-mode',
    changes: { after: req.body },
    severity: req.body.isEnabled ? 'warning' : 'info',
  });

  res.status(200).json({ success: true, maintenance: status });
});

module.exports = { getStatus, updateStatus };

// MukonoTalks

