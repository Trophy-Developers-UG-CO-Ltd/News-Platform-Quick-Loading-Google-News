/**
 * Performance Middleware
 * Static caching + response timing
 */

const staticCacheHeaders = (req, res, next) => {
  const url = req.url;

  // Vite built assets
  if (/\/assets\/.*\.(js|css|woff2?|ttf|eot)$/i.test(url)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }

  // Uploaded files
  if (url.startsWith("/uploads/")) {
    res.setHeader(
      "Cache-Control",
      "public, max-age=86400, stale-while-revalidate=604800"
    );
  }

  // HTML should not cache
  if (url.endsWith(".html") || url === "/") {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  }

  next();
};

const apiNoCacheHeaders = (req, res, next) => {
  if (req.originalUrl.startsWith("/api")) {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  next();
};

const responseTime = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;

    if (!res.headersSent) {
      res.setHeader("X-Response-Time", `${ms.toFixed(2)}ms`);
    }

    if (ms > 500) {
      const logger = require("../utils/logger");
      logger.warn(
        `Slow request: ${req.method} ${req.originalUrl} — ${ms.toFixed(2)}ms`
      );
    }
  });

  next();
};

module.exports = {
  staticCacheHeaders,
  apiNoCacheHeaders,
  responseTime,
};