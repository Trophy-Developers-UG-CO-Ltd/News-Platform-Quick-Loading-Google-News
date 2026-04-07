/**
 * Auth input validation schemas (Joi)
 * @module modules/auth/auth.validation
 */

const Joi = require('joi');

const registerSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required()
      .messages({ 'any.required': 'Name is required' }),
    email: Joi.string().email().lowercase().trim().required()
      .messages({ 'any.required': 'Email is required' }),
    password: Joi.string().min(8).max(128).required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'any.required': 'Password is required',
      }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({ 'any.only': 'Passwords do not match' }),
    companyName: Joi.string().trim().max(200).allow(''),
    companyType: Joi.string().valid(
      'manufacturer', 'distributor', 'retailer',
      'contractor', 'laboratory', 'government', 'other'
    ).allow(''),
    phone: Joi.string().trim().allow(''),
    address: Joi.object({
      street: Joi.string().allow(''),
      city: Joi.string().allow(''),
      state: Joi.string().allow(''),
      postalCode: Joi.string().allow(''),
      country: Joi.string().allow(''),
    }),
  }),
};

const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().lowercase().trim().required()
      .messages({ 'any.required': 'Email is required' }),
    password: Joi.string().required()
      .messages({ 'any.required': 'Password is required' }),
  }),
};

const updateProfileSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    companyName: Joi.string().trim().max(200).allow(''),
    companyType: Joi.string().valid(
      'manufacturer', 'distributor', 'retailer',
      'contractor', 'laboratory', 'government', 'other'
    ).allow(''),
    phone: Joi.string().trim().allow(''),
    address: Joi.object({
      street: Joi.string().allow(''),
      city: Joi.string().allow(''),
      state: Joi.string().allow(''),
      postalCode: Joi.string().allow(''),
      country: Joi.string().allow(''),
    }),
  }),
};

const changePasswordSchema = {
  body: Joi.object({
    currentPassword: Joi.string().required()
      .messages({ 'any.required': 'Current password is required' }),
    newPassword: Joi.string().min(8).max(128).required()
      .messages({
        'string.min': 'New password must be at least 8 characters',
        'any.required': 'New password is required',
      }),
    confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required()
      .messages({ 'any.only': 'Passwords do not match' }),
  }),
};

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
};

// MukonoTalks

