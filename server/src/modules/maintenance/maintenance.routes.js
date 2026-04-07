/**
 * Maintenance routes
 * @module modules/maintenance/maintenance.routes
 */

const express = require('express');
const router = express.Router();

const maintenanceController = require('./maintenance.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

// Public: frontend checks maintenance status on load
router.get('/', maintenanceController.getStatus);

// Developer only: toggle maintenance mode
router.put('/', protect, authorize('developer'), maintenanceController.updateStatus);

module.exports = router;

// MukonoTalks

