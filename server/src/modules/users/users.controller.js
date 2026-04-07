/**
 * Users admin controller
 * HTTP handlers for admin user management
 * Enterprise audit logging on all admin user actions
 * @module modules/users/users.controller
 */

const usersService = require('./users.service');
const AuditService = require('../audit/audit.service');
const { asyncHandler } = require('../../middlewares/error.middleware');

/**
 * @desc    Get all users (admin)
 * @route   GET /api/users
 * @access  Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const result = await usersService.getAllUsers(req.query);
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

/**
 * @desc    Get single user (admin)
 * @route   GET /api/users/:id
 * @access  Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  try {
    const user = await usersService.getUserById(req.params.id);
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
 * @desc    Update user role/approval (admin)
 * @route   PUT /api/users/:id
 * @access  Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  try {
    const user = await usersService.updateUser(req.params.id, req.body);

    const action = req.body.role ? 'USER_ROLE_CHANGE' : (req.body.isApproved !== undefined ? 'USER_APPROVE' : 'SETTINGS_CHANGE');
    AuditService.log({
      action,
      req,
      targetModel: 'User',
      targetId: req.params.id,
      targetIdentifier: user.email,
      changes: { after: req.body },
      severity: req.body.role ? 'warning' : 'info',
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
 * @desc    Delete user (admin)
 * @route   DELETE /api/users/:id
 * @access  Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  try {
    const result = await usersService.deleteUser(req.params.id);

    AuditService.log({
      action: 'USER_DELETE',
      req,
      targetModel: 'User',
      targetId: req.params.id,
      severity: 'critical',
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

/**
 * @desc    Create a new user with any role — developer only
 * @route   POST /api/users
 * @access  Developer
 */
const createUser = asyncHandler(async (req, res) => {
  try {
    const user = await usersService.createUser(req.body);

    AuditService.log({
      action: 'USER_CREATE',
      req,
      targetModel: 'User',
      targetId: user._id,
      targetIdentifier: user.email,
      changes: { after: { role: user.role, email: user.email } },
      severity: user.role !== 'customer' ? 'warning' : 'info',
    });

    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
};

// MukonoTalks

