/**
 * Document controller
 * Secure document access with full audit logging
 * @module modules/documents/document.controller
 */

const documentService = require('./document.service');
const { asyncHandler } = require('../../middlewares/error.middleware');

/**
 * @route GET /api/documents/admin/all
 * @desc Get all documents with pagination (admin)
 * @access Admin
 */
const getAllDocuments = asyncHandler(async (req, res) => {
  const result = await documentService.getAllDocuments(req.query);
  res.json({ success: true, ...result });
});

const downloadDocument = asyncHandler(async (req, res) => {
  const result = await documentService.getDocumentDownload(req.params.id, req.user, req);

  if (result.type === 'redirect') {
    return res.redirect(result.url);
  }

  // Stream file securely
  res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
  const fileStream = require('fs').createReadStream(result.filePath);
  fileStream.pipe(res);
});

const createDocument = asyncHandler(async (req, res) => {
  const document = await documentService.createDocument(req.body, req.user, req);
  res.status(201).json({ success: true, document });
});

const deleteDocument = asyncHandler(async (req, res) => {
  const result = await documentService.deleteDocument(req.params.id, req.user, req);
  res.status(200).json({ success: true, ...result });
});

/**
 * @route GET /api/documents/admin/downloads
 * @desc Get download history for admin reporting
 * @access Admin
 */
const getDownloadHistory = asyncHandler(async (req, res) => {
  const result = await documentService.getDownloadHistory(req.query);
  res.json({ success: true, data: result });
});

/**
 * @route GET /api/documents/admin/download-stats
 * @desc Get download statistics
 * @access Admin
 */
const getDownloadStats = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const stats = await documentService.getDownloadStats(days);
  res.json({ success: true, data: stats });
});

module.exports = {
  getAllDocuments,
  downloadDocument,
  createDocument,
  deleteDocument,
  getDownloadHistory,
  getDownloadStats,
};

// MukonoTalks

