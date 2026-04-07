/**
 * Stripe configuration
 * Initializes Stripe SDK with secret key
 * @module config/stripe
 */

const Stripe = require('stripe');
const { env } = require('./env');

let stripe = null;

const getStripe = () => {
  if (!stripe) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
};

module.exports = { getStripe };

// MukonoTalks

