/**
 * Translation Queue
 * =================
 * Optional BullMQ-backed background queue for heavy translation workloads.
 *
 * When Redis is available (REDIS_URL set), all translation jobs are processed
 * by a BullMQ worker asynchronously — the CMS save returns immediately and
 * the document is updated with translations in the background.
 *
 * When Redis is NOT available, the module falls back to an in-process
 * fire-and-forget setTimeout — translations still happen after save but
 * without persistence or retry guarantees across restarts.
 *
 * Usage (from any service):
 *   const { enqueueTranslation } = require('../../queues/translation.queue');
 *   await enqueueTranslation('Product', product._id, { title: 'English title' });
 *
 * @module queues/translation.queue
 */

'use strict';

const crypto = require('crypto');
const logger = require('../utils/logger');
const { env } = require('../config/env');
const { connection: redisConnection, isHealthy: isRedisHealthy } = require('../lib/redis');
const _queueEnabled = env.ENABLE_QUEUE !== false;

// ─── State ────────────────────────────────────────────────────────────────────

let _queue = null;
let _worker = null;

const QUEUE_NAME = 'cms-translations';

// ─── Model registry ───────────────────────────────────────────────────────────

/**
 * Maps model name → dot-path fields that store localized content.
 *
 * For models where localized fields ARE the root (Article, Page):
 *   Empty array — direct-injection path in _processJob handles them.
 * For models where localized field differs from source key:
 *   Provide explicit translateKey → mongoPath mapping.
 */
const MODEL_FIELD_MAP = {
  Product: [
    { translateKey: 'title',       mongoPath: 'localizedTitle'       },
    { translateKey: 'description', mongoPath: 'localizedDescription' },
    { translateKey: 'overview',    mongoPath: 'localizedOverview'    },
  ],
  Category: [
    { translateKey: 'name',        mongoPath: 'localizedName'        },
    { translateKey: 'description', mongoPath: 'localizedDescription' },
  ],
  Hero: [
    { translateKey: 'title',       mongoPath: 'localizedTitle'       },
    { translateKey: 'eyebrow',     mongoPath: 'localizedEyebrow'     },
    { translateKey: 'description', mongoPath: 'localizedDescription' },
    { translateKey: 'ctaText',     mongoPath: 'localizedCtaText'     },
  ],
  // Article and Page store langs directly: title.sw, excerpt.sw — direct injection
  Article: [],
  Page: [],
  // Navigation: label → localizedLabel.sw/zh
  NavItem: [
    { translateKey: 'label', mongoPath: 'localizedLabel' },
  ],
  // Footer singleton: tagline → localizedTagline.sw/zh
  FooterSettings: [
    { translateKey: 'tagline', mongoPath: 'localizedTagline' },
  ],
  // HomepageSection: flattened heading fields → nested localized variants
  HomepageSection: [
    { translateKey: 'headingEyebrow',     mongoPath: 'heading.localizedEyebrow'     },
    { translateKey: 'headingTitle',       mongoPath: 'heading.localizedTitle'       },
    { translateKey: 'headingDescription', mongoPath: 'heading.localizedDescription' },
  ],
};

/**
 * Compute a short SHA-256 content fingerprint for a fields object.
 * Used for idempotency — skip re-translation when content hasn't changed.
 *
 * @param {Record<string, string>} fields
 * @returns {string} 16-char hex digest
 */
function _hashFields(fields) {
  const stable = JSON.stringify(
    Object.keys(fields).sort().reduce((obj, k) => { obj[k] = fields[k]; return obj; }, {})
  );
  return crypto.createHash('sha256').update(stable).digest('hex').slice(0, 16);
}

// ─── Job processor ───────────────────────────────────────────────────────────

/**
 * Process one translation job.
 * Checks idempotency hash, translates, writes sw/zh translations +
 * translationStatus + translationMeta back to MongoDB.
 *
 * @param {{ modelName: string, docId: string, fields: Record<string, string>, contentHash?: string }} jobData
 */
