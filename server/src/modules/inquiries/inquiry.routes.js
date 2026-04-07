/**
 * Inquiry Routes
 * Quote request and inquiry management endpoints
 * @module modules/inquiries/inquiry.routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const {
  createInquirySchema,
  updateInquiryStatusSchema,
  getInquiriesQuerySchema,
} = require('./inquiry.validation');
const {
  createInquiry,
  getMyInquiries,
  getInquiryById,
  getAllInquiries,
  updateInquiryStatus,
  getInquiryStats,
  exportInquiries,
} = require('./inquiry.controller');

// Protected routes (customers)
router.post('/', protect, validate(createInquirySchema), createInquiry);
router.get('/', protect, validate(getInquiriesQuerySchema), getMyInquiries);

// Admin routes (must be before /:id to avoid route collision)
router.get('/admin/all', protect, authorize('admin'), validate(getInquiriesQuerySchema), getAllInquiries);
router.get('/admin/stats', protect, authorize('admin'), getInquiryStats);
router.get('/admin/export', protect, authorize('admin'), exportInquiries);

// Parameterized routes
router.get('/:id', protect, getInquiryById);
router.put('/:id/status', protect, authorize('admin'), validate(updateInquiryStatusSchema), updateInquiryStatus);

module.exports = router;

// MukonoTalks

