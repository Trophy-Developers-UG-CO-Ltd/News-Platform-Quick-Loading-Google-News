/**
 * Site Settings model
 * Singleton document keyed by `_id: 'default'`
 * Stores site-wide configuration such as analytics tracking IDs.
 * @module modules/site-settings/siteSettings.model
 */

const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'default' },

    // Google Analytics 4 Measurement ID (e.g. G-XXXXXXXXXX)
    ga4MeasurementId: {
      type: String,
      default: '',
      trim: true,
      maxlength: [30, 'GA4 Measurement ID cannot exceed 30 characters'],
      match: [/^(G-[A-Z0-9]+)?$/, 'Must be a valid GA4 Measurement ID (e.g. G-XXXXXXXXXX)'],
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema, 'site_settings');

// MukonoTalks

