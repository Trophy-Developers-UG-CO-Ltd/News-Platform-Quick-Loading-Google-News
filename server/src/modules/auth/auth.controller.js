/**
 * Auth controller
 * Handles HTTP request/response for authentication
 * Enterprise audit logging on all auth actions
 * @module modules/auth/auth.controller
 */

const authService = require('./auth.service');
const { sendTokenResponse } = require('../../utils/jwt');
const AuditService = require('../audit/audit.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { sendWelcomeEmail } = require('../../utils/email');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);

    AuditService.log({
      action: 'USER_REGISTER',
      req,
      user,
      targetModel: 'User',
      targetId: user._id,
      targetIdentifier: user.email,
      metadata: { companyName: user.companyName, companyType: user.companyType },
    });

    // Fire-and-forget welcome email
    sendWelcomeEmail(user).catch(() => {});

    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authService.loginUser(email, password);

    AuditService.log({
      action: 'USER_LOGIN',
      req,
      user,
      targetModel: 'User',
      targetId: user._id,
      targetIdentifier: email,
    });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    // Log failed login attempt
    AuditService.log({
      action: 'USER_LOGIN_FAILED',
      req,
      severity: 'warning',
      status: 'failure',
      metadata: { email: req.body?.email },
    });

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @desc    Logout user (clear cookie)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  AuditService.log({
    action: 'USER_LOGOUT',
    req,
    targetModel: 'User',
    targetId: req.user?._id,
    targetIdentifier: req.user?.email,
  });

  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  try {
    const user = await authService.getUserProfile(req.user._id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  try {
    const user = await authService.updateUserProfile(req.user._id, req.body);

    AuditService.log({
      action: 'PROFILE_UPDATE',
      req,
      targetModel: 'User',
      targetId: req.user._id,
      targetIdentifier: req.user.email,
      changes: { after: req.body },
    });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user._id, currentPassword, newPassword);

    AuditService.log({
      action: 'PASSWORD_CHANGE',
      req,
      targetModel: 'User',
      targetId: req.user._id,
      targetIdentifier: req.user.email,
      severity: 'warning',
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @desc    Deactivate user account (self-service)
 * @route   POST /api/auth/deactivate
 * @access  Private
 */
const deactivateAccount = asyncHandler(async (req, res) => {
  try {
    const { password, reason } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to confirm account deactivation',
      });
    }

    const result = await authService.deactivateAccount(req.user._id, password);

    // Critical audit log for account deletion
    AuditService.log({
      action: 'ACCOUNT_DEACTIVATE',
      req,
      targetModel: 'User',
      targetId: req.user._id,
      targetIdentifier: req.user.email,
      severity: 'critical',
      metadata: { reason: reason || 'User-initiated' },
    });

    // Clear authentication cookie
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 5 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  deactivateAccount,
};

// MukonoTalks

