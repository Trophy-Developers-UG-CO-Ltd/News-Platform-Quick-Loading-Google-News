/**
 * Redirect middleware
 * Intercepts incoming requests and serves approved SEO redirects.
 * Must be mounted BEFORE API routes and static file serving.
 * @module modules/redirects/redirect.middleware
 */

'use strict';

const Redirect = require('./redirect.model');

// Cache approved redirects in memory (TTL: 5 min)
let _cache     = new Map();
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadCache() {
  const now = Date.now();
  if (_cache.size > 0 && (now - _cacheTime) < CACHE_TTL) return _cache;

  const redirects = await Redirect.find({ status: 'approved' }, 'fromPath toPath statusCode').lean();
  const map = new Map();
  for (const r of redirects) {
    map.set(r.fromPath.toLowerCase(), { toPath: r.toPath, statusCode: r.statusCode, _id: r._id });
  }
  _cache     = map;
  _cacheTime = now;
  return map;
}

/** Invalidate the in-memory cache (call after redirect create/update/delete). */
function invalidateCache() {
  _cache     = new Map();
  _cacheTime = 0;
}

/**
 * Express middleware: checks incoming path against approved redirects.
 * Skips /api/*, /uploads/*, sitemaps, and static assets.
 */
async function redirectMiddleware(req, res, next) {
  // Skip API, uploads, and known static assets
  const path = req.path.toLowerCase();
  if (
    path.startsWith('/api/') ||
    path.startsWith('/uploads/') ||
    path.startsWith('/sitemap') ||
    path.startsWith('/news-sitemap') ||
    path.startsWith('/video-sitemap') ||
    path.startsWith('/robots.txt') ||
    path.startsWith('/llm.txt') ||
    path.includes('.')   // likely a file (js, css, png, etc.)
  ) {
    return next();
  }

  try {
    const cache  = await loadCache();
    const target = cache.get(path);

    if (target) {
      // Track click asynchronously — fire-and-forget
      Redirect.findByIdAndUpdate(target._id, {
        $inc: { clickCount: 1 },
        $set: { lastClickedAt: new Date() },
      }).catch(() => {});

      return res.redirect(target.statusCode || 301, target.toPath);
    }

    next();
  } catch {
    // If DB is down, don't block the request
    next();
  }
}

module.exports = { redirectMiddleware, invalidateCache };

// MukonoTalks

