/**
 * Security middleware
 * Additional security measures for enterprise compliance
 * @module middlewares/security.middleware
 */

const logger = require('../utils/logger');

/**
 * Prevent direct access to upload/document directories
 * All document access must go through authenticated API routes
 */
const blockDirectFileAccess = (req, res, next) => {
  const blockedPatterns = [
    /\.(pdf|docx?|xlsx?|pptx?|csv)$/i,
    /\/uploads\/documents\//i,
    /\/uploads\/restricted\//i,
  ];

  const isBlocked = blockedPatterns.some((pattern) => pattern.test(req.path));

  if (isBlocked && !req.path.startsWith('/api/')) {
    logger.warn(`Blocked direct file access attempt: ${req.path} from ${req.ip}`);
    return res.status(403).json({
      success: false,
      message: 'Direct file access is not permitted. Use the API to request documents.',
    });
  }

  next();
};

/**
 * Add security headers beyond what Helmet provides
 */
const additionalSecurityHeaders = (req, res, next) => {
  // Prevent browsers from MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Don't expose server software
  res.removeHeader('X-Powered-By');
  // Permissions policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
};

/**
 * Request ID middleware for tracing
 */
const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
};

module.exports = { blockDirectFileAccess, additionalSecurityHeaders, requestId };

// MukonoTalks

