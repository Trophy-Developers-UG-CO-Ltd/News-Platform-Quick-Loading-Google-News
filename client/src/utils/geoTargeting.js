/**
 * Geo-Targeting Utility
 * Detects user's country and maps to appropriate language.
 *
 * Detection uses the backend /api/i18n/resolve endpoint which reads:
 *   - CF-IPCountry header (Cloudflare edge, zero latency)
 *   - Accept-Language header
 *   - Any saved cookie preference
 *
 * Country → Language mappings (authoritative list in backend):
 *   Uganda (UG)       → English (en)
 *   Kenya (KE)        → Kiswahili (sw)
 *   Tanzania (TZ)     → Kiswahili (sw)
 *   China (CN)        → Chinese (zh)
 *   Default           → English (en)
 *
 * @module utils/geoTargeting
 */

import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../i18n';

// ─── Storage keys ─────────────────────────────────────────────────────────────
const GEO_DETECTED_KEY  = 'mukonoTalksGeoDetected';
const GEO_COUNTRY_KEY   = 'mukonoTalksCountry';
const LANG_COOKIE_NAME  = 'lang';
const LANG_STORAGE_KEY  = 'mukonoTalksLang';

// ─── Cookie helpers ───────────────────────────────────────────────────────────

/**
 * Set a cookie that the language middleware can read server-side.
 * 30-day TTL — user preference persists across sessions.
 *
 * @param {string} lang
 */
export const setLangCookie = (lang) => {
  if (!SUPPORTED_LANGUAGES.includes(lang)) return;
  const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
  document.cookie = `${LANG_COOKIE_NAME}=${lang}; max-age=${maxAge}; path=/; samesite=lax`;
};

/**
 * Read the lang cookie.
 * @returns {string|null}
 */
export const getLangCookie = () => {
  const match = document.cookie.match(/(?:^|;\s*)lang=([^;]+)/);
  return match ? match[1] : null;
};

// ─── Saved language preference ────────────────────────────────────────────────

/**
 * Persist language choice in both cookie and localStorage so both
 * the backend resolver and the frontend i18n detector find it.
 *
 * @param {string} lang
 */
export const saveLanguagePreference = (lang) => {
  if (!SUPPORTED_LANGUAGES.includes(lang)) return;
  localStorage.setItem(LANG_STORAGE_KEY, lang);
  setLangCookie(lang);
};

/**
 * Get saved language preference (cookie first, then localStorage).
 * @returns {string|null}
 */
export const getSavedLanguage = () => {
  const cookie = getLangCookie();
  if (cookie && SUPPORTED_LANGUAGES.includes(cookie)) return cookie;
  const ls = localStorage.getItem(LANG_STORAGE_KEY);
  if (ls && SUPPORTED_LANGUAGES.includes(ls)) return ls;
  return null;
};

// ─── Backend geo detection ────────────────────────────────────────────────────

/**
 * Fetch resolved language from the backend /api/i18n/resolve endpoint.
 * The backend uses the Cloudflare CF-IPCountry header for accurate, fast
 * country detection — no external IP API calls needed.
 *
 * Falls back to DEFAULT_LANGUAGE on any network error.
 *
 * @returns {Promise<{ country: string|null, countryCode: string|null, language: string, source: string }>}
 */
export const detectUserGeo = async () => {
  // Check session cache first to avoid duplicate requests in the same session
  const cached = sessionStorage.getItem(GEO_COUNTRY_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch { /* invalid cache */ }
  }

  try {
    const apiBase = import.meta.env?.VITE_API_URL || '/api';
    const response = await fetch(`${apiBase}/i18n/resolve`, {
      credentials: 'include', // Send cookies so the backend sees any saved lang cookie
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        const result = {
          country: data.country || null,
          countryCode: data.country || null,
          language: data.language || DEFAULT_LANGUAGE,
          source: data.source || 'default',
        };
        sessionStorage.setItem(GEO_COUNTRY_KEY, JSON.stringify(result));
        return result;
      }
    }
  } catch (error) {
    console.warn('[GeoTargeting] Backend resolve failed:', error.message);
  }

  return {
    country: null,
    countryCode: null,
    language: DEFAULT_LANGUAGE,
    source: 'default',
  };
};

// ─── First-visit detection ────────────────────────────────────────────────────

/**
 * Check if this is the user's first visit (no language preference set).
 * @returns {boolean}
 */
export const isFirstVisit = () => {
  return !getSavedLanguage() && !localStorage.getItem(GEO_DETECTED_KEY);
};

/**
 * Mark that geo detection has been performed for this session.
 */
export const markGeoDetected = () => {
  localStorage.setItem(GEO_DETECTED_KEY, 'true');
};

/**
 * Clear geo detection flags (for testing).
 */
export const clearGeoData = () => {
  localStorage.removeItem(GEO_DETECTED_KEY);
  sessionStorage.removeItem(GEO_COUNTRY_KEY);
};

// MukonoTalks


