/**
 * Document service layer
 * Secure file access — never expose direct static paths
 * Full download logging for enterprise audit compliance
 * @module modules/documents/document.service
 */

const Document = require('./document.model');
const DownloadLog = require('./downloadLog.model');
const AuditService = require('../audit/audit.service');
const { env } = require('../../config/env');
const path = require('path');
const fs = require('fs');
const logger = require('../../utils/logger');

/**
 * Get all documents (admin) with pagination and filtering
 */
const getAllDocuments = async (query = {}) => {
  const { page = 1, limit = 25, category, search } = query;
  const filter = {};

  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [documents, total] = await Promise.all([
    Document.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('product', 'title slug')
      .lean(),
    Document.countDocuments(filter),
  ]);

  return {
    documents,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

/**
 * Get documents for a product (authenticated users only for restricted docs)
 */
const getProductDocuments = async (productId, isAuthenticated = false) => {
  const filter = { product: productId, isActive: true };

  if (!isAuthenticated) {
    filter.isRestricted = false;
  }

  const documents = await Document.find(filter).select('-fileUrl');
  return documents;
};

/**
 * Get secure download URL (authenticated route) — with full audit logging
 */
const getDocumentDownload = async (documentId, user, req) => {
  const document = await Document.findById(documentId).populate('product', 'title slug');
  const ipAddress = req ? (req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip) : null;
  const userAgent = req ? req.headers['user-agent'] : null;

  if (!document || !document.isActive) {
    // Log denied access attempt for missing docs
    if (user) {
      await _logDownload({
        document: { _id: documentId },
        user,
        status: 'denied',
        denialReason: 'Document not found or inactive',
        ipAddress,
        userAgent,
      });
    }
    const error = new Error('Document not found');
    error.statusCode = 404;
    throw error;
  }

  if (document.isRestricted && !user) {
    // Log unauthorized access attempt
    AuditService.log({
      action: 'DOCUMENT_ACCESS_DENIED',
      req,
      targetModel: 'Document',
      targetId: document._id,
      targetIdentifier: document.title,
      severity: 'warning',
      status: 'failure',
      metadata: { reason: 'Unauthenticated access to restricted document' },
    });

    const error = new Error('Authentication required to access this document');
    error.statusCode = 401;
    throw error;
  }

  if (document.requiresAdminApproval && user.role !== 'admin') {
    // Log denied access
    await _logDownload({
      document,
      user,
      status: 'denied',
      denialReason: 'Admin approval required',
      ipAddress,
      userAgent,
    });

    AuditService.log({
      action: 'DOCUMENT_ACCESS_DENIED',
      req,
      targetModel: 'Document',
      targetId: document._id,
      targetIdentifier: document.title,
      severity: 'warning',
      status: 'failure',
      metadata: { reason: 'Admin approval required', userId: user._id },
    });

    const error = new Error('Admin approval required to access this document');
    error.statusCode = 403;
    throw error;
  }

  // Increment download count
  document.downloadCount += 1;
  await document.save();

  // Log successful download
  await _logDownload({
    document,
    user,
    status: 'success',
    ipAddress,
    userAgent,
  });

  // Audit trail
  AuditService.log({
    action: 'DOCUMENT_DOWNLOAD',
    req,
    targetModel: 'Document',
    targetId: document._id,
    targetIdentifier: document.title,
    metadata: {
      productId: document.product?._id,
      productTitle: document.product?.title,
      companyName: user.companyName,
      documentCategory: document.category,
    },
  });

  // Return file path for streaming (local) or signed URL (S3)
  if (env.FILE_STORAGE === 's3') {
    return { url: document.fileUrl, type: 'redirect' };
  }

  // Local: return file path for streaming
  const filePath = path.resolve(__dirname, '../../../uploads', document.fileUrl);
  if (!fs.existsSync(filePath)) {
    await _logDownload({
      document,
      user,
      status: 'error',
      denialReason: 'File not found on server filesystem',
      ipAddress,
      userAgent,
    });
    const error = new Error('File not found on server');
    error.statusCode = 404;
    throw error;
  }

  return { filePath, type: 'stream', fileName: document.title };
};

/**
 * Create document (admin)
 */
const createDocument = async (data, adminUser, req) => {
  const document = await Document.create(data);

  AuditService.log({
    action: 'DOCUMENT_UPLOAD',
    req,
    targetModel: 'Document',
    targetId: document._id,
    targetIdentifier: document.title,
    metadata: { fileType: data.fileType, category: data.category, productId: data.product },
  });

  return document;
};

/**
 * Delete document (admin)
 */
const deleteDocument = async (documentId, adminUser, req) => {
  const document = await Document.findByIdAndUpdate(
    documentId,
    { isActive: false },
    { new: true }
  );

  if (!document) {
    const error = new Error('Document not found');
    error.statusCode = 404;
    throw error;
  }

  AuditService.log({
    action: 'DOCUMENT_DELETE',
    req,
    targetModel: 'Document',
    targetId: document._id,
    targetIdentifier: document.title,
    severity: 'warning',
  });

  return { message: 'Document deactivated' };
};

/**
 * Get download history for admin reporting
 */
const getDownloadHistory = async (query = {}) => {
  const { page = 1, limit = 50, documentId, userId, companyName, startDate, endDate } = query;
  const filter = {};

  if (documentId) filter.document = documentId;
  if (userId) filter.user = userId;
  if (companyName) filter.companyName = { $regex: companyName, $options: 'i' };

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [logs, total] = await Promise.all([
    DownloadLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('document', 'title category')
      .populate('product', 'title slug')
      .populate('user', 'name email companyName')
      .lean(),
    DownloadLog.countDocuments(filter),
  ]);

  return {
    logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

/**
 * Get download statistics
 */
const getDownloadStats = async (days = 30) => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [totalDownloads, deniedAttempts, topDocuments, topCompanies] = await Promise.all([
    DownloadLog.countDocuments({ status: 'success', createdAt: { $gte: since } }),
    DownloadLog.countDocuments({ status: 'denied', createdAt: { $gte: since } }),
    DownloadLog.aggregate([
      { $match: { status: 'success', createdAt: { $gte: since } } },
      { $group: { _id: '$document', downloads: { $sum: 1 }, documentTitle: { $first: '$documentTitle' } } },
      { $sort: { downloads: -1 } },
      { $limit: 10 },
    ]),
    DownloadLog.aggregate([
      { $match: { status: 'success', createdAt: { $gte: since }, companyName: { $ne: null } } },
      { $group: { _id: '$companyName', downloads: { $sum: 1 } } },
      { $sort: { downloads: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return { totalDownloads, deniedAttempts, topDocuments, topCompanies };
};

/**
 * Internal: Log a download event to the DownloadLog collection
 */
async function _logDownload({ document, user, status, denialReason = null, ipAddress = null, userAgent = null }) {
  try {
    await DownloadLog.create({
      document: document._id,
      product: document.product?._id || document.product || null,
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      companyName: user.companyName || null,
      documentTitle: document.title || 'Unknown',
      documentCategory: document.category || null,
      ipAddress,
      userAgent,
      status,
      denialReason,
    });
  } catch (error) {
    logger.error('Failed to log download:', error.message);
  }
}

module.exports = {
  getAllDocuments,
  getProductDocuments,
  getDocumentDownload,
  createDocument,
  deleteDocument,
  getDownloadHistory,
  getDownloadStats,
};

// MukonoTalks

