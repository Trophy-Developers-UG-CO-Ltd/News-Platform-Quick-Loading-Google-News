/**
 * Users admin validation schemas
 * @module modules/users/users.validation
 */

const Joi = require('joi');

const updateUserSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
      .messages({ 'string.length': 'Invalid user ID' }),
  }),
  body: Joi.object({
    role: Joi.string().valid('customer', 'admin', 'developer'),
    isApproved: Joi.boolean(),
  }),
};

const getUserSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
      .messages({ 'string.length': 'Invalid user ID' }),
  }),
};

// Developer-only: create a user with any role (including admin/developer)
const createUserSchema = {
  body: Joi.object({
    name: Joi.string().max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid('customer', 'admin', 'developer').default('customer'),
    companyName: Joi.string().max(200).optional().allow(''),
    isApproved: Joi.boolean().default(true),
  }),
};

module.exports = {
  updateUserSchema,
  getUserSchema,
  createUserSchema,
};

// MukonoTalks

