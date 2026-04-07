/**
 * Cache middleware
 * In-memory response caching for frequently accessed read-only endpoints
 * Enterprise-grade with TTL, LRU eviction, cache invalidation, and hit/miss headers
 * For production at scale, migrate to Redis (see SCALABILITY.md)
 * @module middlewares/cache.middleware
 */

const logger = require('../utils/logger');

const MAX_CACHE_SIZE = parseInt(process.env.CACHE_MAX_SIZE, 10) || 5000;

/**
 * In-memory cache store with LRU eviction
 * Bounded by MAX_CACHE_SIZE to prevent OOM under load
 */
class MemoryCache {
  constructor(maxSize = MAX_CACHE_SIZE) {
    this.store = new Map();
    this.maxSize = maxSize;
    this.stats = { hits: 0, misses: 0, evictions: 0 };

    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this._cleanup(), 5 * 60 * 1000);
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }
    this.stats.hits++;
    return item.value;
  }

  set(key, value, ttlSeconds) {
    // Evict oldest entry if at capacity (LRU — Map preserves insertion order)
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
      this.stats.evictions++;
    }

    // Move to end (most-recently-used) if key exists
    if (this.store.has(key)) {
      this.store.delete(key);
    }

    this.store.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  invalidate(pattern) {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.includes(pattern)) {
        this.store.delete(key);
        count++;
      }
    }
    if (count > 0) {
      logger.debug(`Cache: invalidated ${count} entries matching "${pattern}"`);
    }
  }

  clear() {
    this.store.clear();
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.store.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) + '%' : '0%',
    };
  }

  _cleanup() {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiry) {
        this.store.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      logger.debug(`Cache: cleaned ${cleaned} expired entries`);
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

const cache = new MemoryCache();

/**
 * Cache middleware factory
 * @param {number} ttlSeconds - Time to live in seconds (default: 300 = 5 min)
 * @returns {Function} Express middleware
 */
const cacheResponse = (ttlSeconds = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `__cache__${req.originalUrl || req.url}`;
    const cached = cache.get(key);

    if (cached) {
      res.set('X-Cache', 'HIT');
      res.set('Content-Type', 'application/json');
      return res.status(200).send(cached);
    }

    // Override res.json to capture and cache the response
    res.set('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, JSON.stringify(body), ttlSeconds);
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Invalidate cache entries matching a URL pattern
 * Use after mutations (create/update/delete)
 * @param  {...string} patterns - URL patterns to invalidate
 * @returns {Function} Express middleware
 */
const invalidateCache = (...patterns) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Invalidate after successful mutation
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach((pattern) => cache.invalidate(pattern));
      }
      return originalJson(body);
    };
    next();
  };
};

module.exports = {
  cache,
  cacheResponse,
  invalidateCache,
};

// MukonoTalks

