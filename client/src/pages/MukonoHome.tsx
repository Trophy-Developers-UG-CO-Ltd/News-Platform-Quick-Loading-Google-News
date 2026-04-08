import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Search,
  X,
  Flame,
  PlayCircle,
  Briefcase,
  BarChart3,
  MessageCircle,
} from 'lucide-react';
import api from '../app/axios';
import ThemeToggle from '../components/ui/ThemeToggle';
import useThemeMode from '../hooks/useThemeMode';

const FALLBACK_IMAGE = 'https://via.placeholder.com/800x500';
const FALLBACK_VIDEO = 'https://www.youtube.com/watch?v=ETOSTwqrFyU';
const TOP_STORY_IMAGE = 'https://i0.wp.com/mbu.ug/wp-content/uploads/2023/08/Bajjo-X-Abtex.webp?resize=800%2C600&ssl=1&w=370';
const WHATSAPP_PHONE = '+256755303076';

const getLocalized = (value: any) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.en || value.sw || value.zh || '';
};

const stripHtml = (value: string = '') =>
  value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getEmbedUrl = (url: string) => {
  if (!url) return FALLBACK_VIDEO;

  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return url;
};

const getArticleImage = (article: any) => article?.featuredImage || FALLBACK_IMAGE;
const getArticleSlug = (article: any) => article?.localizedSlug?.en || '';
const getArticleTitle = (article: any) => getLocalized(article?.title) || 'Untitled story';
const getArticleExcerpt = (article: any) => stripHtml(getLocalized(article?.excerpt)) || 'No summary available.';

const MOBILE_MENU_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'News', to: '/news' },
  { label: 'Entertainment', to: '/entertainment' },
  { label: 'Politics', to: '/local' },
  { label: 'Lifestyle', to: '/entertainment' },
  { label: 'Opportunities', to: '/applications' },
  { label: 'Videos', to: '/videos' },
  { label: 'About', to: '/about' },
  { label: 'Advertise', to: '/advertise' },
  { label: 'Contact', to: '/contact' },
];

