/**
 * Admin API service
 * @module features/admin/adminService
 */

import api from '../../app/axios';

const getDashboardStats = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

const getCacheStats = async () => {
  const response = await api.get('/admin/cache/stats');
  return response.data;
};

const clearCache = async () => {
  const response = await api.post('/admin/cache/clear');
  return response.data;
};

const getAllOrders = async (params) => {
  const response = await api.get('/orders/admin/all', { params });
  return response.data;
};

const updateOrderStatus = async (orderId, data) => {
  const response = await api.put(`/orders/${orderId}/status`, data);
  return response.data;
};

const getAllUsers = async (params) => {
  const response = await api.get('/users', { params });
  return response.data;
};

const updateUser = async (userId, data) => {
  const response = await api.put(`/users/${userId}`, data);
  return response.data;
};

const deleteUser = async (userId) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};

const createUser = async (data) => {
  const response = await api.post('/users', data);
  return response.data;
};

// Admin categories
const createCategory = async (categoryData) => {
  const response = await api.post('/categories', categoryData);
  return response.data;
};

const updateCategory = async (categoryId, categoryData) => {
  const response = await api.put(`/categories/${categoryId}`, categoryData);
  return response.data;
};

const deleteCategory = async (categoryId) => {
  const response = await api.delete(`/categories/${categoryId}`);
  return response.data;
};

// ─── Audit Logs ────────────────────────────────────────────────
const getAuditLogs = async (params) => {
  const response = await api.get('/audit/logs', { params });
  return response.data;
};

const getSecurityEvents = async (params) => {
  const response = await api.get('/audit/security', { params });
  return response.data;
};

// ─── Analytics ─────────────────────────────────────────────────
const getAnalyticsDashboard = async () => {
  const response = await api.get('/analytics/dashboard');
  return response.data;
};

const getTopSearches = async (params) => {
  const response = await api.get('/analytics/top-searches', { params });
  return response.data;
};

const getTrafficOverview = async (params) => {
  const response = await api.get('/analytics/traffic', { params });
  return response.data;
};

const getZeroResultSearches = async (params) => {
  const response = await api.get('/analytics/zero-results', { params });
  return response.data;
};

// ─── Translation management ──────────────────────────────────
const getTranslationStatus = async () => {
  const response = await api.get('/translation/status');
  return response.data;
};

const getBatchTranslationStatus = async (params) => {
  const response = await api.get('/translation/batch-status', { params });
  return response.data;
};

const getPendingTranslations = async (params = {}) => {
  const response = await api.get('/translation/pending', { params });
  return response.data;
};

const getDocumentTranslationStatus = async (params) => {
  const response = await api.get('/translation/document-status', { params });
  return response.data;
};

const retranslateDocument = async (data) => {
  const response = await api.post('/translation/document', data);
  return response.data;
};

const runBatchTranslation = async (data) => {
  const response = await api.post('/translation/batch', data);
  return response.data;
};

const approveTranslation = async (data) => {
  const response = await api.put('/translation/approve', data);
  return response.data;
};

const editLocalizedField = async (data) => {
  const response = await api.put('/translation/edit-field', data);
  return response.data;
};

// ─── Translation queue job management ────────────────────────
const getQueueTranslationJobs = async (params) => {
  const response = await api.get('/translation/queue/jobs', { params });
  return response.data;
};

const getQueueTranslationJob = async (jobId) => {
  const response = await api.get(`/translation/queue/jobs/${jobId}`);
  return response.data;
};

const retryQueueTranslationJob = async (jobId) => {
  const response = await api.post(`/translation/queue/jobs/${jobId}/retry`);
  return response.data;
};

const promoteQueueTranslationJob = async (jobId) => {
  const response = await api.post(`/translation/queue/jobs/${jobId}/promote`);
  return response.data;
};

const removeQueueTranslationJob = async (jobId) => {
  const response = await api.delete(`/translation/queue/jobs/${jobId}`);
  return response.data;
};

const detectLanguage = async (text) => {
  const response = await api.post('/translation/detect-language', { text });
  return response.data;
};

const getQueueStats = async () => {
  const response = await api.get('/translation/queue/stats');
  return response.data;
};

const requestTranslationJob = async (data) => {
  const response = await api.post('/translation/request', data);
  return response.data;
};

// ─── Inquiries (RFQ) ──────────────────────────────────────────
const getAllInquiries = async (params) => {
  const response = await api.get('/inquiries/admin/all', { params });
  return response.data;
};

const updateInquiryStatus = async (inquiryId, data) => {
  const response = await api.put(`/inquiries/${inquiryId}/status`, data);
  return response.data;
};

const getInquiryStats = async () => {
  const response = await api.get('/inquiries/admin/stats');
  return response.data;
};

const getAllContactMessages = async (params) => {
  const response = await api.get('/contact/admin/all', { params });
  return response.data;
};

const updateContactMessageStatus = async (messageId, data) => {
  const response = await api.patch(`/contact/admin/${messageId}/status`, data);
  return response.data;
};

const trashContactMessage = async (messageId) => {
  const response = await api.delete(`/contact/admin/${messageId}`);
  return response.data;
};

const permanentlyDeleteContactMessage = async (messageId) => {
  const response = await api.delete(`/contact/admin/${messageId}/permanent`);
  return response.data;
};

const getAdvertiseInquiries = async (params) => {
  const response = await api.get('/advertise/admin/all', { params });
  return response.data;
};

const updateAdvertiseInquiryStatus = async (inquiryId, data) => {
  const response = await api.patch(`/advertise/admin/${inquiryId}/status`, data);
  return response.data;
};

// ─── Documents ─────────────────────────────────────────────────
const getAllDocuments = async (params) => {
  const response = await api.get('/documents/admin/all', { params });
  return response.data;
};

