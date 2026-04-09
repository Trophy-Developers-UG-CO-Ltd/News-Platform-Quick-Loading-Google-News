/**
 * Role-based access control middleware
 * Restricts route access to specific roles
 * @module middlewares/role.middleware
 */

/**
 * Authorize specific roles
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'customer')
 * Note: developer privileges inherit all super admin/admin privileges.
 *       Only developers can enable/disable maintenance mode.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — authentication required',
      });
    }

    // developer inherits all super admin/admin privileges
    const effectiveRoles = roles.includes('admin')
      ? [...new Set([...roles, 'developer'])]
      : roles;

    if (!effectiveRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

/**
 * Require B2B approval for certain routes
 */
const requireApproval = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (req.user.role === 'admin' || req.user.role === 'developer') {
    return next();
  }

  if (req.user.isApproved === false) {
    return res.status(403).json({
      success: false,
      message: 'Your account is pending approval. Please contact support.',
    });
  }

  next();
};

module.exports = { authorize, requireApproval };

// MukonoTalks

