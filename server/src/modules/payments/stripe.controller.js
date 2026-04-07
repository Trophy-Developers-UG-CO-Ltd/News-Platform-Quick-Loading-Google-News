/**
 * Stripe payment controller
 * Enterprise audit logging on payment events
 * @module modules/payments/stripe.controller
 */

const stripeService = require('./stripe.service');
const logger = require('../../utils/logger');
const AuditService = require('../audit/audit.service');
const { asyncHandler } = require('../../middlewares/error.middleware');

/**
 * @desc    Create Stripe Payment Intent
 * @route   POST /api/payments/create-intent
 * @access  Private
 */
const createPaymentIntent = asyncHandler(async (req, res) => {
  try {
    const { items, shippingAddress, billingAddress, notes } = req.body;

    const result = await stripeService.createPaymentIntent(
      req.user._id,
      items,
      shippingAddress,
      billingAddress,
      notes
    );

    AuditService.log({
      action: 'PAYMENT_INITIATED',
      req,
      targetModel: 'Order',
      targetId: result.orderId,
      metadata: { paymentIntentId: result.clientSecret?.split('_secret_')[0] },
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @desc    Handle Stripe webhook
 * @route   POST /api/payments/webhook
 * @access  Stripe (signature verified)
 */
const handleWebhook = asyncHandler(async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      AuditService.log({
        action: 'WEBHOOK_FAILED',
        req,
        severity: 'critical',
        status: 'failure',
        metadata: { reason: 'Missing Stripe signature' },
      });
      return res.status(400).json({
        success: false,
        message: 'Missing Stripe signature',
      });
    }

    const result = await stripeService.handleWebhook(req.body, signature);

    AuditService.log({
      action: 'WEBHOOK_RECEIVED',
      req,
      metadata: { type: result.type || 'stripe_webhook' },
    });

    res.status(200).json(result);
  } catch (error) {
    logger.error(`Webhook error: ${error.message}`);

    AuditService.log({
      action: 'WEBHOOK_FAILED',
      req,
      severity: 'critical',
      status: 'failure',
      metadata: { error: error.message },
    });

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = { createPaymentIntent, handleWebhook };

// MukonoTalks

