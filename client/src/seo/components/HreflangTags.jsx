/**
 * HreflangTags
 * Injects <link rel="alternate" hreflang="X"> tags for all supported languages
 * (en, sw, zh) based on the current page path.
 *
 * Replaces the first path segment when it is a language code, or prepends the
 * lang code when no language prefix is present.
 *
 * Usage:
 *   <HreflangTags />                  -- auto-detects path
 *   <HreflangTags path="/news/mukono-market-update" />  -- explicit path (no lang prefix)
 *   <HreflangTags baseUrl="https://example.com" />
 *
 * @module seo/components/HreflangTags
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { SUPPORTED_LANGUAGES, LANGUAGE_CONFIG } from '../../i18n';

const DEFAULT_BASE_URL =
  import.meta.env.VITE_PUBLIC_URL?.replace(/\/$/, '') ||
  (typeof window !== 'undefined' ? window.location.origin : '');

/**
 * Strips the leading language segment from a pathname, if present.
 * "/en/products/foo" → "/products/foo"
 * "/products/foo"   → "/products/foo"
 */
function stripLangPrefix(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length > 0 && SUPPORTED_LANGUAGES.includes(parts[0])) {
    return '/' + parts.slice(1).join('/');
  }
  return pathname;
}

const HreflangTags = ({ path: propPath, baseUrl = DEFAULT_BASE_URL }) => {
  const location = useLocation();
  const cleanPath = stripLangPrefix(propPath ?? location.pathname);

  return (
    <Helmet>
      {/* x-default points to the English (canonical) version */}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${baseUrl}/en${cleanPath}`}
      />
      {SUPPORTED_LANGUAGES.map((lang) => (
        <link
          key={lang}
          rel="alternate"
          hrefLang={LANGUAGE_CONFIG[lang].hreflang}
          href={`${baseUrl}/${lang}${cleanPath}`}
        />
      ))}
    </Helmet>
  );
};

export default HreflangTags;

// MukonoTalks

