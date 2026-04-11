/**
 * Document routes
 * Never expose direct static paths — all access through authenticated routes
 * Rate-limited downloads with full audit logging
 * @module modules/documents/document.routes
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const documentController = require('./document.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

// Rate limiter specifically for document downloads
const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 downloads per 15 min
  message: { success: false, message: 'Too many download attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authenticated download (secure access + rate limited)
router.get('/download/:id', protect, downloadLimiter, documentController.downloadDocument);

// Admin - list all documents
router.get('/admin/all', protect, authorize('admin'), documentController.getAllDocuments);

// Admin - download history and stats
router.get('/admin/downloads', protect, authorize('admin'), documentController.getDownloadHistory);
router.get('/admin/download-stats', protect, authorize('admin'), documentController.getDownloadStats);

// Admin - CRUD
router.post('/', protect, authorize('admin'), documentController.createDocument);
router.delete('/:id', protect, authorize('admin'), documentController.deleteDocument);

module.exports = router;

// MukonoTalks

