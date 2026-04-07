/**
 * Branding routes
 * @module modules/branding/branding.routes
 */

const express = require('express');
const router = express.Router();

const brandingController = require('./branding.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

// Public: anyone (including unauthenticated) can read branding for UI rendering
router.get('/', brandingController.getBranding);

// Admin & Developer: update branding / white-label settings
router.put('/', protect, authorize('admin'), brandingController.updateBranding);

module.exports = router;

// MukonoTalks

