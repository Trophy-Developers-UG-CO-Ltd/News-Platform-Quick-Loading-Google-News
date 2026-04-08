/**
 * Advertise Inquiry Model
 * Stores public advertising leads submitted from the Advertise page
 * @module modules/advertise-inquiries/advertiseInquiry.model
 */

const mongoose = require('mongoose');

const advertiseInquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
      index: true,
    },

    business: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200,
      index: true,
    },

    budgetRange: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new',
      index: true,
    },

    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

advertiseInquirySchema.index({ status: 1, createdAt: -1 });
advertiseInquirySchema.index({ createdAt: -1 });

module.exports = mongoose.model('AdvertiseInquiry', advertiseInquirySchema);

// MukonoTalks
