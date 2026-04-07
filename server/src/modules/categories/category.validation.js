/**
 * Category validation schemas
 * @module modules/categories/category.validation
 */

const Joi = require('joi');

const seoFields = {
  seoTitle:        Joi.string().trim().max(70).allow(''),
  seoDescription:  Joi.string().trim().max(160).allow(''),
  seoKeywords:     Joi.array().items(Joi.string().trim().max(60)).max(20),
  ogTitle:         Joi.string().trim().max(70).allow(''),
  ogDescription:   Joi.string().trim().max(200).allow(''),
  ogImage:         Joi.string().uri().allow(''),
  sortOrder:       Joi.number().integer().min(0),
};

const createCategorySchema = {
  body: Joi.object({
    name:        Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().trim().max(500).allow(''),
    image:       Joi.string().uri().allow(''),
    parent:      Joi.string().hex().length(24).allow(null),
    ...seoFields,
  }),
};

const updateCategorySchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    name:        Joi.string().trim().min(2).max(100),
    description: Joi.string().trim().max(500).allow(''),
    image:       Joi.string().uri().allow(''),
    parent:      Joi.string().hex().length(24).allow(null),
    isActive:    Joi.boolean(),
    ...seoFields,
  }).min(1),
};

module.exports = { createCategorySchema, updateCategorySchema };
