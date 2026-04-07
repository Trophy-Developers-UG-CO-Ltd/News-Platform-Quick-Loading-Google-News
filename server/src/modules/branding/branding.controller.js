/**
 * Branding controller
 * HTTP handlers for white-label branding settings
 * @module modules/branding/branding.controller
 */

const brandingService = require('./branding.service');
const AuditService = require('../audit/audit.service');
const { asyncHandler } = require('../../middlewares/error.middleware');

/**
 * @desc    Get branding settings (public — needed by admin UI and optionally frontend)
 * @route   GET /api/branding
 * @access  Public
 */
const getBranding = asyncHandler(async (req, res) => {
  const branding = await brandingService.getBranding();
  res.status(200).json({ success: true, branding });
});

/**
 * @desc    Update branding settings
 * @route   PUT /api/branding
 * @access  Developer only
 */
const updateBranding = asyncHandler(async (req, res) => {
  try {
    const branding = await brandingService.updateBranding(req.body, req.user._id);

    AuditService.log({
      action: 'SETTINGS_CHANGE',
      req,
      targetModel: 'Branding',
      targetId: 'default',
      targetIdentifier: 'branding-settings',
      changes: { after: req.body },
      severity: 'info',
    });

    res.status(200).json({ success: true, branding });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = { getBranding, updateBranding };

// MukonoTalks

