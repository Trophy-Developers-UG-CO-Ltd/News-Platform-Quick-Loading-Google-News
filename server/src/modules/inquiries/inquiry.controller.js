/**
 * Inquiry Controller
 * Handles quote request endpoints
 * @module modules/inquiries/inquiry.controller
 */

const InquiryService = require('./inquiry.service');
const AuditService = require('../audit/audit.service');
const { asyncHandler } = require('../../middlewares/error.middleware');

const createInquiry = asyncHandler(async (req, res) => {
  const inquiry = await InquiryService.createInquiry(req.user._id, req.user, req.body, req);
  res.status(201).json({ success: true, message: 'Quote request submitted successfully', data: inquiry });
});

const getMyInquiries = asyncHandler(async (req, res) => {
  const result = await InquiryService.getUserInquiries(req.user._id, req.query);
  res.json({ success: true, data: result });
});

const getInquiryById = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const inquiry = await InquiryService.getInquiryById(req.params.id, req.user._id, isAdmin);
  res.json({ success: true, data: inquiry });
});

const getAllInquiries = asyncHandler(async (req, res) => {
  const result = await InquiryService.getAllInquiries(req.query);
  res.json({ success: true, data: result });
});

const updateInquiryStatus = asyncHandler(async (req, res) => {
  const inquiry = await InquiryService.updateInquiryStatus(req.params.id, req.body, req.user, req);
  res.json({ success: true, data: inquiry });
});

const getInquiryStats = asyncHandler(async (req, res) => {
  const stats = await InquiryService.getInquiryStats();
  res.json({ success: true, data: stats });
});

const exportInquiries = asyncHandler(async (req, res) => {
  const csv = await InquiryService.exportInquiriesCSV(req.query);
  AuditService.log({ action: 'DATA_EXPORT', req, targetModel: 'Inquiry', metadata: { format: 'csv', filters: req.query } });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=inquiries-${Date.now()}.csv`);
  res.send(csv);
});

module.exports = { createInquiry, getMyInquiries, getInquiryById, getAllInquiries, updateInquiryStatus, getInquiryStats, exportInquiries };

// MukonoTalks

