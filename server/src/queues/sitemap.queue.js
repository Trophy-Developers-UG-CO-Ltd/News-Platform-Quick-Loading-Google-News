/**
 * Sitemap Queue
 * Background worker to regenerate sitemaps when content changes.
 * @module queues/sitemap.queue
 */

'use strict';

const logger = require('../utils/logger');

// Track pending regeneration
let _pendingRegen = false;
let _regenTimer   = null;

const REGEN_DEBOUNCE = 30_000; // 30 seconds debounce

/**
 * Invalidate the sitemap cache (triggers next request to rebuild).
 * In production, implement redis-backed caching here.
 */
function invalidateSitemapCache() {
  // Simple flag — sitemap service already regenerates on each request
  // This is a hook for future caching integration
  logger.info('[SitemapQueue] Sitemap cache invalidated.');
}

/**
 * Schedule a deferred sitemap regeneration.
 * Multiple calls within the debounce window are merged into one.
 */
function scheduleSitemapRegen() {
  if (_regenTimer) clearTimeout(_regenTimer);
  _regenTimer = setTimeout(async () => {
    try {
      logger.info('[SitemapQueue] Running scheduled sitemap regeneration...');
      invalidateSitemapCache();
      _pendingRegen = false;
      logger.info('[SitemapQueue] Sitemap regeneration complete.');
    } catch (err) {
      logger.error(`[SitemapQueue] Sitemap regen failed: ${err.message}`);
    }
  }, REGEN_DEBOUNCE);
  _pendingRegen = true;
  logger.info('[SitemapQueue] Sitemap regen scheduled.');
}

/**
 * Notify the queue that content has changed and sitemaps need updating.
 * Call this from product/article/page save hooks.
 */
function notifyContentChanged(type = 'page') {
  logger.info(`[SitemapQueue] Content changed (${type}) — scheduling sitemap update.`);
  scheduleSitemapRegen();
}

module.exports = { scheduleSitemapRegen, notifyContentChanged, invalidateSitemapCache };

// MukonoTalks