const MukonoHome = () => {
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { pathname } = useLocation();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [videoSection, setVideoSection] = useState<any>(null);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [articleSearchResults, setArticleSearchResults] = useState<any[]>([]);
  const [pageSearchResults, setPageSearchResults] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadHomepage = async () => {
      const [heroRes, latestRes, trendingRes, videoRes] = await Promise.allSettled([
        api.get('/hero/active'),
        api.get('/articles', { params: { page: 1, limit: 12 } }),
        api.get('/articles', { params: { page: 1, limit: 8, sort: 'viewCount' } }),
        api.get('/homepage-sections/video'),
      ]);

      if (!mounted) return;

      setHeroSlides(heroRes.status === 'fulfilled' ? (heroRes.value?.data || []) : []);
      setArticles(latestRes.status === 'fulfilled' ? (latestRes.value?.data?.articles || []) : []);
      setTrending(trendingRes.status === 'fulfilled' ? (trendingRes.value?.data?.articles || []) : []);
      setVideoSection(videoRes.status === 'fulfilled' ? (videoRes.value?.data || null) : null);
    };

    loadHomepage();

    return () => {
      mounted = false;
    };
  }, []);

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

  const mainHero = useMemo(() => {
    const activeHero = heroSlides?.[0];
    const leadStory = articles?.[0];

    return {
      title:
        getLocalized(activeHero?.localizedTitle) ||
        activeHero?.title ||
        getArticleTitle(leadStory) ||
        'Major national headline with strong engagement hook',
      category: leadStory?.category?.toUpperCase() || 'NEWS',
      image: TOP_STORY_IMAGE,
      meta: leadStory ? `${new Date(leadStory?.publishedAt || Date.now()).toLocaleDateString('en-UG')} • ${leadStory?.viewCount || 0} views` : 'Top story',
      link: getArticleSlug(leadStory) ? `/news/${getArticleSlug(leadStory)}` : activeHero?.ctaLink || '/news',
    };
  }, [heroSlides, articles]);

  const sideStories = useMemo(() => articles.slice(1, 3), [articles]);
  const trendingStories = useMemo(() => (trending.length ? trending : articles).slice(0, 8), [trending, articles]);
  const feedStories = useMemo(() => (articles.length ? articles : trending).slice(0, 12), [articles, trending]);
  const mostRead = useMemo(() => trendingStories.slice(0, 5), [trendingStories]);

  const featuredVideoUrl = getEmbedUrl(videoSection?.videoUrl || FALLBACK_VIDEO);
  const featuredVideoCaption = videoSection?.videoCaption || 'Featured video headline';
  const videoTiles = (videoSection?.items || []).slice(0, 4);
  const isHomePage = pathname === '/';
  const whatsappHref = useMemo(() => {
    const pageUrl = typeof window !== 'undefined'
      ? window.location.href
      : `https://mukonotalks.ug${pathname}`;
    const pageOrArticleTitle = (mainHero?.title || (typeof document !== 'undefined' ? document.title : '') || 'this page').trim();
    const message = `Hi, I love your articles please, I need your help on ${pageUrl} its about ${pageOrArticleTitle}`;
    const whatsappApiPhone = WHATSAPP_PHONE.replace(/\D/g, '');
    return `https://wa.me/${whatsappApiPhone}?text=${encodeURIComponent(message)}`;
  }, [mainHero?.title, pathname]);

  const handleSearchActivate = () => {
    searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 180);
  };

  const toggleMobilePanel = () => {
    setMobilePanelOpen((current) => !current);
    setSearchError('');
  };

  const closeMobilePanel = () => {
    setMobilePanelOpen(false);
  };

  return (
    <div className="min-h-screen bg-light-body text-text-light-primary dark:bg-dark-charcoal dark:text-text-dark-primary">
      <Helmet>
        <title>MukonoTalks | News, Entertainment, Local Updates</title>
        <meta
          name="description"
          content="MukonoTalks premium homepage for high-traffic news, entertainment, opportunities, and video content with ad-ready placement."
        />
      </Helmet>

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
            <Link to="/applications" className="transition hover:text-white/70">Opportunities</Link>
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
            <button
              type="button"
              onClick={handleSearchActivate}
              className="hidden cursor-pointer hover:text-white/70 md:inline-flex"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
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

      <main>
        <h1 className="sr-only">MukonoTalks Home</h1>

      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search news, topics, videos..."
            className="w-full rounded-2xl border border-dark-border bg-white px-4 py-3 pl-10 text-black outline-none focus:border-black dark:bg-dark-slate dark:text-text-dark-primary dark:focus:border-white"
          />
        </div>
      </div>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 md:grid-cols-3">
        <div className="group relative overflow-hidden rounded-3xl shadow-card md:col-span-2">
          <img src={mainHero.image || FALLBACK_IMAGE} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />

          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-dark-black via-black/40 to-transparent p-6">
            <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold tracking-wide text-black">{mainHero.category}</span>

            <h2 className="text-2xl font-bold leading-tight md:text-3xl">
              <Link to={mainHero.link} className="hover:underline">
                {mainHero.title}
              </Link>
            </h2>

            <p className="mt-2 text-xs text-text-muted">{mainHero.meta}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {sideStories.map((story) => (
            <div key={story._id} className="group relative overflow-hidden rounded-3xl shadow-soft">
              <img src={getArticleImage(story)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />

              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-dark-black to-transparent p-4">
                <span className="w-fit rounded-full bg-white px-2.5 py-1 text-xs font-bold tracking-wide text-black">{(story?.category || 'entertainment').toUpperCase()}</span>
                <h3 className="text-sm font-semibold">
                  <Link to={`/news/${getArticleSlug(story)}`} className="hover:underline">
                    {getArticleTitle(story)}
                  </Link>
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="flex h-24 items-center justify-center rounded-2xl border border-dark-border bg-white text-text-secondary dark:bg-dark-surface dark:text-text-dark-muted">
          Ad Space
        </div>
      </div>

      <section className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="mb-4 flex items-center gap-2">
          <Flame size={18} className="text-black dark:text-white" />
          <h3 className="text-lg font-semibold">Trending Now</h3>
        </div>

        <div className="flex gap-4 overflow-x-auto">
          {trendingStories.map((story) => (
            <div
              key={story._id}
              className="min-w-[220px] overflow-hidden rounded-2xl bg-white shadow-soft transition hover:bg-light-hover hover:shadow-card dark:bg-dark-surface dark:hover:bg-dark-hover"
            >
              <img src={getArticleImage(story)} alt="" className="h-[120px] w-full object-cover" />
              <div className="p-3 text-sm text-text-secondary">
                <Link to={`/news/${getArticleSlug(story)}`} className="hover:text-text-primary">
                  {getArticleTitle(story)}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:grid-cols-3">
        {feedStories.map((story) => (
          <div key={story._id} className="group cursor-pointer animate-fade">
            <div className="overflow-hidden rounded-2xl shadow-soft">
              <img
                src={getArticleImage(story)}
                alt=""
                className="w-full transition duration-500 group-hover:scale-105"
              />
            </div>

            <span className="mt-2 inline-block rounded-full bg-black px-3 py-1 text-xs font-bold tracking-wide text-white dark:bg-white dark:text-black">{(story?.category || 'news').toUpperCase()}</span>

            <h3 className="mt-1 line-clamp-2 font-semibold text-text-primary">
              <Link to={`/news/${getArticleSlug(story)}`} className="hover:underline">
                {getArticleTitle(story)}
              </Link>
            </h3>

            <p className="mt-1 line-clamp-2 text-xs text-text-muted">{getArticleExcerpt(story)}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center gap-2">
          <PlayCircle size={18} className="text-black dark:text-white" />
          <h3 className="text-lg font-semibold">Watch</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-dark-border bg-white p-4 shadow-card dark:bg-dark-surface">
            <iframe
              className="h-64 w-full rounded-xl"
              src={featuredVideoUrl}
              allowFullScreen
              title={featuredVideoCaption || 'Featured MukonoTalks video'}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            />
            <p className="mt-3 text-sm text-text-secondary">{featuredVideoCaption}</p>
            <a
              href={featuredVideoUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-sm font-semibold text-black underline dark:text-white"
            >
              Open video in a new tab
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(videoTiles.length ? videoTiles : trendingStories.slice(0, 4)).map((video: any, i: number) => (
              <div
                key={video?._id || i}
                className="rounded-2xl border border-dark-border bg-white p-2 shadow-soft transition hover:bg-light-hover dark:bg-dark-surface dark:hover:bg-dark-hover"
              >
                <div className="flex h-24 items-center justify-center rounded bg-black px-2 text-center text-white">
                  {video?.title || getArticleTitle(video) || 'Video'}
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-text-secondary">
                  {video?.description || getArticleExcerpt(video) || 'Video title'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center gap-2">
          <Briefcase size={18} className="text-black dark:text-white" />
          <h3 className="text-lg font-semibold">Opportunities</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-dark-border bg-white p-5 shadow-soft transition hover:bg-light-hover dark:bg-dark-surface dark:hover:bg-dark-hover"
            >
              <h4 className="font-semibold">Opportunity Title</h4>
              <p className="mt-2 text-sm text-text-secondary">
                Short description of job or opportunity.
              </p>
              <button type="button" className="mt-3 text-sm font-semibold text-black underline dark:text-white">
                View Details →
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-text-secondary" />
          <h3 className="text-lg font-semibold">Most Read</h3>
        </div>

        <ol className="space-y-3">
          {mostRead.map((story, index) => (
            <li key={story._id} className="cursor-pointer text-text-secondary transition hover:text-text-primary">
              <Link to={`/news/${getArticleSlug(story)}`}>
                {index + 1}. {getArticleTitle(story)}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-10 text-center">
        <div className="rounded-2xl border border-dark-border bg-white p-6 shadow-card dark:bg-dark-surface">
          <div className="mb-2 flex justify-center">
            <MessageCircle size={20} className="text-black dark:text-white" />
          </div>

          <h3 className="text-lg font-semibold">Inquire</h3>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-xl bg-black px-6 py-2 font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-black"
          >
            Join Now
          </a>
        </div>
      </section>

      </main>

    </div>
  );
};

export default MukonoHome;
// Designed by Trophy Developers Uganda : https://www.trophydevelopers.com/uganda-web-designers/
