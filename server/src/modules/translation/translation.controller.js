/**
 * Translation admin controller
 * =============================
 * Exposes admin-only endpoints for managing CMS translations:
 *   - Cache stats and management
 *   - Queue status
 *   - On-demand batch translation trigger
 *   - Per-document re-translation
 *
 * All routes require admin or developer role (enforced in the router).
 *
 * @module modules/translation/translation.controller
 */

'use strict';

const { asyncHandler } = require('../../middlewares/error.middleware');
const translationService = require('../../services/translationService');
const {
  getQueueStats,
  getQueueJobs: _getQueueJobsFromQueue,
  getQueueJob: _getQueueJobFromQueue,
  retryQueueJob: _retryQueueJob,
  promoteQueueJob: _promoteQueueJob,
  removeQueueJob: _removeQueueJob,
  enqueueTranslation,
} = require('../../queues/translation.queue');
const logger = require('../../utils/logger');

// ─── Model registry for on-demand / batch translation ────────────────────────

/**
 * Supported model names and which fields to auto-translate.
 * Each entry maps to a Mongoose model and its translatable English fields.
 */
const SUPPORTED_MODELS = {
  Category: {
    require: '../categories/category.model',
    fields: [
      { enSource: (doc) => doc.localizedName?.en || doc.name,              targetPath: 'localizedName'        },
      { enSource: (doc) => doc.localizedDescription?.en || doc.description, targetPath: 'localizedDescription' },
    ],
  },
  Article: {
    require: '../articles/article.model',
    fields: [
      { enSource: (doc) => doc.title?.en,   targetPath: 'title'  },
      { enSource: (doc) => doc.excerpt?.en, targetPath: 'excerpt' },
    ],
  },
  Page: {
    require: '../pages/page.model',
    fields: [
      { enSource: (doc) => doc.title?.en, targetPath: 'title' },
    ],
  },
  Hero: {
    require: '../hero/hero.model',
    fields: [
      { enSource: (doc) => doc.localizedTitle?.en || doc.title,             targetPath: 'localizedTitle'       },
      { enSource: (doc) => doc.localizedEyebrow?.en || doc.eyebrow,         targetPath: 'localizedEyebrow'     },
      { enSource: (doc) => doc.localizedDescription?.en || doc.description,  targetPath: 'localizedDescription' },
      { enSource: (doc) => doc.localizedCtaText?.en || doc.ctaText,          targetPath: 'localizedCtaText'     },
    ],
  },
  HomepageSection: {
    require: '../homepageSection/homepageSection.model',
    fields: [
      { enSource: (doc) => doc.heading?.localizedEyebrow?.en || doc.heading?.eyebrow,         targetPath: 'heading.localizedEyebrow'     },
      { enSource: (doc) => doc.heading?.localizedTitle?.en   || doc.heading?.title,           targetPath: 'heading.localizedTitle'       },
      { enSource: (doc) => doc.heading?.localizedDescription?.en || doc.heading?.description, targetPath: 'heading.localizedDescription' },
    ],
  },
  NavItem: {
    require: '../navigation/nav.model',
    fields: [
      { enSource: (doc) => doc.localizedLabel?.en || doc.label, targetPath: 'localizedLabel' },
    ],
  },
  FooterSettings: {
    require: '../footer/footer.model',
    fields: [
      { enSource: (doc) => doc.localizedTagline?.en || doc.tagline, targetPath: 'localizedTagline' },
    ],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _resolveModel(modelName) {
  const entry = SUPPORTED_MODELS[modelName];
  if (!entry) return null;
  return require(entry.require);
}

/**
 * Translate a single document in place.
 * Uses translateFields (which auto-selects Google or AI provider).
 * @param {string}  modelName
 * @param {object}  doc        Lean or Mongoose document
 * @param {boolean} force      Re-translate even if translations exist
 * @param {boolean} dryRun     Don't write to DB
 * @returns {Promise<{ translated: number, skipped: number, fields: string[] }>}
 */
async function _translateDocument(modelName, doc, force = false, dryRun = false) {
  const entry = SUPPORTED_MODELS[modelName];
  if (!entry) throw new Error(`Unsupported model: ${modelName}`);

  const Model = _resolveModel(modelName);

  // Collect fields to translate and their existing values
  const fieldsToTranslate = {};
  const existing = {};
  const targetPathMap = {}; // translateKey → targetPath

  for (const { enSource, targetPath } of entry.fields) {
    const enText = enSource(doc);
    if (!enText || !enText.trim()) continue;

    const key = targetPath.replace(/\./g, '_'); // Safe key for translateFields
    const existingLangs = doc[targetPath] || {};
    const needsSw = force || !existingLangs.sw;
    const needsZh = force || !existingLangs.zh;
    if (!needsSw && !needsZh) continue;

    fieldsToTranslate[key] = enText;
    existing[key] = force ? {} : existingLangs;
    targetPathMap[key] = targetPath;
  }

  if (Object.keys(fieldsToTranslate).length === 0) {
    return {
      docId: doc._id,
      translated: 0,
      skipped: entry.fields.length,
      fields: [],
    };
  }

  // Batch translate — provider selection happens inside translateFields
  const translations = await translationService.translateFields(
    fieldsToTranslate,
    existing,
    force,
    { entityType: modelName }
  );

  // Build $set payload
  const $set = {};
  const translated = [];

  for (const [key, langs] of Object.entries(translations)) {
    const targetPath = targetPathMap[key];
    if (!targetPath) continue;
    if (langs.sw) $set[`${targetPath}.sw`] = langs.sw;
    if (langs.zh) $set[`${targetPath}.zh`] = langs.zh;
    translated.push(targetPath);
  }

  if (!dryRun && Object.keys($set).length > 0) {
    const now = new Date();
    $set['translationStatus.sw'] = 'completed';
    $set['translationStatus.zh'] = 'completed';
    $set['translationMeta.translatedAt.sw'] = now;
    $set['translationMeta.translatedAt.zh'] = now;
    $set['translationMeta.provider.sw'] = translationService.TRANSLATION_PROVIDER;
    $set['translationMeta.provider.zh'] = translationService.TRANSLATION_PROVIDER;
    await Model.findByIdAndUpdate(doc._id, { $set });
  }

  return {
    docId: doc._id,
    translated: translated.length,
    skipped: entry.fields.length - translated.length,
    fields: translated,
    $set: dryRun ? $set : undefined,
  };
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * @desc  Get translation system status
 * @route GET /api/translation/status
 * @access Admin
 */
const getStatus = asyncHandler(async (req, res) => {
  const cacheStats = translationService.getCacheStats();
  const queueStats = await getQueueStats();
  const googleConfigured = !!process.env.GOOGLE_TRANSLATE_API_KEY;
  const aiConfigured = !!process.env.AI_TRANSLATION_API_KEY;
  const activeProvider = translationService.TRANSLATION_PROVIDER;

  res.json({
    success: true,
    translation: {
      activeProvider,
      googleConfigured,
      aiConfigured,
      aiModel: activeProvider === 'ai' ? (process.env.AI_TRANSLATION_MODEL || 'gpt-4o-mini') : undefined,
      supportedTargetLanguages: translationService.TARGET_LANGS,
      cache: cacheStats,
      queue: queueStats
        ? { backend: 'bullmq-redis', ...queueStats }
        : { backend: 'in-process', note: 'Set REDIS_URL to enable persistent queue' },
    },
  });
});

/**
 * @desc  Clear the in-memory translation cache
 * @route DELETE /api/translation/cache
 * @access Admin
 */
const clearCache = asyncHandler(async (req, res) => {
  translationService.clearCache();
  logger.info(`[TranslationController] Cache cleared by admin ${req.user?.email}`);
  res.json({ success: true, message: 'Translation cache cleared' });
});

/**
 * @desc  Detect the language of a text sample
 * @route POST /api/translation/detect-language
 * @access Admin
 * @body  { text: string }
 */
const detectSourceLanguage = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ success: false, message: 'text is required' });
  }

  const language = await translationService.detectLanguage(text);

  res.json({ success: true, language });
});

