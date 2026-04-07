/**
 * Auth routes
 * @module modules/auth/auth.routes
 */

const express = require('express');
const router = express.Router();

const authController = require('./auth.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { authLimiter } = require('../../middlewares/rateLimit.middleware');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require('./auth.validation');

// Public routes (rate limited)
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);

// Protected routes
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, validate(updateProfileSchema), authController.updateProfile);
router.put('/change-password', protect, validate(changePasswordSchema), authController.changePassword);
router.post('/deactivate', protect, authController.deactivateAccount);

module.exports = router;

// MukonoTalks

