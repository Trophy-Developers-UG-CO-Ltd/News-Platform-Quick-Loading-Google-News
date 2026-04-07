/**
 * Shared Redis connection for BullMQ and other Redis consumers.
 *
 * Exports { connection, isHealthy } so callers can check availability
 * before issuing commands.
 *
 * Design choices:
 *  - enableOfflineQueue:false — commands fail immediately when disconnected
 *    instead of queuing in memory (prevents Upstash quota storms)
 *  - maxRetriesPerRequest:null — required by BullMQ; kept as-is
 *  - Quota circuit-breaker — on "max requests limit exceeded" the connection
 *    is torn down and isHealthy() returns false for 5 minutes, letting the
 *    queue fall back to in-process mode without hammering the API
 *  - Debounced error logging — same error class only logged once per 30 s
 *
 * @module lib/redis
 */

'use strict';

const { env } = require('../config/env');
const logger = require('../utils/logger');

// ─── Internal state ───────────────────────────────────────────────────────────
let connection      = null;
let _healthy        = false;
let _quotaExceeded  = false;
let _quotaTimer     = null;

// Debounce identical error messages — same key only logs once per 30 s
const _lastLog        = {};
const LOG_DEBOUNCE_MS = 30_000;

function _debounce(key, logFn) {
  const now = Date.now();
  if (!_lastLog[key] || now - _lastLog[key] > LOG_DEBOUNCE_MS) {
    _lastLog[key] = now;
    logFn();
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function _isUpstashLimitError(err) {
  return String(err?.message || '').toLowerCase().includes('max requests limit exceeded');
}

/**
 * Returns true only when Redis is connected, ready, and not quota-suspended.
 * Always call this before issuing any queue operation.
 */
function isHealthy() {
  return !!(connection && _healthy && !_quotaExceeded);
}

/**
 * Circuit-breaker: called when Upstash quota is exceeded.
 * Disconnects the client, marks the connection unhealthy, and schedules
 * a 5-minute cooldown after which the flag resets so reconnection can retry.
 */
function _tripQuotaBreaker() {
  if (_quotaExceeded) return;
  _quotaExceeded = true;
  _healthy       = false;

  logger.error(
    '[Redis] Upstash quota exceeded — queue suspended for 5 minutes. ' +
    'Set ENABLE_QUEUE=false or upgrade your Upstash plan to suppress this.'
  );

  try { connection.disconnect(); } catch (_) { /* no-op */ }

  if (_quotaTimer) clearTimeout(_quotaTimer);
  _quotaTimer = setTimeout(() => {
    _quotaExceeded = false;
    logger.info('[Redis] Quota cooldown expired — reconnection will be attempted on next job');
  }, 5 * 60_000);
}

// ─── Connection setup ─────────────────────────────────────────────────────────
if (env.REDIS_URL && env.ENABLE_QUEUE !== false) {
  const IORedis = require('ioredis');

  connection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,   // Required by BullMQ — must stay null
    enableOfflineQueue:   false,  // Fail immediately when disconnected — no RAM queuing
    enableReadyCheck:     false,

    retryStrategy(times) {
      if (_quotaExceeded) return null;
      if (times > 8) {
        _debounce('retry-exhausted', () =>
          logger.error('[Redis] Reconnect attempts exhausted — will not retry further')
        );
        return null;
      }
      return Math.min(500 * Math.pow(2, times - 1), 30_000);
    },

    reconnectOnError(err) {
      if (_isUpstashLimitError(err)) {
        _tripQuotaBreaker();
        return false;
      }
      return true;
    },
  });

  connection.on('connect', () => {
    _healthy       = true;
    _quotaExceeded = false;
    logger.info('[Redis] Connected');
  });

  connection.on('ready', () => {
    _healthy = true;
    logger.info('[Redis] Ready');
  });

  connection.on('reconnecting', (delay) => {
    _healthy = false;
    _debounce('reconnecting', () =>
      logger.warn('[Redis] Reconnecting (next attempt in ' + delay + 'ms)')
    );
  });

  connection.on('end', () => {
    _healthy = false;
    logger.warn('[Redis] Connection closed');
  });

  connection.on('error', (err) => {
    if (_isUpstashLimitError(err)) {
      _tripQuotaBreaker();
      return;
    }
    _debounce('err:' + (err.code || err.message), () =>
      logger.error('[Redis] ' + err.message)
    );
  });

} else if (!env.REDIS_URL) {
  logger.warn('[Redis] REDIS_URL not set — Redis/queue features disabled');
} else {
  logger.info('[Redis] Queue disabled via ENABLE_QUEUE=false');
}

// ─── Exports ──────────────────────────────────────────────────────────────────
// Named exports so callers can destructure:
//   const { connection: redisConn, isHealthy } = require('../lib/redis');
module.exports = {
  connection,
  isHealthy,
};

// MukonoTalks

