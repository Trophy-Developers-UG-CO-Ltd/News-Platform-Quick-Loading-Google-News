/**
 * Document model
 * Handles technical specs, data sheets, and restricted files
 * @module modules/documents/document.model
 */

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx', 'xlsx', 'image', 'other'],
      default: 'pdf',
    },
    fileSize: Number,
    category: {
      type: String,
      enum: ['datasheet', 'sds', 'tds', 'certificate', 'manual', 'other'],
      default: 'datasheet',
    },
    isRestricted: {
      type: Boolean,
      default: true,
      // Restricted documents require authentication to access
    },
    requiresAdminApproval: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ category: 1, createdAt: -1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;

// MukonoTalks

