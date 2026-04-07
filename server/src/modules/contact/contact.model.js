/**
 * Contact Message Model
 * Stores general public contact form submissions
 * @module modules/contact/contact.model
 */

const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },

    phone: {
      type: String,
      default: null,
      trim: true,
      maxlength: 30,
    },

    company: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'finished', 'trashed'],
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

module.exports = mongoose.model('ContactMessage', contactMessageSchema);

// MukonoTalks

