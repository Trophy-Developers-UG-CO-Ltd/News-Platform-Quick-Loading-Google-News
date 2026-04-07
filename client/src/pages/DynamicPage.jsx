/**
 * Dynamic CMS Page
 * Renders database-driven pages with block-based content
 * SEO metadata injection via react-helmet-async
 * Language fallback to English when translation missing
 * @module pages/DynamicPage
 */

import React, { useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
import BlockRenderer from '../features/pages/BlockRenderer';
import usePage from '../features/pages/usePage';
import Spinner from '../components/ui/Spinner';
import Reveal from '../components/ui/Reveal';

const LANG_LABELS = {
  en: { label: 'English', flag: '🇬🇧' },
  zh: { label: '中文', flag: '🇨🇳' },
  sw: { label: 'Kiswahili', flag: '🇰🇪' },
};

const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://mukonotalks.ug';

const DynamicPage = () => {
  const { lang = 'en', slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isAdminPreview = searchParams.get('preview') === '1' && (user?.role === 'admin' || user?.role === 'developer');
  const { page, isLoading, error, redirectTo } = usePage(lang, slug, isAdminPreview);

  // Silently follow server-side 301 redirects inside the SPA.
  // Replaces the history entry so the old URL never appears in Back navigation.
  useEffect(() => {
    if (redirectTo) {
      navigate(redirectTo, { replace: true });
    }
  }, [redirectTo, navigate]);

  // Show nothing while redirect is resolving
  if (redirectTo) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-gray-600 mb-8">Page not found.</p>
        <Link to="/" className="btn-primary px-6 py-2">
          Back to Home
        </Link>
      </div>
    );
  }

  // Draft preview banner (shown only when admin is previewing a non-published page)
  const draftBanner = isAdminPreview && page.publishStatus !== 'published' ? (
    <div className="sticky top-0 z-50 bg-amber-400 text-amber-900 text-sm font-semibold text-center py-2 px-4 shadow">
      ⚠️ Draft Preview — this page is not yet published.
      <a
        href={`/admin/pages`}
        className="ml-3 underline hover:no-underline"
      >
        Back to Pages
      </a>
    </div>
  ) : null;

  // Build canonical and hreflang URLs
  const canonicalUrl = `${BASE_URL}/${lang}/${page.slug}`;
  const hreflangs = (page.availableLangs || []).map((l) => ({
    lang: l,
    url: `${BASE_URL}/${l}/${page.availableSlugs?.[l] || page.slug}`,
  }));

  // Resolve SEO values with OG fallbacks
  const seo = page.seo || {};
  const metaTitle       = seo.title       || page.title || '';
  const metaDescription = seo.description || '';
  const resolvedCanonical = seo.canonicalUrl || canonicalUrl;
  const ogTitle         = seo.ogTitle       || metaTitle;
  const ogDescription   = seo.ogDescription || metaDescription;
  const ogImage         = seo.ogImage       || '';

  return (
    <>
      {draftBanner}
      {/* SEO Metadata */}
      <Helmet>
        <title>{metaTitle} | MukonoTalks</title>
        {metaDescription && <meta name="description" content={metaDescription} />}
        {seo.keywords    && <meta name="keywords"    content={seo.keywords} />}
        <link rel="canonical" href={resolvedCanonical} />
        {hreflangs.map((hl) => (
          <link key={hl.lang} rel="alternate" hrefLang={hl.lang} href={hl.url} />
        ))}
        {/* Open Graph */}
        <meta property="og:type"        content="website" />
        <meta property="og:title"       content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url"         content={resolvedCanonical} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        {/* Twitter Card */}
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
        {/* JSON-LD Structured Data */}
        {(page.schemas || []).map((schema, i) => (
          <script key={i} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
      </Helmet>

      {/* Language Switcher — contextual for this page */}
      {page.availableLangs && page.availableLangs.length > 1 && (
        <div className="container mx-auto px-4 pt-4 flex justify-end">
          <div className="flex gap-2">
            {page.availableLangs.map((l) => {
              const langSlug = page.availableSlugs?.[l] || slug;
              return (
                <button
                  key={l}
                  onClick={() => navigate(`/${l}/${langSlug}`)}
                  className={`px-3 py-1 text-sm border transition-colors ${
                    l === lang
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                  }`}
                >
                  {LANG_LABELS[l]?.flag} {LANG_LABELS[l]?.label || l}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Page Content */}
      <Reveal variant="fade-up">
      <BlockRenderer blocks={page.contentBlocks} />
      </Reveal>
    </>
  );
};

export default DynamicPage;

// MukonoTalks

