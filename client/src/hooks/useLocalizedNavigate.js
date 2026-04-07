/**
 * useLocalizedNavigate - Language-aware navigation hook
 * @module hooks/useLocalizedNavigate
 */

import { useNavigate, useParams } from 'react-router-dom';
import { useCallback } from 'react';
import { DEFAULT_LANGUAGE } from '../i18n';

const useLocalizedNavigate = () => {
  const navigate = useNavigate();
  const { lang } = useParams();
  const currentLang = lang || DEFAULT_LANGUAGE;

  const localizedNavigate = useCallback(
    (to, options) => {
      if (typeof to === 'string') {
        // Don't prefix admin routes or external URLs
        if (to.startsWith('/admin') || to.startsWith('http')) {
          return navigate(to, options);
        }
        const cleanPath = to.startsWith('/') ? to : `/${to}`;
        return navigate(`/${currentLang}${cleanPath}`, options);
      }
      return navigate(to, options);
    },
    [navigate, currentLang]
  );

  return localizedNavigate;
};

export default useLocalizedNavigate;

// MukonoTalks

