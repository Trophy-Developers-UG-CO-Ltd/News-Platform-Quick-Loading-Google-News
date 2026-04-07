/**
 * Cart validation schemas
 * @module modules/cart/cart.validation
 */

const Joi = require('joi');

const addToCartSchema = {
  body: Joi.object({
    productId: Joi.string().hex().length(24).required(),
    variantId: Joi.string().hex().length(24).allow(null),
    quantity: Joi.number().integer().min(1).default(1),
  }),
};

const updateCartItemSchema = {
  params: Joi.object({
    itemId: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    quantity: Joi.number().integer().min(0).required(),
  }),
};

module.exports = { addToCartSchema, updateCartItemSchema };

// MukonoTalks

