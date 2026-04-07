/**
 * Maintenance mode model
 * Singleton document keyed by `_id: 'default'`
 * Controls site-wide maintenance mode (developer-only feature)
 * @module modules/maintenance/maintenance.model
 */

const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'default' },

    // Whether maintenance mode is active
    isEnabled: {
      type: Boolean,
      default: false,
    },

    // Message displayed on the maintenance page
    message: {
      type: String,
      default: 'We are currently performing scheduled maintenance. Please check back soon.',
      trim: true,
      maxlength: [500, 'Maintenance message cannot exceed 500 characters'],
    },

    // Estimated end time (optional, displayed to visitors)
    estimatedEnd: {
      type: Date,
      default: null,
    },

    // Who toggled maintenance mode last
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

module.exports = mongoose.model('Maintenance', maintenanceSchema, 'maintenance');

// MukonoTalks

