/**
 * Audit Service
 * Centralized audit logging for enterprise compliance
 * @module modules/audit/audit.service
 */

const AuditLog = require('./audit.model');
const logger = require('../../utils/logger');

class AuditService {
  /**
   * Log an auditable action
   * @param {Object} params
   * @param {string} params.action - Action enum value
   * @param {Object} [params.req] - Express request (extracts user, IP, userAgent)
   * @param {Object} [params.user] - User override (if not from req)
   * @param {string} [params.targetModel] - Model name affected
   * @param {string} [params.targetId] - Document ID affected
   * @param {string} [params.targetIdentifier] - Human-readable identifier (e.g., email, slug)
   * @param {Object} [params.changes] - { before, after }
   * @param {Object} [params.metadata] - Additional context
   * @param {string} [params.severity] - info | warning | critical
   * @param {string} [params.status] - success | failure
   */
  static async log({
    action,
    req = null,
    user = null,
    targetModel = null,
    targetId = null,
    targetIdentifier = null,
    changes = {},
    metadata = {},
    severity = 'info',
    status = 'success',
  }) {
    try {
      const performedBy = user?._id || req?.user?._id || null;
      const performedByEmail = user?.email || req?.user?.email || null;
      const performedByRole = user?.role || req?.user?.role || null;
      const ipAddress = req
        ? req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip
        : null;
      const userAgent = req ? req.headers['user-agent'] : null;

      // Sanitize changes — strip passwords and sensitive fields
      const sanitizedChanges = AuditService._sanitizeChanges(changes);

      await AuditLog.create({
        action,
        performedBy,
        performedByEmail,
        performedByRole,
        targetModel,
        targetId,
        targetIdentifier,
        changes: sanitizedChanges,
        metadata,
        ipAddress,
        userAgent,
        severity,
        status,
      });
    } catch (error) {
      // Never let audit logging break the main flow
      logger.error('Audit log write failed:', {
        action,
        error: error.message,
      });
    }
  }

  /**
   * Query audit logs with filtering and pagination
   */
  static async query({
    action,
    performedBy,
    targetModel,
    targetId,
    severity,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  }) {
    const filter = {};

    if (action) filter.action = action;
    if (performedBy) filter.performedBy = performedBy;
    if (targetModel) filter.targetModel = targetModel;
    if (targetId) filter.targetId = targetId;
    if (severity) filter.severity = severity;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('performedBy', 'name email role')
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get audit trail for a specific entity
   */
  static async getEntityTrail(targetModel, targetId, { page = 1, limit = 20 } = {}) {
    return AuditService.query({ targetModel, targetId, page, limit });
  }

  /**
   * Get user activity log
   */
  static async getUserActivity(userId, { page = 1, limit = 20 } = {}) {
    return AuditService.query({ performedBy: userId, page, limit });
  }

  /**
   * Get security events (warnings + criticals)
   */
  static async getSecurityEvents({ page = 1, limit = 50, startDate, endDate } = {}) {
    const filter = {
      severity: { $in: ['warning', 'critical'] },
    };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('performedBy', 'name email role')
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return {
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get action summary counts for dashboard
   */
  static async getActionSummary(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const summary = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          lastOccurrence: { $max: '$createdAt' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return summary;
  }

  /**
   * Strip sensitive data from change records
   */
  static _sanitizeChanges(changes) {
    if (!changes) return {};
    const sensitiveFields = ['password', 'token', 'secret', 'resetPasswordToken', 'stripePaymentIntentId'];
    const sanitize = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      const cleaned = { ...obj };
      for (const field of sensitiveFields) {
        if (cleaned[field]) cleaned[field] = '[REDACTED]';
      }
      return cleaned;
    };
    return {
      before: sanitize(changes.before),
      after: sanitize(changes.after),
    };
  }
}

module.exports = AuditService;

// MukonoTalks

