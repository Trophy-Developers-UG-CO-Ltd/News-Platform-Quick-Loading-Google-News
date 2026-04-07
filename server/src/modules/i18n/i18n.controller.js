/**
 * i18n Language Resolver Controller
 * ====================================
 * Resolves the appropriate display language for each request using a strict
 * priority chain that respects explicit user choices above all else:
 *
 *   1. URL lang param or query (?lang=sw, /sw/...)
 *   2. Cookie `lang` — saved user preference
 *   3. CF-IPCountry header — Cloudflare country detection (edge, zero latency)
 *   4. Accept-Language request header
 *   5. Default: 'en'
 *
 * Country→Language targeting:
 *   Uganda (UG)       → English (en)
 *   Kenya (KE)        → Kiswahili (sw)
 *   Tanzania (TZ)     → Kiswahili (sw)
 *   China (CN)        → Chinese (zh)
 *   (+ other East African and CJK regions)
 *
 * @module modules/i18n/i18n.controller
 */

'use strict';

// ─── Constants ────────────────────────────────────────────────────────────────

const SUPPORTED_LANGS = ['en', 'sw', 'zh'];
const DEFAULT_LANG = 'en';

/**
 * ISO 3166-1 alpha-2 country → BCP-47 language code mapping.
 * Covers the primary African business markets and Chinese-speaking regions.
 */
const COUNTRY_LANGUAGE_MAP = {
  // English-primary countries (Uganda, plus shared Africa/global markets)
  UG: 'en', // Uganda
  ZA: 'en', // South Africa
  NG: 'en', // Nigeria
  GH: 'en', // Ghana
  ZW: 'en', // Zimbabwe
  ZM: 'en', // Zambia
  MW: 'en', // Malawi
  BW: 'en', // Botswana
  NA: 'en', // Namibia
  SL: 'en', // Sierra Leone
  LR: 'en', // Liberia
  GM: 'en', // Gambia
  ET: 'en', // Ethiopia (English official)
  US: 'en', // United States
  GB: 'en', // United Kingdom
  AU: 'en', // Australia
  CA: 'en', // Canada
  IN: 'en', // India

  // Kiswahili-primary countries (Kenya, Tanzania, + Great Lakes region)
  KE: 'sw', // Kenya
  TZ: 'sw', // Tanzania
  RW: 'sw', // Rwanda (Swahili recent official)
  BI: 'sw', // Burundi
  CD: 'sw', // DR Congo (Eastern region)

  // Chinese-speaking regions
  CN: 'zh', // China (Mainland)
  TW: 'zh', // Taiwan
  HK: 'zh', // Hong Kong
  MO: 'zh', // Macau
  SG: 'zh', // Singapore (Chinese majority)
};

// ─── Core language resolver ────────────────────────────────────────────────────

/**
 * Resolve the best language for a request, returning result + source metadata.
 * Never throws — always returns a valid lang with a source identifier.
 *
 * @param {import('express').Request} req
 * @returns {{ language: string, source: string, country: string|null }}
 */
function resolveLanguage(req) {
  // ── 1. Explicit URL param or query string ─────────────────────────────────
  const urlLang = req.params?.lang || req.query?.lang;
  if (SUPPORTED_LANGS.includes(urlLang)) {
    return { language: urlLang, source: 'url', country: null };
  }

  // ── 2. Cookie preference (user explicitly chose a language) ───────────────
  const cookieLang = req.cookies?.lang;
  if (SUPPORTED_LANGS.includes(cookieLang)) {
    return { language: cookieLang, source: 'cookie', country: null };
  }

  // ── 3. Cloudflare edge country header (zero-latency, very accurate) ───────
  const cfCountry = (req.headers['cf-ipcountry'] || '').toUpperCase();
  if (cfCountry && cfCountry !== 'XX' && COUNTRY_LANGUAGE_MAP[cfCountry]) {
    return {
      language: COUNTRY_LANGUAGE_MAP[cfCountry],
      source: 'ip',
      country: cfCountry,
    };
  }

  // ── 4. Accept-Language header (browser negotiated) ────────────────────────
  const acceptLang = (req.headers['accept-language'] || '').toLowerCase();
  if (acceptLang) {
    // Parse quality-sorted language tags
    const tags = acceptLang
      .split(',')
      .map((tag) => {
        const [lang, q] = tag.trim().split(';q=');
        return { lang: lang.trim(), q: parseFloat(q || '1') };
      })
      .sort((a, b) => b.q - a.q);

    for (const { lang } of tags) {
      if (lang.startsWith('zh')) return { language: 'zh', source: 'header', country: null };
      if (lang.startsWith('sw')) return { language: 'sw', source: 'header', country: null };
      if (lang.startsWith('en')) return { language: 'en', source: 'header', country: null };
    }
  }

  // ── 5. Default ────────────────────────────────────────────────────────────
  return { language: DEFAULT_LANG, source: 'default', country: null };
}

// ─── HTTP handler ─────────────────────────────────────────────────────────────

/**
 * GET /api/i18n/resolve
 *
 * Returns the resolved language + detection source for this request.
 * Frontend calls this once on first visit to determine the target language path.
 *
 * Response shape:
 * {
 *   success: true,
 *   country: "KE" | null,
 *   language: "sw",
 *   source: "ip" | "cookie" | "url" | "header" | "default",
 *   supported: ["en", "sw", "zh"]
 * }
 */
const resolve = (req, res) => {
  const { language, source, country } = resolveLanguage(req);

  // Opportunistically set a 24-hour cookie so the browser remembers (if not already set)
  // Only set when we have a confident signal (ip or header), not on default fallback
  if (source === 'ip' && !req.cookies?.lang) {
    res.cookie('lang', language, {
      maxAge: 24 * 60 * 60 * 1000, // 24 h — soft suggestion, user can override
      httpOnly: false,              // Readable by JS so frontend can sync
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  res.json({
    success: true,
    country,
    language,
    source,
    supported: SUPPORTED_LANGS,
  });
};

module.exports = {
  resolve,
  resolveLanguage,
  COUNTRY_LANGUAGE_MAP,
  SUPPORTED_LANGS,
  DEFAULT_LANG,
};

// MukonoTalks

