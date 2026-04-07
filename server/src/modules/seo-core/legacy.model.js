/**
 * SEO Schema model
 * Stores global structured-data schemas editable by administrators.
 * Each document is keyed by `schemaKey` (e.g. "organization", "website").
 * @module modules/seo/seo.model
 */

const mongoose = require('mongoose');

const seoSchemaDoc = new mongoose.Schema(
  {
    /**
     * Unique key identifying the schema record.
     * e.g. "organization" | "website" | "sitelinks-searchbox"
     */
    schemaKey: {
      type: String,
      required: [true, 'Schema key is required'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      match: [/^[a-z0-9-]+$/, 'Schema key must contain only lowercase letters, numbers, and hyphens'],
    },

    /** Human-readable label shown in the admin UI */
    label: {
      type: String,
      trim: true,
      maxlength: 120,
    },

    /** Short description shown below the label in the admin UI */
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    /**
     * The raw JSON-LD schema object.
     * Stored as Mixed so any valid schema.org object can be persisted.
     */
    schemaData: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Schema data is required'],
    },

    /** Whether this schema is injected into every page (global) */
    isGlobal: {
      type: Boolean,
      default: false,
    },

    /** Whether this schema is active / injected */
    isActive: {
      type: Boolean,
      default: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

const SeoSchema = mongoose.model('SeoSchema', seoSchemaDoc);
module.exports = SeoSchema;

// MukonoTalks