async function _processJob(jobData) {
  const { modelName, docId, fields, contentHash } = jobData;

  if (!fields || Object.keys(fields).length === 0) return;

  const translationService = require('../services/translationService');
  const mongoose = require('mongoose');

  // ── Idempotency check ──────────────────────────────────────────────────────
  if (contentHash) {
    try {
      const Model = mongoose.model(modelName);
      const stored = await Model.findById(docId).select('translationHash').lean();
      if (stored?.translationHash?.en === contentHash) {
        logger.info(`[TranslationQueue] Skipping ${modelName} ${docId} — content hash unchanged`);
        return;
      }
    } catch (_) { /* Non-fatal: proceed with translation */ }
  }

  // ── Mark as processing ────────────────────────────────────────────────────
  try {
    const Model = mongoose.model(modelName);
    await Model.findByIdAndUpdate(docId, {
      $set: {
        'translationStatus.sw': 'processing',
        'translationStatus.zh': 'processing',
      },
    });
  } catch (_) { /* Non-fatal */ }

  const translations = await translationService.translateFields(fields, {}, false, { entityType: modelName });
  if (Object.keys(translations).length === 0) {
    try {
      const Model = mongoose.model(modelName);
      await Model.findByIdAndUpdate(docId, {
        $set: { 'translationStatus.sw': 'failed', 'translationStatus.zh': 'failed' },
      });
    } catch (_) { /* Non-fatal */ }
    return;
  }

  // ── Build MongoDB $set payload ─────────────────────────────────────────────
  const fieldMap = MODEL_FIELD_MAP[modelName] || [];
  const $set = {};

  for (const { translateKey, mongoPath } of fieldMap) {
    const t = translations[translateKey];
    if (!t) continue;
    if (t.sw) $set[`${mongoPath}.sw`] = t.sw;
    if (t.zh) $set[`${mongoPath}.zh`] = t.zh;
  }

  // For models that store langs directly on the object (articles, pages)
  // the field map won't match — fall back to direct path injection
  for (const [key, langs] of Object.entries(translations)) {
    const mapped = fieldMap.find((m) => m.translateKey === key);
    if (!mapped) {
      if (langs.sw) $set[`${key}.sw`] = langs.sw;
      if (langs.zh) $set[`${key}.zh`] = langs.zh;
    }
  }

  // ── Translation status + metadata ─────────────────────────────────────────
  const now = new Date();
  $set['translationStatus.sw'] = 'completed';
  $set['translationStatus.zh'] = 'completed';
  $set['translationMeta.translatedAt.sw'] = now;
  $set['translationMeta.translatedAt.zh'] = now;
  const translationProvider = translationService.TRANSLATION_PROVIDER || 'google';
  $set['translationMeta.provider.sw'] = translationProvider;
  $set['translationMeta.provider.zh'] = translationProvider;
  if (contentHash) $set['translationHash.en'] = contentHash;

  if (Object.keys($set).length === 0) return;

  try {
    const Model = mongoose.model(modelName);
    await Model.findByIdAndUpdate(docId, { $set });
    logger.info(`[TranslationQueue] Updated ${modelName} ${docId}: ${Object.keys(fields).join(', ')}`);
  } catch (err) {
    logger.error(`[TranslationQueue] DB update failed for ${modelName} ${docId}: ${err.message}`);
    try {
      const Model = mongoose.model(modelName);
      await Model.findByIdAndUpdate(docId, {
        $set: { 'translationStatus.sw': 'failed', 'translationStatus.zh': 'failed' },
      });
    } catch (_) { /* Non-fatal */ }
    throw err; // Let BullMQ handle retry
  }
}

// ─── BullMQ initialisation ───────────────────────────────────────────────────

// ─── Eager BullMQ initialisation ──────────────────────────────────────────────
//
// If Redis is available AND Google Translate is configured, we create the
// Queue + Worker immediately at require-time. No async init step needed.

const _translationConfigured = !!(env.GOOGLE_TRANSLATE_API_KEY || process.env.AI_TRANSLATION_API_KEY);

