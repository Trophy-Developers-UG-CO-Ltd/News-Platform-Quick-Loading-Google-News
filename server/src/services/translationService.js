/**
 * CMS Translation Service
 * ========================
 * Auto-translates English CMS content to Swahili (sw) and Chinese (zh)
 * using Google Cloud Translation API v2 (Basic) with an API key.
 *
 * Features:
 *  - In-memory LRU cache — avoids repeated API calls for identical text
 *  - Exponential-backoff retry — handles transient API failures
 *  - Concurrency limiter — prevents rate-limit hammering
 *  - Input validation and sanitization
 *  - HTML-aware translation for rich-text content blocks
 *  - Graceful degradation — never crashes a CMS save if translation fails
 *
 * @module services/translationService
 */

'use strict';

const crypto = require('crypto');
const { env } = require('../config/env');
const logger = require('../utils/logger');
const { buildTranslationPrompt, parseTranslationResponse } = require('./translationPrompt');

// ─── Constants ───────────────────────────────────────────────────────────────

/** Languages to translate into. English (en) is always the source. */
const TARGET_LANGS = ['sw', 'zh'];

/**
 * Active translation provider: 'google' (default) or 'ai' (LLM-based).
 * Set via TRANSLATION_PROVIDER env var.
 */
const TRANSLATION_PROVIDER = (process.env.TRANSLATION_PROVIDER || 'google').toLowerCase();

/** Block types inside article/page contentBlocks that contain translatable text. */
const TRANSLATABLE_BLOCK_TYPES = new Set(['text', 'quote', 'list']);

/** Max characters forwarded to the API per request. Google's limit is 5 000. */
const MAX_TEXT_LENGTH = 4_900;

/** Maximum number of entries the in-memory cache will hold. */
const TRANSLATION_CACHE_MAX = parseInt(process.env.TRANSLATION_CACHE_SIZE, 10) || 20_000;

/** How many concurrent Google API calls may run at once. */
const CONCURRENCY_LIMIT = parseInt(process.env.TRANSLATION_CONCURRENCY, 10) || 5;

/** Max retry attempts before giving up on a single translation. */
const MAX_RETRIES = 3;

/** Base delay (ms) for retry backoff — doubles each attempt. */
const RETRY_BASE_DELAY_MS = 500;

// ─── Concurrency Limiter ─────────────────────────────────────────────────────

/**
 * Simple promise-based concurrency limiter (no external deps).
 * Limits how many async tasks run in parallel.
 *
 * @param {number} maxConcurrent
 * @returns {(task: () => Promise<any>) => Promise<any>}
 */
function createConcurrencyLimiter(maxConcurrent) {
  let active = 0;
  const pending = [];

  const next = () => {
    while (active < maxConcurrent && pending.length > 0) {
      const { task, resolve, reject } = pending.shift();
      active++;
      task().then(
        (v) => { active--; resolve(v); next(); },
        (e) => { active--; reject(e); next(); }
      );
    }
  };

  return (task) =>
    new Promise((resolve, reject) => {
      pending.push({ task, resolve, reject });
      next();
    });
}

const limit = createConcurrencyLimiter(CONCURRENCY_LIMIT);

// ─── LRU Cache ───────────────────────────────────────────────────────────────

/**
 * Bounded LRU cache that uses insertion-order Map eviction.
 * Keys are SHA-256 hashes of (targetLang + text) to save memory.
 */
class TranslationCache {
  constructor(maxSize) {
    this._store = new Map();
    this._maxSize = maxSize;
  }

  _key(text, targetLang) {
    const hash = crypto
      .createHash('sha256')
      .update(`${targetLang}:${text}`)
      .digest('hex')
      .slice(0, 20);
    return hash;
  }

  get(text, targetLang) {
    const k = this._key(text, targetLang);
    if (!this._store.has(k)) return null;
    // Refresh insertion order (LRU)
    const v = this._store.get(k);
    this._store.delete(k);
    this._store.set(k, v);
    return v;
  }

