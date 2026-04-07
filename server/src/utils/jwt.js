/**
 * JWT utility functions
 * Handles token generation and cookie management
 * @module utils/jwt
 */

const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

/**
 * Generate JWT token
 * @param {string} id - User ID
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE,
  });
};

/**
 * Send token response with HTTP-only cookie
 * @param {Object} user - User document
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const isHttps = env.NODE_ENV === 'production' || !!process.env.CODESPACES;

  const cookieOptions = {
    expires: new Date(
      Date.now() + env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
  };

  // Remove password from output
  const userResponse = user.toObject();
  delete userResponse.password;

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: userResponse,
    });
};

module.exports = { generateToken, sendTokenResponse };

// MukonoTalks