/**
 * @desc  Get queue statistics (dedicated endpoint for dashboard)
 * @route GET /api/translation/queue/stats
 * @access Admin
 */
const getQueueStatsEndpoint = asyncHandler(async (req, res) => {
  const counts = await getQueueStats();

  if (!counts) {
    return res.json({
      success: true,
      counts: { waiting: 0, active: 0, delayed: 0, completed: 0, failed: 0 },
      note: 'BullMQ not configured — Redis unavailable',
    });
  }

  res.json({ success: true, counts });
});

/**
 * @desc  Request a single translation job via queue
 * @route POST /api/translation/request
 * @access Admin
 * @body  { model, docId, sourceLanguage?, targetLanguages?, force? }
 */
const requestTranslation = asyncHandler(async (req, res) => {
  const {
    model: modelName,
    docId,
    force = false,
  } = req.body;

  if (!modelName || !docId) {
    return res.status(400).json({ success: false, message: 'model and docId are required' });
  }
  if (!SUPPORTED_MODELS[modelName]) {
    return res.status(400).json({ success: false, message: `Unsupported model: ${modelName}` });
  }

  const Model = _resolveModel(modelName);
  const entry = SUPPORTED_MODELS[modelName];
  const doc = await Model.findById(docId).lean();

  if (!doc) {
    return res.status(404).json({ success: false, message: `${modelName} not found` });
  }

  // Build fields object for the queue
  const fields = {};
  for (const { enSource, targetPath } of entry.fields) {
    const enText = enSource(doc);
    if (enText && enText.trim()) {
      const key = targetPath.includes('.') ? targetPath.split('.').pop() : targetPath;
      fields[key] = enText;
    }
  }

  await enqueueTranslation(modelName, docId, fields);

  logger.info(`[TranslationController] Translation requested for ${modelName}/${docId} by ${req.user?.email}`);
  res.json({ success: true, message: `Translation job queued for ${modelName} ${docId}` });
});