  set(text, targetLang, translation) {
    const k = this._key(text, targetLang);
    // Evict oldest when full
    if (this._store.size >= this._maxSize) {
      this._store.delete(this._store.keys().next().value);
    }
    this._store.set(k, translation);
  }

  get size() { return this._store.size; }

  clear() { this._store.clear(); }
}

const _cache = new TranslationCache(TRANSLATION_CACHE_MAX);

// ─── Google Translate Client (lazy init) ─────────────────────────────────────

let _translateClient = null;

function _getClient() {
  if (_translateClient) return _translateClient;

  const apiKey = env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GOOGLE_TRANSLATE_API_KEY is not configured. ' +
      'Set it in .env to enable automatic translation.'
    );
  }

  // Lazy-require to avoid load errors on environments without the package
  const { Translate } = require('@google-cloud/translate').v2;
  _translateClient = new Translate({ key: apiKey });
  logger.info('[TranslationService] Google Translate client initialised');
  return _translateClient;
}

// ─── HTML detector ───────────────────────────────────────────────────────────

/** Returns true if text looks like an HTML fragment. */
const _isHtml = (text) => /<[a-z][\s\S]*>/i.test(text);

// ─── AI (LLM) Translation Provider ──────────────────────────────────────────

/**
 * Translate multiple fields at once using an LLM (OpenAI-compatible API).
 * Sends all fields in a single prompt and receives all translations back.
 *
 * This is more cost-effective than per-field calls because the LLM gets full
 * context (entity type, all fields together) for better coherence.
 *
 * @param {Record<string, string>} fields      — { fieldName: "English text" }
 * @param {object}                 [options]
 * @param {string}                 [options.entityType='Content']
 * @returns {Promise<{ sw: Record<string, string>, zh: Record<string, string> }>}
 */
