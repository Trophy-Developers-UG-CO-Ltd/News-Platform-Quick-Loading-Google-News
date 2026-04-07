/**
 * Users admin service layer
 * Business logic for admin user management
 * @module modules/users/users.service
 */

const User = require('../auth/auth.model');
const { paginate, paginationMeta, buildSort } = require('../../utils/helpers');

/**
 * Get all users (admin)
 */
const getAllUsers = async (query) => {
  const { page, limit, skip } = paginate(query.page, query.limit);
  const sort = buildSort(query.sort, ['name', 'email', 'role', 'createdAt']);

  // Build filter
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.isApproved !== undefined) filter.isApproved = query.isApproved === 'true';
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
      { companyName: { $regex: query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: paginationMeta(total, page, limit),
  };
};

/**
 * Get single user by ID (admin)
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

/**
 * Update user role or approval status (admin)
 */
const updateUser = async (userId, updateData) => {
  // Only allow specific admin-controlled fields
  const allowedUpdates = {};
  if (updateData.role) allowedUpdates.role = updateData.role;
  if (updateData.isApproved !== undefined) allowedUpdates.isApproved = updateData.isApproved;

  const user = await User.findByIdAndUpdate(userId, allowedUpdates, {
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
 * Delete user (admin)
 */
const deleteUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.role === 'developer') {
    const error = new Error('Cannot delete developer accounts');
    error.statusCode = 403;
    throw error;
  }

  await User.findByIdAndDelete(userId);
  return { message: 'User deleted successfully' };
};

/**
 * Create a user with any role — developer-only operation
 */
const createUser = async (data) => {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    password: data.password,
    role: data.role || 'customer',
    companyName: data.companyName,
    isApproved: data.isApproved !== undefined ? data.isApproved : true,
  });

  // Return without password
  const doc = user.toObject();
  delete doc.password;
  return doc;
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
};

// MukonoTalks

