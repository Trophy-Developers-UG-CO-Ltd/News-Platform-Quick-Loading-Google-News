/**
 * Translation admin routes
 * @module modules/translation/translation.routes
 */

'use strict';

const express = require('express');
const router = express.Router();

const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const {
  getStatus,
  clearCache,
  detectSourceLanguage,
  getQueueStatsEndpoint,
  requestTranslation,
  runBatch,
  translateDocument,
  getDocumentTranslationStatus,
  listPendingTranslations,
  approveTranslation,
  editLocalizedField,
  listQueueJobs,
  getQueueJobById,
  retryQueueJobById,
  promoteQueueJobById,
  removeQueueJobById,
} = require('./translation.controller');

// All translation routes require authentication + admin/developer role
router.use(protect, authorize('admin', 'developer'));

/**
 * GET /api/translation/status
 * Returns translation system health: cache stats, queue stats, API configured
 */
router.get('/status', getStatus);

/**
 * DELETE /api/translation/cache
 * Clears the in-memory translation cache
 */
router.delete('/cache', clearCache);

/**
 * POST /api/translation/detect-language
 * Detect the language of a text sample
 * Body: { text: string }
 */
router.post('/detect-language', detectSourceLanguage);

/**
 * GET /api/translation/queue/stats
 * Dedicated queue statistics endpoint for dashboard
 */
router.get('/queue/stats', getQueueStatsEndpoint);

/**
 * POST /api/translation/request
 * Queue a single translation job
 * Body: { model, docId, sourceLanguage?, targetLanguages?, force? }
 */
router.post('/request', requestTranslation);

/**
 * POST /api/translation/batch
 * Trigger batch translation for all (or a specific) model
 * Body: { model?, force?, dryRun?, limit? }
 */
router.post('/batch', runBatch);

/**
 * POST /api/translation/document
 * Translate a single document by model + _id
 * Body: { model: 'Product', docId: '...', force?: true }
 */
router.post('/document', translateDocument);

/**
 * GET /api/translation/document-status
 * Get translation status for a specific document
 * Query: { model: 'Product', docId: '...' }
 */
router.get('/document-status', getDocumentTranslationStatus);

/**
 * GET /api/translation/pending
 * List all documents with pending/failed translations across all models
 */
router.get('/pending', listPendingTranslations);

/**
 * PUT /api/translation/approve
 * Admin approves a translation for a given document + lang
 * Body: { model, docId, lang }
 */
router.put('/approve', approveTranslation);

/**
 * PUT /api/translation/edit-field
 * Admin edits a specific localized field value
 * Body: { model, docId, fieldPath, lang, value }
 */
router.put('/edit-field', editLocalizedField);

// ─── BullMQ queue job management ─────────────────────────────────────────────

/**
 * GET /api/translation/queue/jobs
 * List jobs by status: ?status=waiting|active|delayed|completed|failed&start=0&end=49
 */
router.get('/queue/jobs', listQueueJobs);

/**
 * GET /api/translation/queue/jobs/:jobId
 * Get a single BullMQ job by ID
 */
router.get('/queue/jobs/:jobId', getQueueJobById);

/**
 * POST /api/translation/queue/jobs/:jobId/retry
 * Retry a failed job
 */
router.post('/queue/jobs/:jobId/retry', retryQueueJobById);

/**
 * POST /api/translation/queue/jobs/:jobId/promote
 * Promote a delayed job to waiting
 */
router.post('/queue/jobs/:jobId/promote', promoteQueueJobById);

/**
 * DELETE /api/translation/queue/jobs/:jobId
 * Remove a job from the queue
 */
router.delete('/queue/jobs/:jobId', removeQueueJobById);

module.exports = router;

// MukonoTalks

