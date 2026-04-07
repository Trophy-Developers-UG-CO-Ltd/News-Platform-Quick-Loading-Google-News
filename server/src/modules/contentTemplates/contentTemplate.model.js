/**
 * ContentTemplate model
 * Stores reusable HTML templates for programmatic page generation
 * e.g. templateType = "application_description" generates:
 *      /products/:productSlug/application/:applicationSlug
 * @module modules/contentTemplates/contentTemplate.model
 */

const mongoose = require('mongoose');

const revisionSchema = new mongoose.Schema(
  {
    htmlContent: { type: String, required: true },
    savedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { timestamps: true }
);

const contentTemplateSchema = new mongoose.Schema(
  {
    templateName: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      maxlength: [120, 'Template name cannot exceed 120 characters'],
    },
    templateType: {
      type: String,
      required: [true, 'Template type is required'],
      trim: true,
      lowercase: true,
      index: true,
      // e.g. "application_description", "product_overview", …
      maxlength: [80, 'Template type cannot exceed 80 characters'],
    },
    htmlContent: {
      type: String,
      required: [true, 'HTML content is required'],
      maxlength: [50000, 'Template cannot exceed 50 000 characters'],
    },
    // Ordered list of previous versions (latest first, max 20)
    revisions: {
      type: [revisionSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Compound uniqueness: one active template per type
contentTemplateSchema.index({ templateType: 1, isActive: 1 });

const ContentTemplate = mongoose.model('ContentTemplate', contentTemplateSchema);

module.exports = ContentTemplate;

// MukonoTalks

