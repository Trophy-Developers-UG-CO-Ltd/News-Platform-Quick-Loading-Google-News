/**
 * Inquiry Validation Schemas
 * Joi schemas for quote request validation
 * @module modules/inquiries/inquiry.validation
 */

const Joi = require('joi');

const createInquirySchema = {
  body: Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          product: Joi.string().hex().length(24).required(),
          title: Joi.string().required(),
          sku: Joi.string().allow(null, ''),
          quantity: Joi.number().integer().min(1).required(),
          notes: Joi.string().max(1000).allow(''),
        })
      )
      .min(1)
      .required(),
    message: Joi.string().max(5000).allow(''),
    industry: Joi.string().max(100).allow(null, ''),
    contactPhone: Joi.string().max(20).allow(null, ''),
    deliveryDestination: Joi.string().max(200).allow(null, ''),
    requiredByDate: Joi.date().min('now').allow(null),
    paymentTerms: Joi.string().valid('advance', 'net-30', 'net-60', 'net-90', 'letter-of-credit', 'other').allow(null, ''),
    budgetRange: Joi.string().max(100).allow(null, ''),
  }),
};

const updateInquiryStatusSchema = {
  body: Joi.object({
    status: Joi.string()
      .valid('new', 'reviewing', 'quoted', 'accepted', 'rejected', 'expired')
      .required(),
    adminNotes: Joi.string().max(5000).allow(''),
    quotedAmount: Joi.number().min(0).allow(null),
    validUntil: Joi.date().allow(null),
    note: Joi.string().max(1000).allow(''),
  }),
};

const getInquiriesQuerySchema = {
  query: Joi.object({
    status: Joi.string().valid('new', 'reviewing', 'quoted', 'accepted', 'rejected', 'expired'),
    companyName: Joi.string(),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'status'),
    sortOrder: Joi.string().valid('asc', 'desc'),
  }),
};

module.exports = {
  createInquirySchema,
  updateInquiryStatusSchema,
  getInquiriesQuerySchema,
};

// MukonoTalks

