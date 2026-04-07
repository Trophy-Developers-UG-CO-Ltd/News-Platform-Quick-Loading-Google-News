/**
 * Language Router - wraps all routes with /:lang prefix
 * Handles language-based routing, redirection, and hreflang tags
 * @module components/i18n/LanguageRouter
 */

import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, LANGUAGE_CONFIG } from '../../i18n';

const LanguageRouter = () => {
  const { lang } = useParams();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If lang param is valid and different from current, switch language
    if (lang && SUPPORTED_LANGUAGES.includes(lang)) {
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang);
      }
      document.documentElement.lang = lang;
      document.documentElement.dir = LANGUAGE_CONFIG[lang]?.dir || 'ltr';
    } else if (lang && !SUPPORTED_LANGUAGES.includes(lang)) {
      // Invalid language code — redirect to default
      const restPath = location.pathname.replace(`/${lang}`, '') || '/';
      navigate(`/${DEFAULT_LANGUAGE}${restPath}${location.search}`, { replace: true });
    }
  }, [lang, i18n, navigate, location]);

  // Generate hreflang URLs for all supported languages
  const baseUrl = window.location.origin;
  const pathWithoutLang = location.pathname.replace(`/${lang}`, '') || '/';

  return (
    <>
      <Helmet>
        {/* Hreflang tags for all supported languages */}
        {SUPPORTED_LANGUAGES.map((code) => (
          <link
            key={code}
            rel="alternate"
            hrefLang={LANGUAGE_CONFIG[code].hreflang}
            href={`${baseUrl}/${code}${pathWithoutLang}`}
          />
        ))}
        <link
          rel="alternate"
          hrefLang="x-default"
          href={`${baseUrl}/${DEFAULT_LANGUAGE}${pathWithoutLang}`}
        />
        <meta property="og:locale" content={lang === 'zh' ? 'zh_CN' : lang === 'sw' ? 'sw_KE' : 'en_ZA'} />
        {SUPPORTED_LANGUAGES.filter(c => c !== lang).map((code) => (
          <meta
            key={code}
            property="og:locale:alternate"
            content={code === 'zh' ? 'zh_CN' : code === 'sw' ? 'sw_KE' : 'en_ZA'}
          />
        ))}
      </Helmet>
      <Outlet />
    </>
  );
};

export default LanguageRouter;

// MukonoTalks

