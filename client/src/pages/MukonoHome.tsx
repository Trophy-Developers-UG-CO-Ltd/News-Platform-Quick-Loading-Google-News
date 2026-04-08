import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Search,
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
const FALLBACK_VIDEO = 'https://www.youtube.com/embed/dQw4w9WgXcQ';

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

const MukonoHome = () => {
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { pathname } = useLocation();
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [videoSection, setVideoSection] = useState<any>(null);

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
      image: activeHero?.largeImage || activeHero?.mobileImage || getArticleImage(leadStory),
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

          <div className="flex items-center gap-4 text-white">
            <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
            <button type="button" className="cursor-pointer hover:text-white/70" aria-label="Search">
              <Search size={18} />
            </button>
            <button type="button" className="cursor-pointer hover:text-white/70" aria-label="Trending">
              <Flame size={18} />
            </button>
          </div>
        </div>

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

          <h3 className="text-lg font-semibold">Join our WhatsApp Channel</h3>

          <button
            type="button"
            className="mt-4 rounded-xl bg-black px-6 py-2 font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-black"
          >
            Join Now
          </button>
        </div>
      </section>

      </main>

      <footer className="mt-10 border-t border-dark-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col justify-between px-4 py-6 text-sm text-text-muted md:flex-row">
          <p>© Mukono Talks</p>

          <div className="flex gap-4">
            <Link to="/about" className="hover:text-text-primary">About</Link>
            <Link to="/advertise" className="hover:text-text-primary">Advertise</Link>
            <Link to="/contact" className="hover:text-text-primary">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MukonoHome;
// Designed by Trophy Developers Uganda : https://www.trophydevelopers.com/uganda-web-designers/
