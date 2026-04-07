/**
 * Payment routes
 * @module modules/payments/stripe.routes
 */

const express = require('express');
const router = express.Router();

const stripeController = require('./stripe.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { requireApproval } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { checkoutLimiter } = require('../../middlewares/rateLimit.middleware');
const { createIntentSchema } = require('./stripe.validation');

// Create payment intent (authenticated + rate limited)
router.post(
  '/create-intent',
  protect,
  requireApproval,
  checkoutLimiter,
  validate(createIntentSchema),
  stripeController.createPaymentIntent
);

// Stripe webhook (raw body — handled in server.js before JSON parser)
router.post('/webhook', stripeController.handleWebhook);

module.exports = router;

// MukonoTalks

