// AdOrder Routes
const express = require('express');
const { submitAdOrder, listAdOrders, updateAdOrderStatus, getActiveAds } = require('./adOrder.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');

const router = express.Router();

// Public: submit ad order
router.post('/', submitAdOrder);
// Admin: list all ad orders
router.get('/', protect, authorize('admin'), listAdOrders);
// Admin: update status
router.patch('/:id', protect, authorize('admin'), updateAdOrderStatus);
// Public: get active ads for slot
router.get('/ads', getActiveAds);

module.exports = router;