const createDocument = async (data) => {
  const response = await api.post('/documents', data);
  return response.data;
};

const deleteDocument = async (documentId) => {
  const response = await api.delete(`/documents/${documentId}`);
  return response.data;
};

// ─── Download History ──────────────────────────────────────────
const getDownloadHistory = async (params) => {
  const response = await api.get('/documents/admin/downloads', { params });
  return response.data;
};

const getDownloadStats = async (params) => {
  const response = await api.get('/documents/admin/download-stats', { params });
  return response.data;
};

// ─── Applications ──────────────────────────────────────────────
const getApplications = async (params) => {
  const response = await api.get('/applications', { params });
  return response.data;
};

const getApplicationById = async (id) => {
  const response = await api.get(`/applications/${id}`);
  return response.data;
};

const createApplication = async (data) => {
  const response = await api.post('/applications', data);
  return response.data;
};

const updateApplication = async (id, data) => {
  const response = await api.put(`/applications/${id}`, data);
  return response.data;
};

const deleteApplication = async (id) => {
  const response = await api.delete(`/applications/${id}`);
  return response.data;
};

// ─── Categories (full CRUD with SEO) ──────────────────────────
const getCategories = async (params) => {
  const response = await api.get('/categories', { params });
  return response.data;
};

const getCategoryTree = async () => {
  const response = await api.get('/categories/tree');
  return response.data;
};

// ─── Content Templates ─────────────────────────────────────────
const getAllTemplates = async () => {
  const response = await api.get('/content-templates');
  return response.data;
};

const getTemplateByType = async (type) => {
  const response = await api.get(`/content-templates/type/${type}`);
  return response.data;
};

const getTemplateById = async (id) => {
  const response = await api.get(`/content-templates/${id}`);
  return response.data;
};

const createTemplate = async (data) => {
  const response = await api.post('/content-templates', data);
  return response.data;
};

const updateTemplate = async (id, data) => {
  const response = await api.put(`/content-templates/${id}`, data);
  return response.data;
};

const restoreTemplateRevision = async (id, revisionIndex) => {
  const response = await api.post(`/content-templates/${id}/restore/${revisionIndex}`);
  return response.data;
};

const deleteTemplate = async (id) => {
  const response = await api.delete(`/content-templates/${id}`);
  return response.data;
};

const renderTemplatePreview = async (type, params) => {
  const response = await api.get(`/content-templates/render/${type}`, { params });
  return response.data;
};

// ─── File Upload ──────────────────────────────────────────────
const uploadImage = async (file, folder = 'uploads') => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);
  const response = await api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data; // { success, url, key }
};

const uploadDocument = async (file, folder = 'documents') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  const response = await api.post('/upload/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data; // { success, url, key, originalName, size, mimeType }
};

const uploadVideo = async (file, folder = 'videos', onProgress) => {
  // Step 1: Ask server for a presigned PUT URL (no bytes travel through server)
  const { data } = await api.get('/upload/video-presign', {
    params: { filename: file.name, contentType: file.type, folder },
  });

  if (data.mode === 'presign') {
    // Step 2a: Upload directly to Cloudflare R2 via presigned PUT URL
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', data.presignedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded * 100) / e.total));
        };
      }
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`R2 PUT ${xhr.status}`)));
      xhr.onerror = () => reject(new Error('Network error during R2 upload'));
      xhr.send(file);
    });
    return { success: true, url: data.publicUrl, key: data.key };
  }

  // Step 2b: Fallback — proxy through server (local storage only)
  const formData = new FormData();
  formData.append('video', file);
  formData.append('folder', folder);
  const response = await api.post('/upload/video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e) => { if (e.total) onProgress(Math.round((e.loaded * 100) / e.total)); }
      : undefined,
  });
  return response.data;
};

// ─── Site Settings (GA4 etc.) ──────────────────────────────────────────────
const getSiteSettings = async () => {
  const response = await api.get('/site-settings');
  return response.data;
};

const updateSiteSettings = async (data) => {
  const response = await api.put('/site-settings', data);
  return response.data;
};

const adminService = {
  getDashboardStats,
  getCacheStats,
  clearCache,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  updateUser,
  deleteUser,
  createUser,
  // Categories (full CRUD + tree)
  getCategories,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  // Enterprise features
  getAuditLogs,
  getSecurityEvents,
  getAnalyticsDashboard,
  getTopSearches,
  getTrafficOverview,
  getZeroResultSearches,
  getTranslationStatus,
  getBatchTranslationStatus,
  getPendingTranslations,
  getDocumentTranslationStatus,
  retranslateDocument,
  runBatchTranslation,
  approveTranslation,
  editLocalizedField,
  getQueueTranslationJobs,
  getQueueTranslationJob,
  retryQueueTranslationJob,
  promoteQueueTranslationJob,
  removeQueueTranslationJob,
  detectLanguage,
  getQueueStats,
  requestTranslationJob,
  getAllInquiries,
  updateInquiryStatus,
  getInquiryStats,
  getAllContactMessages,
  updateContactMessageStatus,
  trashContactMessage,
  permanentlyDeleteContactMessage,
  getAdvertiseInquiries,
  updateAdvertiseInquiryStatus,
  getAllDocuments,
  createDocument,
  deleteDocument: deleteDocument,
  getDownloadHistory,
  getDownloadStats,
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  // Content Templates
  getAllTemplates,
  getTemplateByType,
  getTemplateById,
  createTemplate,
  updateTemplate,
  restoreTemplateRevision,
  deleteTemplate,
  renderTemplatePreview,
  uploadImage,
  uploadDocument,
  uploadVideo,
  // Site Settings (GA4 etc.)
  getSiteSettings,
  updateSiteSettings,
};
export default adminService;

// MukonoTalks
