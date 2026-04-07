/**
 * Auth service layer
 * Contains all authentication business logic
 * @module modules/auth/auth.service
 */

const User = require('./auth.model');
const { env } = require('../../config/env');

/**
 * Register a new user
 * @param {Object} userData - Registration data
 * @returns {Object} Created user document
 */
const registerUser = async (userData) => {
  const { email, acceptedTermsAt } = userData;

  // Check for existing user
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 400;
    throw error;
  }

  // Set approval status based on business config
  const isApproved = !env.REQUIRE_APPROVAL_FOR_B2B;

  const user = await User.create({
    ...userData,
    isApproved,
    role: 'customer', // Never allow role assignment from registration
    acceptedTermsAt: acceptedTermsAt || new Date().toISOString(),
  });

  return user;
};

/**
 * Authenticate user with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Object} Authenticated user document
 */
const loginUser = async (email, password) => {
  // Find user with password field included
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Check if account is deactivated
  if (user.isDeactivated) {
    const error = new Error('This account has been deactivated');
    error.statusCode = 403;
    throw error;
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  return user;
};

/**
 * Get user profile by ID
 * @param {string} userId
 * @returns {Object} User document
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

/**
 * Update user profile
 * @param {string} userId
 * @param {Object} updateData
 * @returns {Object} Updated user document
 */
const updateUserProfile = async (userId, updateData) => {
  // Prevent role/approval changes from profile update
  delete updateData.role;
  delete updateData.isApproved;
  delete updateData.password;
  delete updateData.email;

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Change user password
 * @param {string} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Object} Updated user document
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  await user.save();

  return user;
};

/**
 * Deactivate user account (self-service)
 * Anonymizes user data for POPIA compliance
 * @param {string} userId
 * @param {string} password - User must confirm password
 * @returns {Object} Confirmation message
 */
const deactivateAccount = async (userId, password) => {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify password for account deletion
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    const error = new Error('Password is incorrect');
    error.statusCode = 400;
    throw error;
  }

  // For POPIA compliance: anonymize rather than hard delete
  const anonymizedEmail = `deleted_${user._id}@deactivated.local`;
  const timestamp = new Date().toISOString();

  await User.findByIdAndUpdate(userId, {
    name: 'Deleted User',
    email: anonymizedEmail,
    phone: null,
    companyName: 'Deactivated',
    companyType: null,
    password: `DEACTIVATED_${Date.now()}`, // Invalidate password
    isDeactivated: true,
    deactivatedAt: timestamp,
  });

  return { message: 'Account deactivated successfully', deactivatedAt: timestamp };
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  deactivateAccount,
};

// MukonoTalks

