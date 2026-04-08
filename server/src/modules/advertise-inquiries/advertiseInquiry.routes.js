/**
 * Advertise Inquiry Routes
 * Public lead capture + admin management routes
 * @module modules/advertise-inquiries/advertiseInquiry.routes
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const {
  submitAdvertiseInquiry,
  getAllAdvertiseInquiries,
  getAdvertiseInquiryById,
  updateAdvertiseInquiryStatus,
} = require('./advertiseInquiry.controller');

const router = express.Router();

const advertiseInquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: {
    success: false,
    message: 'Too many inquiries submitted. Please wait before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', advertiseInquiryLimiter, submitAdvertiseInquiry);
router.get('/admin/all', protect, authorize('admin'), getAllAdvertiseInquiries);
router.get('/admin/:id', protect, authorize('admin'), getAdvertiseInquiryById);
router.patch('/admin/:id/status', protect, authorize('admin'), updateAdvertiseInquiryStatus);

module.exports = router;

// MukonoTalks