/**
 * @desc  Run batch translation for missing sw/zh in one or all models
 * @route POST /api/translation/batch
 * @access Admin
 *
 * Body:
 *   model?   — target a single model (Category | Article | Page | Hero)
 *   force?   — re-translate even if sw/zh already exist (default: false)
 *   dryRun?  — preview what would be translated (default: false)
 *   limit?   — max docs per model (default: 200, max: 1000)
 */
const runBatch = asyncHandler(async (req, res) => {
  const {
    model: targetModel,
    force = false,
    dryRun = false,
    limit: rawLimit,
  } = req.body;

  const perModelLimit = Math.min(
    parseInt(rawLimit, 10) || 200,
    1000
  );

  if (targetModel && !SUPPORTED_MODELS[targetModel]) {
    return res.status(400).json({
      success: false,
      message: `Unsupported model "${targetModel}". Supported: ${Object.keys(SUPPORTED_MODELS).join(', ')}`,
    });
  }

  const modelNames = targetModel ? [targetModel] : Object.keys(SUPPORTED_MODELS);

  logger.info(
    `[TranslationBatch] Admin ${req.user?.email} triggered batch — ` +
    `models: [${modelNames.join(', ')}], force: ${force}, dryRun: ${dryRun}, limit: ${perModelLimit}`
  );

  const summary = [];
  let grandTotal = 0;

  for (const modelName of modelNames) {
    const Model = _resolveModel(modelName);
    const entry = SUPPORTED_MODELS[modelName];

    // Find docs with at least one missing translation
    // Build a filter that matches docs where any localized field is missing sw or zh
    let filter = {};
    if (!force) {
      const orClauses = entry.fields.flatMap(({ targetPath }) => [
        { [`${targetPath}.sw`]: { $in: [null, '', undefined] } },
        { [`${targetPath}.zh`]: { $in: [null, '', undefined] } },
      ]);
      filter = { $or: orClauses };
    }

    const docs = await Model.find(filter).limit(perModelLimit).lean();

    let modelTranslated = 0;
    let modelSkipped = 0;
    const docResults = [];

    for (const doc of docs) {
      try {
        const result = await _translateDocument(modelName, doc, force, dryRun);
        modelTranslated += result.translated;
        modelSkipped += result.skipped;
        if (dryRun && result.$set && Object.keys(result.$set).length > 0) {
          docResults.push({ id: doc._id, preview: result.$set });
        }
      } catch (err) {
        logger.warn(`[TranslationBatch] Skipped ${modelName} ${doc._id}: ${err.message}`);
        modelSkipped++;
      }
    }

    grandTotal += modelTranslated;
    summary.push({
      model: modelName,
      docsScanned: docs.length,
      fieldsTranslated: modelTranslated,
      fieldsSkipped: modelSkipped,
      ...(dryRun ? { preview: docResults } : {}),
    });
  }

  res.json({
    success: true,
    dryRun: Boolean(dryRun),
    totalFieldsTranslated: grandTotal,
    summary,
  });
});

