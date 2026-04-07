const express    = require('express');
const router     = express.Router();
const controller = require('./homepageSection.controller');
const { protect }   = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

// Public — frontend section fetches
router.get('/:key', controller.getSection);

// Admin — list all + upsert
router.get('/',     protect, authorize('admin'), controller.getAllSections);
router.put('/:key', protect, authorize('admin'), controller.upsertSection);

module.exports = router;
