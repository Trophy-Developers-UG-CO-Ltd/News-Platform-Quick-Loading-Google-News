/**
 * ContentTemplate validation schemas
 * @module modules/contentTemplates/contentTemplate.validation
 */

const Joi = require('joi');

const createTemplateSchema = {
  body: Joi.object({
    templateName: Joi.string().trim().min(2).max(120).required(),
    templateType: Joi.string().trim().lowercase().min(2).max(80).required(),
    htmlContent: Joi.string().trim().min(10).max(50000).required(),
  }),
};

const updateTemplateSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    templateName: Joi.string().trim().min(2).max(120),
    htmlContent: Joi.string().trim().min(10).max(50000),
    note: Joi.string().trim().max(200).allow(''),
    isActive: Joi.boolean(),
  }).min(1),
};

const restoreRevisionSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
    revisionIndex: Joi.number().integer().min(0).required(),
  }),
};

module.exports = { createTemplateSchema, updateTemplateSchema, restoreRevisionSchema };

// MukonoTalks