/**
 * @desc  Re-translate a single document by model + ID
 * @route POST /api/translation/document
 * @access Admin
 *
 * Body: { model: 'Article', docId: '...', force?: true }
 */
const translateDocument = asyncHandler(async (req, res) => {
  const { model: modelName, docId, force = false } = req.body;

  if (!modelName || !docId) {
    return res.status(400).json({
      success: false,
      message: 'model and docId are required',
    });
  }

  if (!SUPPORTED_MODELS[modelName]) {
    return res.status(400).json({
      success: false,
      message: `Unsupported model: ${modelName}`,
    });
  }

  const Model = _resolveModel(modelName);
  const doc = await Model.findById(docId).lean();

  if (!doc) {
    return res.status(404).json({ success: false, message: `${modelName} not found` });
  }

  const result = await _translateDocument(modelName, doc, Boolean(force), false);

  logger.info(
    `[TranslationController] Translated ${modelName} ${docId} — ` +
    `${result.translated} fields updated`
  );

  res.json({
    success: true,
    result,
  });
});

/**
 * @desc  Get translation status for a single document
 * @route GET /api/translation/document-status?model=Article&docId=...
 * @access Admin
 */
const getDocumentTranslationStatus = asyncHandler(async (req, res) => {
  const { model: modelName, docId } = req.query;

  if (!modelName || !docId) {
    return res.status(400).json({ success: false, message: 'model and docId are required' });
  }

  if (!SUPPORTED_MODELS[modelName]) {
    return res.status(400).json({ success: false, message: `Unsupported model: ${modelName}` });
  }

  const entry = SUPPORTED_MODELS[modelName];
  const fieldPaths = entry.fields.map((f) => f.targetPath);

  const Model = _resolveModel(modelName);
  const doc = await Model.findById(docId)
    .select(`translationStatus translationMeta translationHash ${fieldPaths.join(' ')}`)
    .lean();

  if (!doc) {
    return res.status(404).json({ success: false, message: `${modelName} not found` });
  }

  // Build a translatedFields map: { fieldPath: { en, sw, zh } }
  const translatedFields = {};
  for (const { enSource, targetPath } of entry.fields) {
    // Resolve nested paths like "heading.localizedTitle"
    const parts = targetPath.split('.');
    let val = doc;
    for (const p of parts) {
      val = val?.[p];
    }
    translatedFields[targetPath] = {
      en: (typeof val === 'object' && val !== null) ? (val.en || null) : null,
      sw: (typeof val === 'object' && val !== null) ? (val.sw || null) : null,
      zh: (typeof val === 'object' && val !== null) ? (val.zh || null) : null,
    };
  }

  res.json({
    success: true,
    docId,
    model: modelName,
    translationStatus: doc.translationStatus || { en: 'completed', sw: 'pending', zh: 'pending' },
    translationMeta: doc.translationMeta || {},
    translationHash: doc.translationHash || {},
    translatedFields,
  });
});

/**
 * @desc  List documents needing translation attention across all models.
 *        By default returns pending/failed/processing docs.
 *        With ?includeUnapproved=true also returns completed-but-not-approved docs.
 * @route GET /api/translation/pending
 * @access Admin
 */
