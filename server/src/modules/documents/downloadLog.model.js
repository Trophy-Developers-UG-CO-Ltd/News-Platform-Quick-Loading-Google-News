/**
 * Download Log Model
 * Tracks all document download attempts for security and analytics
 * @module modules/documents/downloadLog.model
 */

const mongoose = require('mongoose');

const downloadLogSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    userName: {
      type: String,
      required: true,
    },

    userEmail: {
      type: String,
      required: true,
    },

    companyName: {
      type: String,
      default: null,
    },

    documentTitle: {
      type: String,
      required: true,
    },

    documentCategory: {
      type: String,
      default: null,
    },

    ipAddress: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ['success', 'denied', 'error'],
      default: 'success',
      index: true,
    },

    denialReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'download_logs',
  }
);

// Compound indexes for reporting
downloadLogSchema.index({ document: 1, createdAt: -1 });
downloadLogSchema.index({ user: 1, createdAt: -1 });
downloadLogSchema.index({ companyName: 1, createdAt: -1 });
downloadLogSchema.index({ createdAt: -1 });

// Auto-expire after 3 years
downloadLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 94608000 });

const DownloadLog = mongoose.model('DownloadLog', downloadLogSchema);

module.exports = DownloadLog;

// MukonoTalks

