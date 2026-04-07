/**
 * Redirect model
 * Tracks URL redirects (auto-generated on slug change or manually created)
 * Pending admin approval before becoming active
 * @module modules/redirects/redirect.model
 */

const mongoose = require('mongoose');

const { Schema } = mongoose;

const redirectSchema = new Schema(
  {
    fromPath: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    toPath: {
      type: String,
      required: true,
      trim: true,
    },
    statusCode: {
      type: Number,
      enum: [301, 302],
      default: 301,
    },
    /** pending = awaiting admin approval; approved = live; rejected = disabled */
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    /** auto = system-generated on slug change; manual = admin-created */
    source: {
      type: String,
      enum: ['auto', 'manual'],
      default: 'manual',
      index: true,
    },
    resourceType: {
      type: String,
      enum: ['product', 'page', 'article', 'custom'],
      default: 'custom',
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    /** Total clicks tracked after the redirect is followed */
    clickCount: {
      type: Number,
      default: 0,
    },
    lastClickedAt: {
      type: Date,
      default: null,
    },
    note: {
      type: String,
      default: '',
      maxlength: 500,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One redirect per fromPath — upsert on re-slug
redirectSchema.index({ fromPath: 1 }, { unique: true });
redirectSchema.index({ resourceType: 1, resourceId: 1 });
redirectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Redirect', redirectSchema);

// MukonoTalks

