/**
 * Order validation schemas
 * @module modules/orders/order.validation
 */

const Joi = require('joi');

const updateOrderStatusSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    status: Joi.string().valid('pending', 'paid', 'shipped', 'delivered', 'canceled').required(),
    trackingNumber: Joi.string().trim().allow(''),
    cancelReason: Joi.string().trim().allow(''),
  }),
};

const getOrdersQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    status: Joi.string().valid('pending', 'paid', 'shipped', 'delivered', 'canceled'),
  }),
};

module.exports = { updateOrderStatusSchema, getOrdersQuerySchema };

// MukonoTalks