const listPendingTranslations = asyncHandler(async (req, res) => {
  const includeUnapproved = req.query.includeUnapproved === 'true';
  const results = [];

  for (const [modelName, entry] of Object.entries(SUPPORTED_MODELS)) {
    const Model = _resolveModel(modelName);
    if (!Model) continue;

    const labelField = entry.fields[0]?.targetPath || 'localizedTitle';

    const statusFilter = ['pending', 'failed', 'processing'];
    if (includeUnapproved) statusFilter.push('completed');

    const docs = await Model.find({
      $or: [
        { 'translationStatus.sw': { $in: statusFilter } },
        { 'translationStatus.zh': { $in: statusFilter } },
      ],
    })
      .select(`translationStatus translationMeta ${labelField} title name`)
      .limit(200)
      .lean();

    docs.forEach((doc) => {
      // When including unapproved, skip docs where both langs are already approved
      if (includeUnapproved) {
        const swApproved = !!doc.translationMeta?.approvedAt?.sw;
        const zhApproved = !!doc.translationMeta?.approvedAt?.zh;
        const swCompleted = doc.translationStatus?.sw === 'completed';
        const zhCompleted = doc.translationStatus?.zh === 'completed';
        const swNeedsWork = ['pending', 'failed', 'processing'].includes(doc.translationStatus?.sw);
        const zhNeedsWork = ['pending', 'failed', 'processing'].includes(doc.translationStatus?.zh);

        // Skip if both completed+approved and nothing pending/failed
        if (swCompleted && zhCompleted && swApproved && zhApproved && !swNeedsWork && !zhNeedsWork) {
          return;
        }
      }

      const label =
        (doc[labelField]?.en) ||
        doc.title?.en || doc.title ||
        doc.name?.en  || doc.name  ||
        doc._id.toString();

      results.push({
        _id: doc._id,
        model: modelName,
        label: typeof label === 'string' ? label : JSON.stringify(label),
        translationStatus: doc.translationStatus || {},
        translationMeta: doc.translationMeta || {},
      });
    });
  }

  res.json({ success: true, count: results.length, data: results });
});

/**
 * @desc  Approve a translation for a document/lang (marks as approved in translationMeta)
 * @route PUT /api/translation/approve
 * @access Admin
 * @body  { model, docId, lang }
 */
const approveTranslation = asyncHandler(async (req, res) => {
  const { model: modelName, docId, lang } = req.body;

  if (!modelName || !docId || !lang) {
    return res.status(400).json({ success: false, message: 'model, docId, and lang are required' });
  }
  if (!['sw', 'zh'].includes(lang)) {
    return res.status(400).json({ success: false, message: 'lang must be sw or zh' });
  }
  if (!SUPPORTED_MODELS[modelName]) {
    return res.status(400).json({ success: false, message: `Unsupported model: ${modelName}` });
  }

  const Model = _resolveModel(modelName);
  const doc = await Model.findById(docId).select('translationStatus').lean();
  if (!doc) {
    return res.status(404).json({ success: false, message: `${modelName} not found` });
  }

  await Model.findByIdAndUpdate(docId, {
    $set: {
      [`translationMeta.approvedAt.${lang}`]: new Date(),
      [`translationMeta.approvedBy.${lang}`]: req.user?.email || req.user?._id,
    },
  });

  logger.info(`[TranslationController] ${modelName}/${docId} lang=${lang} approved by ${req.user?.email}`);
  res.json({ success: true, message: `${lang} translation approved` });
});

/**
 * @desc  Edit a specific localized field value (admin correction before approval)
 * @route PUT /api/translation/edit-field
 * @access Admin
 * @body  { model, docId, fieldPath, lang, value }
 *        fieldPath e.g. "localizedTitle", "localizedDescription"
 */