if (_queueEnabled && redisConnection && _translationConfigured) {
  try {
    const { Queue, Worker } = require('bullmq');

    _queue = new Queue(QUEUE_NAME, { connection: redisConnection });

    _worker = new Worker(
      QUEUE_NAME,
      async (job) => _processJob(job.data),
      {
        connection: redisConnection,
        concurrency: 3,
        limiter: { max: 10, duration: 1000 },
      }
    );

    _worker.on('completed', (job) => {
      logger.info(`[TranslationQueue] Job ${job.id} (${job.data.modelName}) completed`);
    });

    _worker.on('failed', (job, err) => {
      logger.error(`[TranslationQueue] Job ${job?.id} failed: ${err.message}`);
    });

    _worker.on('error', (err) => {
      logger.error(`[TranslationQueue] Worker error: ${err.message}`);
    });

    logger.info('[TranslationQueue] BullMQ queue and worker initialised');
  } catch (err) {
    logger.warn(`[TranslationQueue] Failed to initialise BullMQ: ${err.message}. Using in-process fallback.`);
    _queue = null;
    _worker = null;
  }
} else if (!_queueEnabled) {
  logger.info('[TranslationQueue] Queue disabled via ENABLE_QUEUE=false — translations run in-process');
} else if (!redisConnection) {
  logger.info('[TranslationQueue] Redis not available — using in-process fallback');
} else if (!_translationConfigured) {
  logger.info('[TranslationQueue] No translation API key set — translation queue disabled');
}

/**
 * Kept for backward compatibility. Now a no-op — queue is initialised at module load.
 */
async function initTranslationQueue() {}

// ─── Public enqueue API ───────────────────────────────────────────────────────

/**
 * Enqueue a background translation job for a saved document.
 *
 * If BullMQ/Redis is available, the job is queued with retry support.
 * Otherwise, it runs asynchronously in the current process (fire-and-forget).
 *
 * Idempotency: content hash is computed from `fields` and stored on the document.
 * If the content hasn't changed since the last successful translation, the worker
 * will skip it — preventing duplicate API billing and queue load.
 *
 * Retry strategy (BullMQ exponential backoff):
 *   Attempt 1: immediate
 *   Attempt 2: delay 1 min
 *   Attempt 3: delay 5 min
 *   → dead-letter logging on permanent failure
 *
 * @param {string}                modelName  Mongoose model name (e.g. 'Product')
 * @param {string|ObjectId}       docId      Document _id to update
 * @param {Record<string,string>} fields     { fieldName: 'English text' } to translate
 * @param {object}               [opts]      BullMQ job options override
 */
async function enqueueTranslation(modelName, docId, fields, opts = {}) {
  if (!_translationConfigured) return;
  if (!fields || Object.keys(fields).length === 0) return;

  const contentHash = _hashFields(fields);
  const jobData = { modelName, docId: String(docId), fields, contentHash };

  if (_queue) {
    await _safeQueueAdd(jobData, opts);
  } else {
    _runInProcess(jobData);
  }
}

/**
 * Safely add a job to the BullMQ queue.
 * Checks Redis health before attempting, falls back to in-process if
 * Redis is unhealthy or the add call times out (3 s).
 *
 * @param {object} jobData
 * @param {object} [opts] BullMQ job options override
 */
async function _safeQueueAdd(jobData, opts = {}) {
  if (!isRedisHealthy()) {
    logger.warn(`[TranslationQueue] Redis unhealthy — falling back to in-process for ${jobData.modelName}`);
    _runInProcess(jobData);
    return;
  }
  try {
    await Promise.race([
      _queue.add('translate', jobData, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 60_000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
        ...opts,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('queue.add timeout (3s)')), 3_000)
      ),
    ]);
  } catch (err) {
    logger.warn(`[TranslationQueue] Enqueue failed (${err.message}) — falling back to in-process`);
    _runInProcess(jobData);
  }
}

/**
 * In-process fire-and-forget fallback (no Redis).
 * Runs after a short delay so the HTTP response is sent first.
 *
 * @param {object} jobData
 */
function _runInProcess(jobData) {
  setImmediate(async () => {
    try {
      await _processJob(jobData);
    } catch (err) {
      logger.error(`[TranslationQueue] In-process translation failed for ${jobData.modelName} ${jobData.docId}: ${err.message}`);
    }
  });
}

// ─── Queue status ─────────────────────────────────────────────────────────────

/**
 * Returns current queue statistics (active, waiting, completed, failed counts).
 * Returns null if BullMQ is not configured.
 *
 * @returns {Promise<object|null>}
 */

