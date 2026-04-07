/**
 * Site Settings routes
 * @module modules/site-settings/siteSettings.routes
 */

const express = require('express');
const router = express.Router();

const siteSettingsController = require('./siteSettings.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

// Public: anyone can read (frontend needs GA4 ID for script injection)
router.get('/', siteSettingsController.getSettings);

// Admin only: update site settings
router.put('/', protect, authorize('admin'), siteSettingsController.updateSettings);

module.exports = router;

// MukonoTalks