async function translateFieldsAI(fields, options = {}) {
  const apiKey = process.env.AI_TRANSLATION_API_KEY;
  if (!apiKey) {
    throw new Error('AI_TRANSLATION_API_KEY is not configured. Set it in .env to use AI translation.');
  }

  const baseUrl = (process.env.AI_TRANSLATION_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = process.env.AI_TRANSLATION_MODEL || 'gpt-4o-mini';

  // Filter out empty fields
  const cleanFields = {};
  for (const [key, text] of Object.entries(fields)) {
    if (text && typeof text === 'string' && text.trim()) {
      cleanFields[key] = text.trim();
    }
  }

  if (Object.keys(cleanFields).length === 0) {
    return { sw: {}, zh: {} };
  }

  const prompt = buildTranslationPrompt(cleanFields, {
    entityType: options.entityType || 'Content',
  });

  const expectedFields = Object.keys(cleanFields);

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await limit(async () => {
        const https = require('https');
        const url = new URL(`${baseUrl}/chat/completions`);

        const body = JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 4096,
          response_format: { type: 'json_object' },
        });

        return new Promise((resolve, reject) => {
          const req = https.request(
            {
              hostname: url.hostname,
              port: url.port || 443,
              path: url.pathname + url.search,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
                'Content-Length': Buffer.byteLength(body),
              },
              timeout: 60_000,
            },
            (res) => {
              let data = '';
              res.on('data', (chunk) => { data += chunk; });
              res.on('end', () => {
                if (res.statusCode >= 400) {
                  reject(new Error(`AI API returned ${res.statusCode}: ${data.slice(0, 300)}`));
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.message?.content;
                  if (!content) {
                    reject(new Error('AI API returned empty content'));
                    return;
                  }
                  resolve(content);
                } catch (e) {
                  reject(new Error(`Failed to parse AI API response: ${e.message}`));
                }
              });
            }
          );
          req.on('error', reject);
          req.on('timeout', () => { req.destroy(); reject(new Error('AI API request timed out')); });
          req.write(body);
          req.end();
        });
      });

      const result = parseTranslationResponse(response, expectedFields);

      // Cache individual translations for future cache hits
      for (const field of expectedFields) {
        if (result.sw[field]) _cache.set(cleanFields[field], 'sw', result.sw[field]);
        if (result.zh[field]) _cache.set(cleanFields[field], 'zh', result.zh[field]);
      }

      logger.info(`[TranslationService] AI translated ${expectedFields.length} fields (model: ${model})`);
      return result;
    } catch (err) {
      lastError = err;

      // Non-retryable errors
      if (err.message.includes('401') || err.message.includes('403')) {
        logger.error(`[TranslationService] AI auth error: ${err.message}`);
        break;
      }

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        logger.warn(
          `[TranslationService] AI attempt ${attempt}/${MAX_RETRIES} failed. Retrying in ${delay}ms: ${err.message}`
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  logger.error(
    `[TranslationService] AI translation failed after ${MAX_RETRIES} attempts: ${lastError?.message || 'unknown'}`
  );

  // Return empty strings for all fields (graceful degradation)
  const empty = { sw: {}, zh: {} };
  for (const key of Object.keys(cleanFields)) {
    empty.sw[key] = '';
    empty.zh[key] = '';
  }
  return empty;
}

// ─── Core translation (single string → single language) ──────────────────────

/**
 * Translate a single piece of English text to one target language.
 *
 * - Checks the LRU cache first.
 * - Retries up to MAX_RETRIES times with exponential backoff.
 * - Returns '' on permanent failure (never throws) so a CMS save is never blocked.
 *
 * @param {string} text       English source text (plain or HTML)
 * @param {string} targetLang BCP-47 language tag e.g. 'sw', 'zh'
 * @returns {Promise<string>} Translated string (empty on failure)
 */
async function translateText(text, targetLang) {
  if (!text || typeof text !== 'string') return '';

  const cleaned = text.trim();
  if (!cleaned) return '';

  // Truncate to API limit
  const source = cleaned.length > MAX_TEXT_LENGTH
    ? cleaned.slice(0, MAX_TEXT_LENGTH)
    : cleaned;

  // Cache check
  const cached = _cache.get(source, targetLang);
  if (cached !== null) return cached;

  // Determine format
  const format = _isHtml(source) ? 'html' : 'text';

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const client = _getClient();

      const [result] = await limit(() =>
        client.translate(source, { to: targetLang, format })
      );

      const translated = Array.isArray(result) ? result[0] : result;
      _cache.set(source, targetLang, translated);
      return translated;
    } catch (err) {
      lastError = err;

      // Non-retryable: quota exceeded / auth failure
      if (err.code === 403 || err.code === 429 || err.code === 400) {
        logger.error(
          `[TranslationService] Non-retryable error (${err.code}) translating to ${targetLang}: ${err.message}`
        );
        break;
      }

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        logger.warn(
          `[TranslationService] Attempt ${attempt}/${MAX_RETRIES} failed translating to ${targetLang}. ` +
          `Retrying in ${delay}ms…`
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  logger.error(
    `[TranslationService] Translation to ${targetLang} failed after ${MAX_RETRIES} attempts: ` +
    (lastError?.message || 'unknown error')
  );
  return ''; // Graceful degradation — never block the CMS save
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Translate a single English string to Swahili and Chinese.
 *
 * @param  {string} text  English source text
 * @returns {Promise<{ sw: string, zh: string }>}
 *
 * @example
 *   const { sw, zh } = await translateCMS('Advanced Pigment Technology');
 *   // { sw: 'Teknolojia ya juu ya rangi', zh: '先进颜料技术' }
 */
async function translateCMS(text) {
  if (!text || !String(text).trim()) return { sw: '', zh: '' };

  const [sw, zh] = await Promise.all(
    TARGET_LANGS.map((lang) => translateText(String(text), lang))
  );
  return { sw, zh };
}

/**
 * Translate multiple named English fields in one call.
 * Only translates fields not already present in `existing`.
 *
 * @param {Record<string, string>} fields
 *   Object of { fieldName: 'English text' } to translate.
 * @param {Record<string, { sw?: string, zh?: string }>} [existing={}]
 *   Already-stored translations — fields with both sw+zh are skipped.
 * @param {boolean} [force=false]
 *   When true, re-translate even if translations already exist.
 *
 * @returns {Promise<Record<string, { sw: string, zh: string }>>}
 *   { fieldName: { sw: '...', zh: '...' } }
 *
 * @example
 *   const result = await translateFields(
 *     { title: 'Advanced Pigment Technology', description: 'Durable pigments...' },
 *     { title: { sw: '', zh: '' } }   // title has no existing translations
 *   );
 *   // result.title.sw, result.title.zh
 *   // result.description.sw, result.description.zh
 */
async function translateFields(fields, existing = {}, force = false, options = {}) {
  if (!fields || typeof fields !== 'object') return {};

  // Determine which fields actually need translation
  const fieldsToTranslate = {};
  for (const [key, text] of Object.entries(fields)) {
    if (!text || typeof text !== 'string' || !text.trim()) continue;

    // Validate text length sanity
    if (text.length > 50_000) {
      logger.warn(`[TranslationService] Field "${key}" is very large (${text.length} chars). Skipping to prevent abuse.`);
      continue;
    }

    let needsAny = false;
    for (const lang of TARGET_LANGS) {
      const alreadyExists = existing[key]?.[lang] && existing[key][lang].trim();
      if (!force && alreadyExists) continue;
      needsAny = true;
    }
    if (needsAny) fieldsToTranslate[key] = text;
  }

  if (Object.keys(fieldsToTranslate).length === 0) return {};

  // ── AI provider: batch all fields in one LLM call ──────────────────────────
  if (TRANSLATION_PROVIDER === 'ai') {
    try {
      // Check cache first — only send uncached fields to AI
      const cached = {};
      const uncached = {};
      for (const [key, text] of Object.entries(fieldsToTranslate)) {
        const swCached = _cache.get(text.trim(), 'sw');
        const zhCached = _cache.get(text.trim(), 'zh');
        if (swCached !== null && zhCached !== null) {
          cached[key] = { sw: swCached, zh: zhCached };
        } else {
          uncached[key] = text;
        }
      }

      let aiResult = { sw: {}, zh: {} };
      if (Object.keys(uncached).length > 0) {
        aiResult = await translateFieldsAI(uncached, {
          entityType: options.entityType || 'Content',
        });
      }

      // Merge cached + AI results
      const output = {};
      for (const key of Object.keys(fieldsToTranslate)) {
        output[key] = {
          sw: cached[key]?.sw || aiResult.sw[key] || '',
          zh: cached[key]?.zh || aiResult.zh[key] || '',
        };
      }
      return output;
    } catch (err) {
      logger.error(`[TranslationService] AI provider failed, falling back to Google: ${err.message}`);
      // Fall through to Google Translate below
    }
  }

  // ── Google Translate provider: per-field per-language calls ─────────────────
  const tasks = [];
  for (const [key, text] of Object.entries(fieldsToTranslate)) {
    for (const lang of TARGET_LANGS) {
      const alreadyExists = existing[key]?.[lang] && existing[key][lang].trim();
      if (!force && alreadyExists) continue;
      tasks.push({ key, lang, text });
    }
  }

  if (tasks.length === 0) return {};

  // Run all translations in parallel (rate-limited by the concurrency limiter)
  const results = await Promise.all(
    tasks.map(({ text, lang }) => translateText(text, lang))
  );

  const output = {};
  tasks.forEach(({ key, lang }, i) => {
    if (!output[key]) output[key] = {};
    output[key][lang] = results[i];
  });

  return output;
}

/**
 * Translate content blocks from an article or page.
 * Only processes block types in TRANSLATABLE_BLOCK_TYPES (text, quote, list).
 * Skips blocks that already have both sw and zh unless `force` is true.
 *
 * @param {Array}   contentBlocks  Mongoose contentBlocks array
 * @param {boolean} [force=false]  Re-translate even if translations exist
 * @returns {Promise<Array>} Updated contentBlocks (new objects, originals untouched)
 */
async function translateContentBlocks(contentBlocks, force = false) {
  if (!Array.isArray(contentBlocks) || contentBlocks.length === 0) {
    return contentBlocks;
  }

  const updated = await Promise.all(
    contentBlocks.map(async (block) => {
      if (!TRANSLATABLE_BLOCK_TYPES.has(block.type)) return block;

      const enContent = block.data?.en;
      if (!enContent) return block;

      const needsSw = force || !block.data?.sw;
      const needsZh = force || !block.data?.zh;
      if (!needsSw && !needsZh) return block;

      const langs = [];
      if (needsSw) langs.push('sw');
      if (needsZh) langs.push('zh');

      const translations = await Promise.all(
        langs.map((lang) => translateText(String(enContent), lang))
      );

      const updatedData = { ...block.data };
      langs.forEach((lang, i) => {
        if (translations[i]) updatedData[lang] = translations[i];
      });

      return { ...block, data: updatedData };
    })
  );

  return updated;
}

/**
 * Apply translations from translateFields() output back onto a data object,
 * merging into nested localized sub-documents.
 *
 * Handles both patterns used in this CMS:
 *  - localizedTitle, localizedDescription (products, hero, categories)
 *  - title.en/sw/zh (articles, pages — direct nested objects)
 *
 * @param {object} dataObj      The data object to mutate in-place
 * @param {object} translations Result from translateFields()
 * @param {string} fieldPrefix  Prefix to strip, e.g. 'localized' or ''
 */
function applyTranslations(dataObj, translations) {
  for (const [key, langs] of Object.entries(translations)) {
    const target = dataObj[key];
    if (target && typeof target === 'object' && !Array.isArray(target)) {
      // Nested object pattern: dataObj.title.sw = '...'
      for (const [lang, text] of Object.entries(langs)) {
        if (text) target[lang] = text;
      }
    } else {
      // Field directly on dataObj but translations stored as 'localizedXxx'
      // We don't overwrite the plain string field — see service-level wiring
      for (const [lang, text] of Object.entries(langs)) {
        if (text) dataObj[`${key}.${lang}`] = text; // dotted path (Mongoose $set)
      }
    }
  }
}

/**
 * Returns current cache statistics for monitoring/admin UI.
 * @returns {{ size: number, maxSize: number }}
 */
function getCacheStats() {
  return { size: _cache.size, maxSize: TRANSLATION_CACHE_MAX };
}

/**
 * Manually clears the in-memory translation cache.
 * Safe to call at any time; next requests will re-fetch from API.
 */
function clearCache() {
  _cache.clear();
  logger.info('[TranslationService] Translation cache cleared');
}

// ─── Language Detection ──────────────────────────────────────────────────────

/**
 * Detect the language of a text sample using Google Translate API v2.
 * Returns the top detected language code (BCP-47).
 *
 * @param {string} text  Sample text to detect
 * @returns {Promise<string>} Detected language code (e.g. 'en', 'sw', 'zh-CN')
 */
async function detectLanguage(text) {
  if (!text || typeof text !== 'string' || !text.trim()) return 'en';

  const sample = text.trim().slice(0, MAX_TEXT_LENGTH);

  try {
    const client = _getClient();
    const [detections] = await limit(() => client.detect(sample));
    const result = Array.isArray(detections) ? detections[0] : detections;
    return result?.language || 'en';
  } catch (err) {
    logger.warn(`[TranslationService] Language detection failed: ${err.message}`);
    return 'en';
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  /** Translate one English string → { sw, zh } */
  translateCMS,
  /** Translate multiple named fields → { fieldName: { sw, zh } } */
  translateFields,
  /** Translate article/page content blocks */
  translateContentBlocks,
  /** Low-level single text → single lang (Google Translate) */
  translateText,
  /** AI batch translation (all fields in one LLM call) */
  translateFieldsAI,
  /** Apply translation results back onto a data object */
  applyTranslations,
  /** Detect language of a text sample */
  detectLanguage,
  /** Cache stats for monitoring */
  getCacheStats,
  /** Clear the in-memory cache */
  clearCache,
  /** Target language codes */
  TARGET_LANGS,
  /** Block types that get auto-translated */
  TRANSLATABLE_BLOCK_TYPES,
  /** Active translation provider ('google' or 'ai') */
  TRANSLATION_PROVIDER,
};

// MukonoTalks