function _withTimeout(promise, ms = 3000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), ms)),
  ]);
}

async function getQueueStats() {
  if (!_queue) return null;
  try {
    const [waiting, active, completed, failed, delayed] = await _withTimeout(Promise.all([
      _queue.getWaitingCount(),
      _queue.getActiveCount(),
      _queue.getCompletedCount(),
      _queue.getFailedCount(),
      _queue.getDelayedCount(),
    ]));
    return { waiting, active, completed, failed, delayed };
  } catch (err) {
    logger.warn(`[TranslationQueue] Failed to fetch queue stats: ${err.message}`);
    return null;
  }
}

/**
 * Gracefully shut down the queue and worker.
 * Call during server SIGTERM/SIGINT handlers.
 */
async function shutdownQueue() {
  try {
    if (_worker) await _worker.close();
    if (_queue) await _queue.close();
    logger.info('[TranslationQueue] Queue shut down gracefully');
  } catch (err) {
    logger.warn(`[TranslationQueue] Error during shutdown: ${err.message}`);
  }
}

// ─── BullMQ job management ────────────────────────────────────────────────────

/**
 * Returns an array of job objects for the given status.
 * Returns null if BullMQ is not configured.
 *
 * @param {string[]} statuses  e.g. ['waiting'] | ['active'] | ['failed']
 * @param {number}   start
 * @param {number}   end
 * @returns {Promise<object[]|null>}
 */
async function getQueueJobs(statuses = ['waiting'], start = 0, end = 49) {
  if (!_queue) return null;
  try {
    const jobs = await _withTimeout(_queue.getJobs(statuses, start, end, true));
    return jobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      delay: job.delay,
    }));
  } catch (err) {
    logger.warn(`[TranslationQueue] getQueueJobs failed: ${err.message}`);
    return null;
  }
}

/**
 * Returns a single job object by ID.
 * Returns null if job not found or BullMQ not configured.
 *
 * @param {string} jobId
 * @returns {Promise<object|null>}
 */
async function getQueueJob(jobId) {
  if (!_queue) return null;
  try {
    const job = await _withTimeout(_queue.getJob(jobId));
    if (!job) return null;
    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      delay: job.delay,
    };
  } catch (err) {
    logger.warn(`[TranslationQueue] getQueueJob failed: ${err.message}`);
    return null;
  }
}

/**
 * Retry a failed job.
 * @param {string} jobId
 * @returns {Promise<boolean>}
 */
async function retryQueueJob(jobId) {
  if (!_queue) return false;
  try {
    const job = await _withTimeout(_queue.getJob(jobId));
    if (!job) return false;
    await _withTimeout(job.retry());
    return true;
  } catch (err) {
    logger.warn(`[TranslationQueue] retryQueueJob failed: ${err.message}`);
    return false;
  }
}

/**
 * Promote a delayed job to the waiting queue.
 * @param {string} jobId
 * @returns {Promise<boolean>}
 */
async function promoteQueueJob(jobId) {
  if (!_queue) return false;
  try {
    const job = await _withTimeout(_queue.getJob(jobId));
    if (!job) return false;
    await _withTimeout(job.promote());
    return true;
  } catch (err) {
    logger.warn(`[TranslationQueue] promoteQueueJob failed: ${err.message}`);
    return false;
  }
}

/**
 * Remove a job from the queue.
 * @param {string} jobId
 * @returns {Promise<boolean>}
 */
async function removeQueueJob(jobId) {
  if (!_queue) return false;
  try {
    const job = await _withTimeout(_queue.getJob(jobId));
    if (!job) return false;
    await _withTimeout(job.remove());
    return true;
  } catch (err) {
    logger.warn(`[TranslationQueue] removeQueueJob failed: ${err.message}`);
    return false;
  }
}

module.exports = {
  initTranslationQueue,
  enqueueTranslation,
  getQueueStats,
  getQueueJobs,
  getQueueJob,
  retryQueueJob,
  promoteQueueJob,
  removeQueueJob,
  shutdownQueue,
  MODEL_FIELD_MAP,
  hashTranslationFields: _hashFields,
};

// MukonoTalks

