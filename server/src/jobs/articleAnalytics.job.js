'use strict';

const AnalyticsService = require('../modules/analytics/analytics.service');
const logger = require('../utils/logger');

const FLUSH_INTERVAL_MS = 2 * 60 * 1000;

function startArticleAnalyticsJobs() {
  const timer = setInterval(async () => {
    try {
      const result = await AnalyticsService.flushArticleViewCountersToMongo(1000);
      logger.info(`[ArticleAnalyticsJob] flushed counters for ${result.processed} article(s)`);
    } catch (error) {
      logger.error(`[ArticleAnalyticsJob] flush failed: ${error.message}`);
    }
  }, FLUSH_INTERVAL_MS);

  if (typeof timer.unref === 'function') {
    timer.unref();
  }

  return timer;
}

module.exports = { startArticleAnalyticsJobs };