const editLocalizedField = asyncHandler(async (req, res) => {
  const { model: modelName, docId, fieldPath, lang, value } = req.body;

  if (!modelName || !docId || !fieldPath || !lang || value === undefined) {
    return res.status(400).json({ success: false, message: 'model, docId, fieldPath, lang, and value are required' });
  }
  if (!['sw', 'zh'].includes(lang)) {
    return res.status(400).json({ success: false, message: 'Only sw or zh may be edited' });
  }
  if (!SUPPORTED_MODELS[modelName]) {
    return res.status(400).json({ success: false, message: `Unsupported model: ${modelName}` });
  }

  // Validate fieldPath is a known target for this model to prevent arbitrary writes
  const entry = SUPPORTED_MODELS[modelName];
  const allowedPaths = entry.fields.map((f) => f.targetPath);
  if (!allowedPaths.includes(fieldPath)) {
    return res.status(400).json({
      success: false,
      message: `fieldPath "${fieldPath}" is not a translatable field for ${modelName}. Allowed: ${allowedPaths.join(', ')}`,
    });
  }

  const Model = _resolveModel(modelName);
  await Model.findByIdAndUpdate(docId, {
    $set: { [`${fieldPath}.${lang}`]: value },
  });

  logger.info(`[TranslationController] Edited ${modelName}/${docId} ${fieldPath}.${lang} by ${req.user?.email}`);
  res.json({ success: true, message: 'Field updated' });
});

// ─── Queue job management ─────────────────────────────────────────────────────

/**
 * @desc  List BullMQ jobs by status
 * @route GET /api/translation/queue/jobs?status=waiting&start=0&end=49
 * @access Admin
 */
const listQueueJobs = asyncHandler(async (req, res) => {
  const status = req.query.status || 'waiting';
  const VALID = ['waiting', 'active', 'delayed', 'completed', 'failed', 'paused'];
  if (!VALID.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID.join(', ')}` });
  }

  const start = Math.max(0, parseInt(req.query.start, 10) || 0);
  const end   = Math.min(start + 99, parseInt(req.query.end, 10) || 49);

  const jobs = await _getQueueJobsFromQueue([status], start, end);

  if (jobs === null) {
    return res.json({ success: true, jobs: [], note: 'BullMQ not configured — Redis unavailable' });
  }

  res.json({ success: true, jobs, total: jobs.length });
});

/**
 * @desc  Get a single BullMQ job by ID
 * @route GET /api/translation/queue/jobs/:jobId
 * @access Admin
 */
const getQueueJobById = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await _getQueueJobFromQueue(jobId);

  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found or BullMQ not configured' });
  }

  res.json({ success: true, job });
});

/**
 * @desc  Retry a failed job
 * @route POST /api/translation/queue/jobs/:jobId/retry
 * @access Admin
 */
const retryQueueJobById = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const ok = await _retryQueueJob(jobId);

  if (!ok) {
    return res.status(404).json({ success: false, message: 'Job not found, already active, or BullMQ not configured' });
  }

  logger.info(`[TranslationController] Job ${jobId} retried by ${req.user?.email}`);
  res.json({ success: true, message: `Job ${jobId} queued for retry` });
});

/**
 * @desc  Promote a delayed job to waiting
 * @route POST /api/translation/queue/jobs/:jobId/promote
 * @access Admin
 */
const promoteQueueJobById = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const ok = await _promoteQueueJob(jobId);

  if (!ok) {
    return res.status(404).json({ success: false, message: 'Job not found or BullMQ not configured' });
  }

  logger.info(`[TranslationController] Job ${jobId} promoted by ${req.user?.email}`);
  res.json({ success: true, message: `Job ${jobId} promoted to waiting` });
});

/**
 * @desc  Remove a job from the queue
 * @route DELETE /api/translation/queue/jobs/:jobId
 * @access Admin
 */
const removeQueueJobById = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const ok = await _removeQueueJob(jobId);

  if (!ok) {
    return res.status(404).json({ success: false, message: 'Job not found or BullMQ not configured' });
  }

  logger.info(`[TranslationController] Job ${jobId} removed by ${req.user?.email}`);
  res.json({ success: true, message: `Job ${jobId} removed` });
});

module.exports = {
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
};

// MukonoTalks

