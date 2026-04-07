/**
 * Audit Log Model
 * Enterprise-grade audit trail for all sensitive actions
 * @module modules/audit/audit.model
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        // Auth actions
        'USER_REGISTER',
        'USER_LOGIN',
        'USER_LOGOUT',
        'USER_LOGIN_FAILED',
        'PASSWORD_CHANGE',
        'PROFILE_UPDATE',

        // Admin - User actions
        'USER_ROLE_CHANGE',
        'USER_APPROVE',
        'USER_REJECT',
        'USER_DELETE',

        // Product actions
        'PRODUCT_CREATE',
        'PRODUCT_UPDATE',
        'PRODUCT_DELETE',
        'PRODUCT_RESTORE',

        // Category actions
        'CATEGORY_CREATE',
        'CATEGORY_UPDATE',
        'CATEGORY_DELETE',

        // Order actions
        'ORDER_CREATE',
        'ORDER_STATUS_CHANGE',
        'ORDER_CANCEL',
        'PAYMENT_RECEIVED',
        'PAYMENT_FAILED',

        // Document actions
        'DOCUMENT_UPLOAD',
        'DOCUMENT_DELETE',
        'DOCUMENT_DOWNLOAD',
        'DOCUMENT_ACCESS_DENIED',

        // Cart actions
        'CART_CHECKOUT',

        // Inquiry / Quote
        'QUOTE_REQUEST',
        'QUOTE_STATUS_CHANGE',
        'INQUIRY_CREATE',
        'INQUIRY_UPDATE',

        // System actions
        'WEBHOOK_RECEIVED',
        'WEBHOOK_FAILED',
        'RATE_LIMIT_EXCEEDED',
        'UNAUTHORIZED_ACCESS',

        // Admin actions
        'ADMIN_SETTINGS_CHANGE',
        'DATA_EXPORT',
        'BULK_ACTION',
      ],
      index: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    performedByEmail: {
      type: String,
      default: null,
    },

    performedByRole: {
      type: String,
      default: null,
    },

    targetModel: {
      type: String,
      enum: ['User', 'Product', 'Order', 'Category', 'Document', 'Cart', 'Inquiry', 'Setting', null],
      default: null,
      index: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    targetIdentifier: {
      type: String,
      default: null,
    },

    changes: {
      before: { type: mongoose.Schema.Types.Mixed, default: null },
      after: { type: mongoose.Schema.Types.Mixed, default: null },
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },

    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
      index: true,
    },

    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
    },
  },
  {
    timestamps: true,
    collection: 'audit_logs',
  }
);

// Compound indexes for query performance
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ targetModel: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 }); // TTL-ready, general timeline

// Auto-expire old logs after 2 years (730 days)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;

// MukonoTalks

