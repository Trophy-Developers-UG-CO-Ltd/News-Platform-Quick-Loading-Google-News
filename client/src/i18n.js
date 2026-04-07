/**
 * i18n configuration
 * MukonoTalks multilingual support
 * Languages: English (default), Chinese (Mandarin), Swahili
 * Path-based language detection for SEO (/en, /zh, /sw)
 * 
 * @module i18n
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import zh from './locales/zh.json';
import sw from './locales/sw.json';

const resources = {
  en: { translation: en },
  zh: { translation: zh },
  sw: { translation: sw },
};

export const SUPPORTED_LANGUAGES = ['en', 'zh', 'sw'];
export const DEFAULT_LANGUAGE = 'en';

export const LANGUAGE_CONFIG = {
  en: { label: 'English', flag: '🇬🇧', dir: 'ltr', hreflang: 'en' },
  zh: { label: '中文', flag: '🇨🇳', dir: 'ltr', hreflang: 'zh' },
  sw: { label: 'Kiswahili', flag: '🇰🇪', dir: 'ltr', hreflang: 'sw' },
};

/**
 * Custom path-based language detector
 * Detects language from URL path prefix: /en/..., /zh/..., /sw/...
 */
const pathLanguageDetector = {
  name: 'path',
  lookup() {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0 && SUPPORTED_LANGUAGES.includes(segments[0])) {
      return segments[0];
    }
    return undefined;
  },
  cacheUserLanguage(lng) {
    localStorage.setItem('mukonoTalksLang', lng);
  },
};

const languageDetectorInstance = new LanguageDetector();
languageDetectorInstance.addDetector(pathLanguageDetector);

i18n
  .use(languageDetectorInstance)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['path', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
      lookupLocalStorage: 'mukonoTalksLang',
      lookupCookie: 'lang',
      cookieOptions: { path: '/', sameSite: 'lax' },
    },
    react: {
      useSuspense: false,
    },
    ...(import.meta.env?.DEV && {
      saveMissing: true,
      missingKeyHandler(lngs, ns, key, fallbackValue) {
        console.warn(
          `[i18n] Missing translation key: "${key}" for lang(s): ${lngs.join(', ')} — falling back to: "${fallbackValue}"`
        );
      },
    }),
  });

/**
 * Helper: Get localized path
 * Prepends language prefix to a path
 */
export const getLocalizedPath = (path, lang) => {
  const language = lang || i18n.language || DEFAULT_LANGUAGE;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/${language}${cleanPath}`;
};

/**
 * Helper: Strip language prefix from path
 */
export const stripLanguagePrefix = (path) => {
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0 && SUPPORTED_LANGUAGES.includes(segments[0])) {
    return '/' + segments.slice(1).join('/');
  }
  return path;
};

/**
 * Helper: Get current language from path
 */
export const getLanguageFromPath = (path) => {
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0 && SUPPORTED_LANGUAGES.includes(segments[0])) {
    return segments[0];
  }
  return DEFAULT_LANGUAGE;
};

export default i18n;

// MukonoTalks

