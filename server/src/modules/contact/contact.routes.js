/**
 * Contact Routes
 * Public endpoint for general contact form submissions
 * @module modules/contact/contact.routes
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const {
  submitContactMessage,
  getAllContactMessages,
  updateContactMessageStatus,
  trashContactMessage,
  permanentlyDeleteContactMessage,
} = require('./contact.controller');

/** Strict limiter: 5 submissions per 15 min per IP */
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many contact requests. Please wait before submitting again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/contact — public, rate-limited
router.post('/', contactLimiter, submitContactMessage);

// GET /api/contact/admin/all — admin list of contact submissions
router.get('/admin/all', protect, authorize('admin'), getAllContactMessages);
router.patch('/admin/:id/status', protect, authorize('admin'), updateContactMessageStatus);
router.delete('/admin/:id', protect, authorize('admin'), trashContactMessage);
router.delete('/admin/:id/permanent', protect, authorize('admin'), permanentlyDeleteContactMessage);

module.exports = router;

// MukonoTalks

