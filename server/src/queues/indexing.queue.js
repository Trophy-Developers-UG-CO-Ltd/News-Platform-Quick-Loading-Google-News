/**
 * Indexing Queue
 * Background worker for async URL submission to search engines.
 * Uses in-memory queue pattern (BullMQ can be swapped in when Redis is available).
 * @module queues/indexing.queue
 */

'use strict';

const logger    = require('../utils/logger');
const IndexNow  = require('../modules/indexing/indexnow.service');
const Google    = require('../modules/indexing/google-indexing.service');
const SeoMetadata = require('../modules/seo-metadata/metadata.model');

// Simple in-memory queue — replace with BullMQ in production
const _queue = [];
let _processing = false;
const MAX_DRAIN_ITERATIONS = 500;

function _withJobTimeout(promise, ms) {
  const timeout = ms || 30000;
  return Promise.race([
    promise,
    new Promise(function(_, reject) {
      setTimeout(function() { reject(new Error('Job timed out after ' + timeout + 'ms')); }, timeout);
    }),
  ]);
}

async function processJob(job) {
  const { urls, type = 'URL_UPDATED', engines = ['indexnow', 'google'] } = job;

  logger.info(`[IndexingQueue] Processing ${urls.length} URL(s)...`);

  const results = {};

  if (engines.includes('indexnow')) {
    try {
      results.indexnow = await IndexNow.submitUrls(urls);
    } catch (err) {
      logger.error(`[IndexingQueue] IndexNow error: ${err.message}`);
      results.indexnow = { error: err.message };
    }
  }

  if (engines.includes('google')) {
    try {
      results.google = await Google.submitUrls(urls, type);
    } catch (err) {
      logger.error(`[IndexingQueue] Google error: ${err.message}`);
      results.google = { error: err.message };
    }
  }

  // Mark pages as submitted
  try {
    await SeoMetadata.updateMany(
      { pageSlug: { $in: urls.map(u => u.replace(/^https?:\/\/[^/]+/, '')) } },
      { $set: { indexingStatus: 'submitted', lastIndexedAt: new Date() } }
    );
  } catch (err) {
    logger.warn(`[IndexingQueue] Could not update indexing status: ${err.message}`);
  }

  return results;
}

async function drainQueue() {
  if (_processing || _queue.length === 0) return;
  _processing = true;

    let iterations = 0;
    while (_queue.length > 0 && iterations < MAX_DRAIN_ITERATIONS) {
      iterations++;
      const job = _queue.shift();
      try {
        await _withJobTimeout(processJob(job), 30000);
      } catch (err) {
        logger.error(`[IndexingQueue] Job failed: ${err.message}`);
      }
      // Throttle to respect API rate limits
      await new Promise(r => setTimeout(r, 500));
    }

    if (_queue.length > 0) {
      logger.warn(`[IndexingQueue] Drain capped at ${MAX_DRAIN_ITERATIONS} jobs — ${_queue.length} remain`);
    }

    _processing = false;
}

/**
 * Add URLs to the indexing queue.
 * @param {string|string[]} urls
 * @param {object} opts
 */
function enqueue(urls, opts = {}) {
  const urlList = Array.isArray(urls) ? urls : [urls];
  _queue.push({ urls: urlList, ...opts });
  // Process asynchronously
  setImmediate(drainQueue);
  logger.info(`[IndexingQueue] Enqueued ${urlList.length} URL(s) for indexing.`);
}

/**
 * Queue a single page for indexing after publish/update.
 */
function queuePageIndexing(pageSlug) {
  const fullUrl = pageSlug.startsWith('http')
    ? pageSlug
    : `${process.env.CLIENT_URL || 'https://www.mukonotalks.ug'}${pageSlug}`;
  enqueue([fullUrl]);
}

module.exports = { enqueue, queuePageIndexing };

// MukonoTalks

