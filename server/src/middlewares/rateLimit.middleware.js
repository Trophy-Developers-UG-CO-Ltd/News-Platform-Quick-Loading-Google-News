/**
 * Rate limiting middleware
 * Protects auth and checkout routes from brute force attacks
 * Global limiter is intentionally generous — not a security boundary,
 * just a basic abuse guard. Admin routes are exempt entirely.
 * @module middlewares/rateLimit.middleware
 */

const rateLimit = require('express-rate-limit');

/** Skip rate limiting in development and for admin routes / logged-in admins */
const globalSkip = (req) => {
  // Skip in development mode
  if (process.env.NODE_ENV === 'development') return true;
  // Skip all /admin routes
  if (req.path.startsWith('/admin') || req.originalUrl.includes('/admin')) return true;
  return false;
};

/**
 * Global rate limiter — generous limit for general API usage
 * 500 req / 15 min per IP; skipped in development and for admin paths
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  skip: globalSkip,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth rate limiter — strict limit for login/register
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Checkout rate limiter — prevent payment abuse
 */
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many checkout attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { globalLimiter, authLimiter, checkoutLimiter };

// MukonoTalks

