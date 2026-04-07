/**
 * Language Resolver Middleware
 * ==============================
 * Attaches req.resolvedLang and req.langSource to every API request.
 *
 * Priority chain (highest → lowest):
 *   1. URL :lang param or ?lang= query
 *   2. Cookie `lang` (explicit user preference)
 *   3. CF-IPCountry header (Cloudflare edge)
 *   4. Accept-Language header (browser negotiation)
 *   5. Default: 'en'
 *
 * Usage in controllers:
 *   const lang = req.resolvedLang; // 'en' | 'sw' | 'zh'
 *
 * @module middlewares/language.middleware
 */

'use strict';

const { resolveLanguage } = require('../modules/i18n/i18n.controller');

/**
 * Attaches resolved language to every request.
 * Never blocks the request — always calls next().
 *
 * @type {import('express').RequestHandler}
 */
function languageMiddleware(req, res, next) {
  const { language, source, country } = resolveLanguage(req);
  req.resolvedLang = language;
  req.langSource = source;
  req.detectedCountry = country;
  next();
}

module.exports = { languageMiddleware };

// MukonoTalks

