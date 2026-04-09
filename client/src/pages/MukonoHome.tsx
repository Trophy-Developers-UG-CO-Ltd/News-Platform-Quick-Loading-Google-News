import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const MukonoHome = () => {
  const { pathname } = useLocation();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [videoSection, setVideoSection] = useState<any>(null);
  const [opportunitiesSection, setOpportunitiesSection] = useState<any>(null);
  const [inquirySection, setInquirySection] = useState<any>(null);

  // REAL API: Fetch homepage data
  useEffect(() => {
    fetch("/api/v1/home")
      .then((res) => res.json())
      .then((data) => {
        setHeroSlides(data.heroSlides || []);
        setArticles(data.articles || []);
        setTrending(data.trending || []);
        setVideoSection(data.videoSection || null);
        setOpportunitiesSection(data.opportunitiesSection || null);
        setInquirySection(data.inquirySection || null);
      })
      .catch(() => {
        setHeroSlides([]);
        setArticles([]);
        setTrending([]);
        setVideoSection(null);
        setOpportunitiesSection(null);
        setInquirySection(null);
      });
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
  const whatsappHref = useMemo(() => {
    const pageUrl = typeof window !== 'undefined'
      ? window.location.href
      : `https://mukonotalks.ug${pathname}`;
    const pageOrArticleTitle = (mainHero?.title || (typeof document !== 'undefined' ? document.title : '') || 'this page').trim();
    const message = `Hi, I love your articles please, I need your help on ${pageUrl} its about ${pageOrArticleTitle}`;
    const whatsappApiPhone = WHATSAPP_PHONE.replace(/\D/g, '');
    return `https://wa.me/${whatsappApiPhone}?text=${encodeURIComponent(message)}`;
  }, [mainHero?.title, pathname]);
  const opportunityCards = useMemo(() => {
    const items = Array.isArray(opportunitiesSection?.items) ? opportunitiesSection.items : [];
    const activeItems = items.filter((item: any) => (item?.title || item?.description));
    return activeItems.length > 0
      ? activeItems.slice(0, 6)
      : [
          { title: 'Opportunity Title', description: 'Short description of job or opportunity.', link: '/contact' },
          { title: 'Opportunity Title', description: 'Short description of job or opportunity.', link: '/contact' },
          { title: 'Opportunity Title', description: 'Short description of job or opportunity.', link: '/contact' },
        ];
  }, [opportunitiesSection]);
  const inquiryButton = useMemo(() => {
    const buttons = Array.isArray(inquirySection?.ctaButtons) ? inquirySection.ctaButtons : [];
    return buttons[0] || { text: 'Join Now', link: whatsappHref };
  }, [inquirySection, whatsappHref]);
  const inquiryTitle = inquirySection?.heading?.title || 'Inquire';
  const inquiryDescription = inquirySection?.heading?.description || '';
  const opportunitiesTitle = opportunitiesSection?.heading?.title || 'Opportunities';

  return (
    <div className="min-h-screen bg-light-body text-text-light-primary dark:bg-dark-charcoal dark:text-text-dark-primary">
      <Helmet>
        <title>MukonoTalks | News, Entertainment, Local Updates</title>
        <meta
          name="description"
          content="MukonoTalks premium homepage for high-traffic news, entertainment, opportunities, and video content with ad-ready placement."
        />
      </Helmet>

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
          <img
            src={getArticleImage(articles[0])}
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6">
            <Link
              to={`/news?category=${encodeURIComponent(mainHero.category)}`}
              className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold tracking-wide text-black hover:bg-gray-200 transition-colors"
            >
              {mainHero.category}
            </Link>
            <h2 className="text-2xl font-bold leading-tight md:text-3xl">
              <Link to={mainHero.link} className="hover:underline" onClick={() => {
                if (articles[0]?._id) {
                  fetch("/api/v1/track-view", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ postId: articles[0]._id }),
                  });
                }
              }}>
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
                <Link
                  to={`/news?category=${encodeURIComponent(story?.category || 'entertainment')}`}
                  className="w-fit rounded-full bg-white px-2.5 py-1 text-xs font-bold tracking-wide text-black hover:bg-gray-200 transition-colors"
                >
                  {(story?.category || 'entertainment').toUpperCase()}
                </Link>
                <h3 className="text-sm font-semibold">
                  <Link to={`/news/${getArticleSlug(story)}`} className="hover:underline" onClick={() => {
                    if (story?._id) {
                      fetch("/api/v1/track-view", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ postId: story._id }),
                      });
                    }
                  }}>
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
          <img src="/ads/leaderboard.jpg" className="h-full object-cover" alt="Ad" />
        </div>
      </div>

      <section className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="mb-4 flex items-center gap-2">
          <Flame size={18} className="text-black dark:text-white" />
          <h3 className="text-lg font-semibold">Trending Now</h3>
        </div>

        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
          {trendingStories.map((story) => (
            <div
              key={story._id}
              className="snap-start min-w-[240px] overflow-hidden rounded-2xl bg-white shadow-soft transition hover:bg-light-hover hover:shadow-card dark:bg-dark-surface dark:hover:bg-dark-hover"
            >
              <img src={getArticleImage(story)} alt="" className="h-[120px] w-full object-cover" />
              <div className="p-3 text-sm text-text-secondary">
                <Link to={`/news/${getArticleSlug(story)}`} className="hover:text-text-primary" onClick={() => {
                  if (story?._id) {
                    fetch("/api/v1/track-view", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ postId: story._id }),
                    });
                  }
                }}>
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
              <Link to={`/news/${getArticleSlug(story)}`} className="hover:underline" onClick={() => {
                if (story?._id) {
                  fetch("/api/v1/track-view", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ postId: story._id }),
                  });
                }
              }}>
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
          <h3 className="text-lg font-semibold">{opportunitiesTitle}</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {opportunityCards.map((item: any, i: number) => (
            <div
              key={item?._id || item?.title || i}
              className="rounded-2xl border border-dark-border bg-white p-5 shadow-soft transition hover:bg-light-hover dark:bg-dark-surface dark:hover:bg-dark-hover"
            >
              <h4 className="font-semibold">{item?.title || 'Opportunity'}</h4>
              <p className="mt-2 text-sm text-text-secondary">
                {item?.description || 'Short description of job or opportunity.'}
              </p>
              <a
                href={item?.link || '/contact'}
                className="mt-3 inline-block text-sm font-semibold text-black underline dark:text-white"
              >
                View Details →
              </a>
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

          <h3 className="text-lg font-semibold">{inquiryTitle}</h3>
          {inquiryDescription ? (
            <p className="mt-2 text-sm text-text-secondary">{inquiryDescription}</p>
          ) : null}

          <a
            href={inquiryButton?.link || whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-xl bg-black px-6 py-2 font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-black"
          >
            {inquiryButton?.text || 'Join Now'}
          </a>
        </div>
      </section>

      </main>

    </div>
  );
};

export default MukonoHome;
// Designed by Trophy Developers Uganda : https://www.trophydevelopers.com/uganda-web-designers/
