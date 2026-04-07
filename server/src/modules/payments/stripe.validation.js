/**
 * Payment validation schemas
 * @module modules/payments/stripe.validation
 */

const Joi = require('joi');

const createIntentSchema = {
  body: Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          productId: Joi.string().hex().length(24).required(),
          variantId: Joi.string().hex().length(24).allow(null),
          quantity: Joi.number().integer().min(1).required(),
        })
      )
      .min(1)
      .required(),
    shippingAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().default('South Africa'),
    }).required(),
    billingAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().default('South Africa'),
    }),
    notes: Joi.string().trim().max(500).allow(''),
  }),
};

module.exports = { createIntentSchema };

// MukonoTalks

