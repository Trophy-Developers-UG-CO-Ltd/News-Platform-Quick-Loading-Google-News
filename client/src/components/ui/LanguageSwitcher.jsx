/**
 * LanguageSwitcher - URL-based language switching
 * Changes language by navigating to the equivalent URL with new lang prefix
 * @module components/ui/LanguageSwitcher
 */

import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, LANGUAGE_CONFIG, DEFAULT_LANGUAGE } from '../../i18n';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useParams();
  const currentLang = lang || i18n.language || DEFAULT_LANGUAGE;

  const handleChange = (e) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);

    // Replace language prefix in URL
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0 && SUPPORTED_LANGUAGES.includes(pathSegments[0])) {
      pathSegments[0] = newLang;
    } else {
      pathSegments.unshift(newLang);
    }

    navigate(`/${pathSegments.join('/')}${location.search}`, { replace: true });
  };

  return (
    <div className="relative">
      <select
        value={currentLang}
        onChange={handleChange}
        className="cursor-pointer rounded-[48px] border border-dark-border bg-dark-slate px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
        aria-label="Select language"
      >
        {SUPPORTED_LANGUAGES.map((code) => (
          <option key={code} value={code}>
            {LANGUAGE_CONFIG[code].flag} {LANGUAGE_CONFIG[code].label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;

// MukonoTalks

