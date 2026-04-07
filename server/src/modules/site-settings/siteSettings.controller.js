/**
 * Site Settings controller
 * HTTP handlers for site-wide configuration
 * @module modules/site-settings/siteSettings.controller
 */

const siteSettingsService = require('./siteSettings.service');
const AuditService = require('../audit/audit.service');
const { asyncHandler } = require('../../middlewares/error.middleware');

/**
 * @desc    Get site settings (public — needed by frontend GA4 init)
 * @route   GET /api/site-settings
 * @access  Public
 */
const getSettings = asyncHandler(async (req, res) => {
  const settings = await siteSettingsService.getSettings();
  res.status(200).json({ success: true, settings });
});

/**
 * @desc    Update site settings
 * @route   PUT /api/site-settings
 * @access  Admin only
 */
const updateSettings = asyncHandler(async (req, res) => {
  const settings = await siteSettingsService.updateSettings(req.body, req.user._id);

  AuditService.log({
    action: 'SETTINGS_CHANGE',
    req,
    targetModel: 'SiteSettings',
    targetId: 'default',
    targetIdentifier: 'site-settings',
    changes: { after: req.body },
    severity: 'info',
  });

  res.status(200).json({ success: true, settings });
});

module.exports = { getSettings, updateSettings };

// MukonoTalks

