/**
 * usePage hook
 * Fetches a CMS page by language and slug
 * Handles language fallback to English
 * @module features/pages/usePage
 */

import { useState, useEffect, useCallback } from 'react';
import pageService from './pageService';
import api from '../../app/axios';

const SUPPORTED_LANGS = ['en', 'zh', 'sw'];

/**
 * @param {string} lang - Language code
 * @param {string} slug - Page slug
 * @param {boolean} [isPreview=false] - When true, uses admin preview endpoint (returns drafts)
 * @returns {{ page, isLoading, error, refetch }}
 */
const usePage = (lang, slug, isPreview = false) => {
  const [page,       setPage]       = useState(null);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState(null);
  const [redirectTo, setRedirectTo] = useState(null);

  const safeLang = SUPPORTED_LANGS.includes(lang) ? lang : 'en';

  const fetchPage = useCallback(async () => {
    if (!slug) return;

    setIsLoading(true);
    setError(null);
    setRedirectTo(null);

    try {
      if (isPreview) {
        // Admin preview: fetch regardless of publish status, no language fallback needed
        const data = await pageService.previewPage(safeLang, slug);
        setPage(data.page);
        return;
      }

      const data = await pageService.getPublicPage(safeLang, slug);
      setPage(data.page);
    } catch (err) {
      // If non-English fails, try English fallback first
      if (safeLang !== 'en' && err.response?.status === 404) {
        try {
          const fallbackData = await pageService.getPublicPage('en', slug);
          setPage(fallbackData.page);
          return;
        } catch {
          // English fallback also failed — fall through to redirect check
        }
      }

      // On 404, check if the admin created a redirect for this old URL.
      // This handles the case where a page slug was renamed in the CMS:
      // the user/nav link still points to the old path, but the server has
      // an approved 301 redirect mapping old → new.
      if (err.response?.status === 404) {
        try {
          const fromPath = `/${safeLang}/${slug}`;
          const { data: rData } = await api.get('/redirects/resolve', {
            params: { from: fromPath },
          });
          if (rData?.redirect?.toPath) {
            // Fire-and-forget click tracking so redirect analytics stay accurate
            api.post('/redirects/track', { fromPath }).catch(() => {});
            setRedirectTo(rData.redirect.toPath);
            return;
          }
        } catch {
          // Redirect lookup failed — fall through to normal 404 UI
        }
      }

      setError(err.response?.data?.message || 'Page not found');
      setPage(null);
    } finally {
      setIsLoading(false);
    }
  }, [safeLang, slug, isPreview]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  return { page, isLoading, error, redirectTo, refetch: fetchPage };
};

export default usePage;

// MukonoTalks

