/**
 * Branding / White-label settings model
 * Singleton document keyed by `_id: 'default'`
 * @module modules/branding/branding.model
 */

const mongoose = require('mongoose');

const brandingSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'default' },

    // The platform name shown in admin panel (white-label)
    platformName: {
      type: String,
      default: 'MukonoTalks',
      trim: true,
      maxlength: [100, 'Platform name cannot exceed 100 characters'],
    },

    // Optional tagline displayed under the platform name in sidebar
    platformTagline: {
      type: String,
      default: 'Admin Panel',
      trim: true,
      maxlength: [100, 'Tagline cannot exceed 100 characters'],
    },

    // Primary accent color (hex, used for sidebar accent in white-label mode)
    primaryColor: {
      type: String,
      default: '#4f46e5',
      match: [/^#[0-9A-Fa-f]{3,6}$/, 'Must be a valid hex color'],
    },

    // Logo URL for the admin panel (optional)
    logoUrl: {
      type: String,
      default: null,
      trim: true,
    },

    // Favicon URL (optional)
    faviconUrl: {
      type: String,
      default: null,
      trim: true,
    },

    // Support email shown in the admin panel footer
    supportEmail: {
      type: String,
      default: '',
      trim: true,
    },

    // Last updated by (user ID)
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    _id: false, // use our custom string _id
  }
);

module.exports = mongoose.model('Branding', brandingSchema);

// MukonoTalks

