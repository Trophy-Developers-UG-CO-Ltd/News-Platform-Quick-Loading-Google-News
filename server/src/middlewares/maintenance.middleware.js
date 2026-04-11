/**
 * Maintenance mode middleware
 * Blocks API requests for non-developer users when maintenance mode is enabled.
 * Allows: /api/maintenance (status check), /api/auth (login), /api/branding, /health
 * Developers always bypass maintenance mode.
 * @module middlewares/maintenance.middleware
 */

const Maintenance = require('../modules/maintenance/maintenance.model');
const jwt = require('jsonwebtoken');
const User = require('../modules/auth/auth.model');
const { env } = require('../config/env');

// Cache maintenance status for 10 seconds to avoid DB hit on every request
let cachedStatus = null;
let cacheExpiry = 0;

const invalidateMaintenanceCache = () => {
  cachedStatus = null;
  cacheExpiry = 0;
};

const getMaintenanceStatus = async () => {
  const now = Date.now();
  if (cachedStatus !== null && now < cacheExpiry) {
    return cachedStatus;
  }
  try {
    const doc = await Maintenance.findById('default').lean();
    cachedStatus = doc?.isEnabled || false;
    cacheExpiry = now + 10_000; // 10s cache
    return cachedStatus;
  } catch {
    // If DB lookup fails, don't block the site
    return false;
  }
};

// Paths that are always accessible even during maintenance
const BYPASS_PATHS = [
  '/api/maintenance',  // so frontend can check status
  '/api/auth',         // so developer can log in
  '/api/branding',     // so the UI still renders chrome
  '/health',           // health check
];

const maintenanceMiddleware = async (req, res, next) => {
  // Always allow non-API paths (static files, React build, etc.)
  if (!req.path.startsWith('/api') && req.path !== '/health') {
    return next();
  }

  const isEnabled = await getMaintenanceStatus();
  if (!isEnabled) return next();

  // Allow bypass paths
  if (BYPASS_PATHS.some((p) => req.path === p || req.path.startsWith(p + '/'))) {
    return next();
  }

  // Check if the requester is a developer (peek at JWT without full auth middleware)
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith('Bearer') && req.headers.authorization.split(' ')[1]);

    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('role').lean();
      if (user?.role === 'developer') {
        return next(); // developers bypass maintenance
      }
    }
  } catch {
    // Token invalid or missing — treat as guest
  }

  // Block the request
  return res.status(503).json({
    success: false,
    maintenance: true,
    message: 'Site is under maintenance. Please try again later.',
  });
};

module.exports = { maintenanceMiddleware, invalidateMaintenanceCache };

// MukonoTalks

