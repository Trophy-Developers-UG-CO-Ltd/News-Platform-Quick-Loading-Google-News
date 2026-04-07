/**
 * Stripe payment service
 * Payment Intent flow with webhook signature verification
 * Stock reduces ONLY after webhook confirmation
 * @module modules/payments/stripe.service
 */

const { getStripe } = require('../../config/stripe');
const { env } = require('../../config/env');
const orderService = require('../orders/order.service');
const productService = require('../products/product.service');
const logger = require('../../utils/logger');
const { sendOrderConfirmation } = require('../../utils/email');
const User = require('../auth/auth.model');

/**
 * Create a Stripe Payment Intent
 * Server validates cart totals — NEVER trusts frontend amounts
 */
const createPaymentIntent = async (userId, cartItems, shippingAddress, billingAddress, notes) => {
  const stripe = getStripe();

  // Validate cart server-side
  const { validatedItems, subtotal } = await orderService.validateCartItems(cartItems);

  // Calculate totals server-side
  const tax = Math.round(subtotal * 0.15 * 100) / 100; // 15% VAT (South Africa)
  const shippingCost = subtotal >= 5000 ? 0 : 250; // Free shipping over $5000
  const totalAmount = Math.round((subtotal + tax + shippingCost) * 100) / 100;

  // Create Payment Intent with Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalAmount * 100), // Stripe uses cents
    currency: 'usd',
    metadata: {
      userId: userId.toString(),
      orderItemsCount: validatedItems.length.toString(),
    },
  });

  // Create order in pending state (will be marked paid by webhook)
  const order = await orderService.createOrder({
    user: userId,
    items: validatedItems,
    subtotal,
    tax,
    shippingCost,
    totalAmount,
    status: 'pending',
    paymentMethod: 'stripe',
    stripePaymentIntentId: paymentIntent.id,
    shippingAddress,
    billingAddress,
    notes,
  });

  return {
    clientSecret: paymentIntent.client_secret,
    orderId: order._id,
    orderNumber: order.orderNumber,
    totalAmount,
  };
};

/**
 * Handle Stripe webhook events
 * Verifies signature and processes payment confirmation
 */
const handleWebhook = async (rawBody, signature) => {
  const stripe = getStripe();

  let event;

  // Verify webhook signature — MANDATORY
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    const error = new Error('Webhook signature verification failed');
    error.statusCode = 400;
    throw error;
  }

  // Log webhook event
  logger.info(`Stripe webhook received: ${event.type} (${event.id})`);

  // Handle events
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      logger.info(`Payment succeeded: ${paymentIntent.id}`);

      // Mark order as paid
      const order = await orderService.markOrderPaid(paymentIntent.id);

      // Reduce stock ONLY after confirmed payment
      if (order && order.items) {
        const stockItems = order.items.map((item) => ({
          productId: item.product,
          variantId: item.variant,
          quantity: item.quantity,
        }));
        await productService.reduceStock(stockItems);
        logger.info(`Stock reduced for order: ${order.orderNumber}`);

        // Fire-and-forget order confirmation email
        User.findById(order.user).select('name email').lean()
          .then((user) => {
            if (user) sendOrderConfirmation(order, user).catch(() => {});
          })
          .catch(() => {});
      }

      break;
    }

    case 'payment_intent.payment_failed': {
      const failedIntent = event.data.object;
      logger.warn(`Payment failed: ${failedIntent.id}`);

      // Update order status to reflect failure
      try {
        await orderService.updateOrderStatus(
          null,
          'canceled',
          { cancelReason: 'Payment failed' }
        );
      } catch {
        // Order may not exist yet — safe to ignore
      }

      break;
    }

    default:
      logger.info(`Unhandled webhook event: ${event.type}`);
  }

  return { received: true };
};

module.exports = {
  createPaymentIntent,
  handleWebhook,
};

// MukonoTalks

