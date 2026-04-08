import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, X, Flame } from 'lucide-react';
import api from '../../app/axios';
import ThemeToggle from '../ui/ThemeToggle';
import useThemeMode from '../../hooks/useThemeMode';

const getLocalized = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.en || value.sw || value.zh || '';
};

const stripHtml = (value = '') =>
  value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getArticleSlug = (article) => article?.localizedSlug?.en || '';
const getArticleTitle = (article) => getLocalized(article?.title) || 'Untitled story';
const getArticleExcerpt = (article) => stripHtml(getLocalized(article?.excerpt)) || 'No summary available.';

const MOBILE_MENU_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'News', to: '/news' },
  { label: 'Entertainment', to: '/entertainment' },
  { label: 'Politics', to: '/local' },
  { label: 'Lifestyle', to: '/entertainment' },
  { label: 'Videos', to: '/videos' },
  { label: 'About', to: '/about' },
  { label: 'Advertise', to: '/advertise' },
  { label: 'Contact', to: '/contact' },
];

const PremiumSiteHeader = () => {
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { pathname } = useLocation();
  const mobileSearchInputRef = useRef(null);

  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [articleSearchResults, setArticleSearchResults] = useState([]);
  const [pageSearchResults, setPageSearchResults] = useState([]);

  const isHomePage = pathname === '/';

  useEffect(() => {
    if (!mobilePanelOpen) return;
    const timeoutId = window.setTimeout(() => {
      mobileSearchInputRef.current?.focus();
    }, 130);
    return () => window.clearTimeout(timeoutId);
  }, [mobilePanelOpen]);

  useEffect(() => {
    const trimmed = searchTerm.trim();

    if (!mobilePanelOpen || trimmed.length < 2) {
      setSearchLoading(false);
      setSearchError('');
      setArticleSearchResults([]);
      setPageSearchResults([]);
      return;
    }

    const requestId = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError('');

      try {
        const [articleRes, pageRes] = await Promise.all([
          api.get('/articles', {
            params: { search: trimmed, page: 1, limit: 6, sort: 'publishedAt' },
          }),
          api.get('/pages/search', {
            params: { query: trimmed, lang: 'en', limit: 5 },
          }),
        ]);

        setArticleSearchResults(Array.isArray(articleRes?.data?.articles) ? articleRes.data.articles : []);
        setPageSearchResults(Array.isArray(pageRes?.data?.pages) ? pageRes.data.pages : []);
      } catch (_error) {
        setSearchError('Search is temporarily unavailable. Please try again.');
        setArticleSearchResults([]);
        setPageSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 260);

    return () => window.clearTimeout(requestId);
  }, [searchTerm, mobilePanelOpen]);

  const toggleMobilePanel = () => {
    setMobilePanelOpen((current) => !current);
    setSearchError('');
  };

  const closeMobilePanel = () => {
    setMobilePanelOpen(false);
  };

  const desktopSearchHref = useMemo(() => '/news', []);

  return (
    <header className="sticky top-0 z-50 border-b border-black bg-black/95 text-white backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
        {isHomePage ? (
          <span className="text-xl font-black tracking-widest text-white" aria-label="Mukono Talks home">
            MUKONO TALKS
          </span>
        ) : (
          <Link to="/" className="text-xl font-black tracking-widest text-white" aria-label="Mukono Talks home">
            MUKONO TALKS
          </Link>
        )}

        <nav className="hidden gap-6 text-sm font-bold text-white md:flex" aria-label="Primary">
          {isHomePage ? (
            <span aria-current="page" className="text-white/80">Home</span>
          ) : (
            <Link to="/" className="transition hover:text-white/70">Home</Link>
          )}
          <Link to="/news" className="transition hover:text-white/70">News</Link>
          <Link to="/entertainment" className="transition hover:text-white/70">Entertainment</Link>
          <Link to="/local" className="transition hover:text-white/70">Politics</Link>
          <Link to="/entertainment" className="transition hover:text-white/70">Lifestyle</Link>
          <Link to="/videos" className="transition hover:text-white/70">Videos</Link>
        </nav>

        <div className="flex items-center gap-2 text-white md:gap-4">
          <button
            type="button"
            onClick={toggleMobilePanel}
            className={`order-2 inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border transition md:hidden ${isDarkMode ? 'border-white/25 bg-black/45' : 'border-black/15 bg-[#ffffff]'}`}
            aria-label="Open menu and search"
          >
            {mobilePanelOpen ? (
              <X className={`h-6 w-6 ${isDarkMode ? 'text-brand-white' : 'text-black'}`} />
            ) : (
              <img
                src={isDarkMode ? '/menuSearchWhiteIcon.svg' : '/menuSearchBlack.svg'}
                alt=""
                className="h-6 w-6"
              />
            )}
          </button>
          <div className="order-1">
            <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} compactOnMobile />
          </div>
          <Link
            to={desktopSearchHref}
            className="hidden cursor-pointer hover:text-white/70 md:inline-flex"
            aria-label="Search"
          >
            <Search size={18} />
          </Link>
          <button type="button" className="hidden cursor-pointer hover:text-white/70 md:inline-flex" aria-label="Trending">
            <Flame size={18} />
          </button>
        </div>
      </div>

      {mobilePanelOpen && (
        <div className="border-t border-white/10 bg-gradient-to-b from-black via-black/95 to-black/90 px-4 pb-5 pt-3 md:hidden">
          <div className="mx-auto w-full max-w-7xl">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/95 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-black/8 blur-2xl" aria-hidden="true" />

              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  ref={mobileSearchInputRef}
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search articles and page content..."
                  className="w-full rounded-2xl border border-black/15 bg-white px-4 py-3 pl-10 text-sm font-medium text-black outline-none ring-0 transition focus:border-black"
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                <span>Menu</span>
                <span className="text-right">Discover</span>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                {MOBILE_MENU_LINKS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeMobilePanel}
                    className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-semibold text-black transition hover:bg-black hover:text-brand-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {searchTerm.trim().length >= 2 && (
                <div className="mt-4 rounded-2xl border border-black/10 bg-black/[0.03] p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-700">Search Results</p>

                  {searchLoading && <p className="text-sm text-gray-700">Searching...</p>}

                  {!searchLoading && searchError && (
                    <p className="text-sm text-red-600">{searchError}</p>
                  )}

                  {!searchLoading && !searchError && articleSearchResults.length === 0 && pageSearchResults.length === 0 && (
                    <p className="text-sm text-gray-700">No results found for this keyword.</p>
                  )}

                  {!searchLoading && !searchError && pageSearchResults.length > 0 && (
                    <div className="mb-3 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Pages</p>
                      {pageSearchResults.map((page) => (
                        <Link
                          key={page._id || page.pageKey || page.slug}
                          to={`/${page.slug || page.pageKey}`}
                          onClick={closeMobilePanel}
                          className="block rounded-xl border border-black/10 bg-white px-3 py-2 transition hover:bg-black hover:text-brand-white"
                        >
                          <p className="line-clamp-1 text-sm font-semibold">{page.title || page.pageKey || 'Page'}</p>
                          {!!page.excerpt && <p className="line-clamp-1 text-xs opacity-80">{page.excerpt}</p>}
                        </Link>
                      ))}
                    </div>
                  )}

                  {!searchLoading && !searchError && articleSearchResults.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Articles</p>
                      {articleSearchResults.map((story) => (
                        <Link
                          key={story._id}
                          to={`/news/${getArticleSlug(story)}`}
                          onClick={closeMobilePanel}
                          className="block rounded-xl border border-black/10 bg-white px-3 py-2 transition hover:bg-black hover:text-brand-white"
                        >
                          <p className="line-clamp-1 text-sm font-semibold">{getArticleTitle(story)}</p>
                          <p className="line-clamp-1 text-xs opacity-80">{getArticleExcerpt(story)}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="home-trending-ticker border-t border-white/10 bg-black px-4 py-2 text-xs text-white/75">
        <div className="home-trending-ticker__fade" aria-hidden="true" />
        <p className="home-trending-ticker__track" aria-label="Trending headlines">
          <span className="home-trending-ticker__content">
            Trending: Politics update • Celebrity news • Jobs released • Campus trends • Business stories
          </span>
        </p>
        <div className="home-trending-ticker__fade home-trending-ticker__fade--right" aria-hidden="true" />
      </div>
    </header>
  );
};

export default PremiumSiteHeader;
