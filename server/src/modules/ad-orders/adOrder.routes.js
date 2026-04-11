const express = require('express');
const {
  createCheckoutSession,
  verifyCheckoutSession,
  listAdOrders,
  updateAdOrderStatus,
  getActiveAds,
  trackAdImpression,
  trackAdClick,
  getAdOrderConfig,
} = require('./adOrder.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { checkoutLimiter } = require('../../middlewares/rateLimit.middleware');

const router = express.Router();

router.get('/config', getAdOrderConfig);
router.post('/checkout', checkoutLimiter, createCheckoutSession);
router.get('/checkout/verify', verifyCheckoutSession);

router.get('/ads', getActiveAds);
router.post('/ads/:id/impression', trackAdImpression);
router.post('/ads/:id/click', trackAdClick);

router.get('/', protect, authorize('admin'), listAdOrders);
router.patch('/:id', protect, authorize('admin'), updateAdOrderStatus);

module.exports = router;
