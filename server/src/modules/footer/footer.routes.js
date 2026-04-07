/**
 * Footer routes
 * GET  /api/footer        — public (any visitor)
 * PUT  /api/footer        — admin only
 * @module modules/footer/footer.routes
 */

const express    = require('express');
const router     = express.Router();
const ctrl       = require('./footer.controller');
const { protect }   = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

router.get('/',  ctrl.getFooter);
router.put('/',  protect, authorize('admin'), ctrl.updateFooter);

module.exports = router;

// MukonoTalks

