import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiFilm,
  FiGrid,
  FiPlayCircle,
  FiTrendingUp,
} from 'react-icons/fi';
import api from '../app/axios';
import Spinner from '../components/ui/Spinner';
import SchemaInjector from '../seo/components/SchemaInjector';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://mukonotalks.ug';
const FALLBACK_YOUTUBE = 'https://www.youtube.com/watch?v=ETOSTwqrFyU';

const resolveText = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.en || value.sw || value.zh || '';
};

const stripHtml = (value = '') =>
  String(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toTitleCase = (value = '') =>
  String(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

const normalizeCategoryKey = (value) => {
  if (!value) return 'general';
  if (typeof value === 'object') {
    return String(value.slug || value.name || value.localizedName?.en || 'general')
      .trim()
      .toLowerCase();
  }

  return String(value).trim().toLowerCase();
};

const resolveCategoryLabel = (value) => {
  if (!value) return 'General';
  if (typeof value === 'object') {
    return resolveText(value.localizedName) || value.name || toTitleCase(value.slug) || 'General';
  }
  return toTitleCase(value);
};

const resolveCategorySlug = (value) => {
  if (!value) return 'general';
  if (typeof value === 'object') return value.slug || normalizeCategoryKey(value);
  return String(value).trim().toLowerCase();
};

const getArticleSlug = (article) => article?.localizedSlug?.en || article?.localizedSlug || '';

const getArticleTitle = (article) => resolveText(article?.title) || 'Untitled story';

const getArticleExcerpt = (article) => {
  const excerpt = stripHtml(resolveText(article?.excerpt));
  if (excerpt) return excerpt;

  const blockWithText = Array.isArray(article?.contentBlocks)
    ? article.contentBlocks.find((block) => stripHtml(block?.data?.body || block?.data?.content || block?.data?.text))
    : null;

  const fallback = stripHtml(
    blockWithText?.data?.body || blockWithText?.data?.content || blockWithText?.data?.text || ''
  );

  return fallback || 'Fresh reporting, analysis, and local stories from MukonoTalks.';
};

const getReadingTime = (article) => {
  if (Number(article?.readingTime) > 0) return article.readingTime;
  const sourceText = `${getArticleTitle(article)} ${getArticleExcerpt(article)}`.trim();
  return Math.max(1, Math.ceil(sourceText.split(/\s+/).filter(Boolean).length / 180));
};

const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!value) return 'Publishing soon';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Publishing soon';
  return date.toLocaleDateString('en-UG', options);
};

const getTimestamp = (value) => {
  const timestamp = new Date(value || 0).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const toEmbedUrl = (url) => {
  if (!url) return '';

  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  const tiktokMatch = url.match(/tiktok\.com\/.+\/video\/(\d+)/);
  if (tiktokMatch) return `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`;

  return /^https?:\/\/.+/i.test(url) ? url : '';
};

const getVideoPlatform = (url = '') => {
  if (/youtu/i.test(url)) return 'YouTube';
  if (/vimeo/i.test(url)) return 'Vimeo';
  if (/tiktok/i.test(url)) return 'TikTok';
  return 'Video';
};

const extractArticleVideos = (article) => {
  if (!Array.isArray(article?.contentBlocks)) return [];

  return article.contentBlocks
    .filter((block) => block?.type === 'video')
    .map((block, index) => {
      const rawUrl =
        block?.data?.url ||
        block?.data?.videoUrl ||
        block?.data?.src ||
        block?.data?.embedUrl ||
        '';
      const embedUrl = toEmbedUrl(rawUrl);

      if (!embedUrl) return null;

      return {
        id: `${article?._id || 'article'}-video-${index}`,
        title: block?.data?.title || block?.data?.heading || getArticleTitle(article),
        embedUrl,
        sourceUrl: rawUrl,
        platform: getVideoPlatform(rawUrl),
        articleSlug: getArticleSlug(article),
        articleTitle: getArticleTitle(article),
        publishedAt: article?.publishedAt,
      };
    })
    .filter(Boolean);
};

const buildCollectionSchema = (articles) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'MukonoTalks Blog',
  url: `${BASE_URL}/blog`,
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: articles
      .filter((article) => getArticleSlug(article))
      .slice(0, 24)
      .map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${BASE_URL}/blog/${getArticleSlug(article)}`,
        name: getArticleTitle(article),
      })),
  },
});

const ArticlesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [cmsVideoUrl, setCmsVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const railRefs = useRef({});

  const selectedCategory = normalizeCategoryKey(searchParams.get('category'));

  useEffect(() => {
    let mounted = true;

    const loadBlogSummary = async () => {
      setLoading(true);
      setError('');

      const [categoriesResult, articlesResult, videoResult] = await Promise.allSettled([
        api.get('/categories'),
        api.get('/articles', { params: { page: 1, limit: 120, sort: 'publishedAt' } }),
        api.get('/homepage-sections/video'),
      ]);

      if (!mounted) return;

      const categoryData =
        categoriesResult.status === 'fulfilled' && Array.isArray(categoriesResult.value?.data?.categories)
          ? categoriesResult.value.data.categories.filter((category) => category?.isActive !== false)
          : [];

      const articleData =
        articlesResult.status === 'fulfilled' && Array.isArray(articlesResult.value?.data?.articles)
          ? [...articlesResult.value.data.articles].sort(
              (left, right) => getTimestamp(right?.publishedAt) - getTimestamp(left?.publishedAt)
            )
          : [];

      const resolvedVideoUrl =
        videoResult.status === 'fulfilled' ? videoResult.value?.data?.videoUrl || '' : '';

      setCategories(categoryData);
      setArticles(articleData);
      setCmsVideoUrl(resolvedVideoUrl);

      if (articleData.length === 0 && categoriesResult.status === 'rejected' && articlesResult.status === 'rejected') {
        setError('The blog is temporarily unavailable.');
      }

      setLoading(false);
    };

    loadBlogSummary();

    return () => {
      mounted = false;
    };
  }, []);

  const categoryMetaByKey = useMemo(() => {
    const meta = new Map();

    categories.forEach((category) => {
      const key = normalizeCategoryKey(category);
      meta.set(key, {
        key,
        label: resolveCategoryLabel(category),
        slug: resolveCategorySlug(category),
        createdAt: category?.createdAt || category?.updatedAt || '',
      });
    });

    articles.forEach((article) => {
      const key = normalizeCategoryKey(article?.category);
      if (!meta.has(key)) {
        meta.set(key, {
          key,
          label: resolveCategoryLabel(article?.category),
          slug: resolveCategorySlug(article?.category),
          createdAt: article?.publishedAt || article?.createdAt || '',
        });
      }
    });

    return meta;
  }, [articles, categories]);

  const sections = useMemo(() => {
    const grouped = new Map();

    articles.forEach((article) => {
      const slug = getArticleSlug(article);
      if (!slug) return;

      const key = normalizeCategoryKey(article?.category);
      const meta = categoryMetaByKey.get(key) || {
        key,
        label: resolveCategoryLabel(article?.category),
        slug: resolveCategorySlug(article?.category),
        createdAt: article?.publishedAt || article?.createdAt || '',
      };

      if (!grouped.has(key)) {
        grouped.set(key, {
          ...meta,
          articles: [],
        });
      }

      grouped.get(key).articles.push(article);
    });

    return Array.from(grouped.values()).map((section) => {
      const newestStoryAt = section.articles.reduce(
        (latest, article) => Math.max(latest, getTimestamp(article?.publishedAt || article?.createdAt)),
        0
      );

      return {
        ...section,
        articleCount: section.articles.length,
        newestStoryAt,
        sortStamp: Math.max(getTimestamp(section.createdAt), newestStoryAt),
      };
    });
  }, [articles, categoryMetaByKey]);

  const alphabeticalCategories = useMemo(
    () => [...sections].sort((left, right) => left.label.localeCompare(right.label)),
    [sections]
  );

  const orderedSections = useMemo(() => alphabeticalCategories, [alphabeticalCategories]);

  const discoveredVideos = useMemo(() => {
    const entries = [];
    const seen = new Set();

    const pushVideo = (entry) => {
      if (!entry?.embedUrl || seen.has(entry.embedUrl)) return;
      seen.add(entry.embedUrl);
      entries.push(entry);
    };

    if (cmsVideoUrl) {
      pushVideo({
        id: 'cms-video',
        title: 'MukonoTalks lead video bulletin',
        embedUrl: toEmbedUrl(cmsVideoUrl),
        sourceUrl: cmsVideoUrl,
        platform: getVideoPlatform(cmsVideoUrl),
        articleSlug: '',
        articleTitle: 'Video Trending',
        publishedAt: articles[0]?.publishedAt || '',
      });
    }

    articles.forEach((article) => {
      extractArticleVideos(article).forEach(pushVideo);
    });

    if (entries.length === 0) {
      pushVideo({
        id: 'fallback-video',
        title: 'MukonoTalks community watch',
        embedUrl: toEmbedUrl(FALLBACK_YOUTUBE),
        sourceUrl: FALLBACK_YOUTUBE,
        platform: 'YouTube',
        articleSlug: '',
        articleTitle: 'Video Trending',
        publishedAt: articles[0]?.publishedAt || '',
      });
    }

    return entries.slice(0, 6);
  }, [articles, cmsVideoUrl]);

  const leadArticle = articles[0] || null;
  const latestUpdate = leadArticle?.publishedAt || leadArticle?.createdAt || '';
  const collectionSchema = useMemo(() => buildCollectionSchema(articles), [articles]);

  const handleCategorySelect = (key) => {
    const params = new URLSearchParams(searchParams);

    if (!key || key === 'all') {
      params.delete('category');
      setSearchParams(params, { replace: true });
      return;
    }

    params.set('category', key);
    setSearchParams(params, { replace: true });

    window.requestAnimationFrame(() => {
      document.getElementById(`category-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const scrollRail = (key, direction) => {
    const container = railRefs.current[key];
    if (!container) return;
    container.scrollBy({ left: direction * 360, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-[#f4f4f0] text-black dark:bg-black dark:text-brand-white">
      <Helmet>
        <title>Uganda News, Jobs and Celebrity Updates | MukonoTalks</title>
        <meta
          name="description"
          content="Real-time updates on politics, celebrity news, jobs, campus trends and business stories across Uganda."
        />
        <link rel="canonical" href={`${BASE_URL}/blog`} />
        <meta property="og:title" content="Uganda News, Jobs and Celebrity Updates | MukonoTalks" />
        <meta property="og:description" content="Real-time updates on politics, celebrity news, jobs, campus trends and business stories across Uganda." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/blog`} />
      </Helmet>

      <SchemaInjector schemas={collectionSchema} />

      <section className="relative overflow-hidden border-b border-white/10 bg-black text-brand-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_32%)]" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:py-16 lg:grid-cols-[1.35fr_0.85fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-white/55">MukonoTalks Blog </p>
            <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold leading-tight text-brand-white sm:text-5xl lg:text-6xl">
              Uganda News, Jobs and Celebrity Updates | MukonoTalks
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-brand-white/72 sm:text-lg">
              Real-time updates on politics, celebrity news, jobs, campus trends and business stories across Uganda.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <StatCard icon={FiGrid} label="Published stories" value={articles.length.toString()} />
              <StatCard icon={FiTrendingUp} label="Active categories" value={sections.length.toString()} />
              <StatCard icon={FiFilm} label="Video Current items" value={discoveredVideos.length.toString()} />
            </div>
          </div>

          <aside className="rounded-[28px] border border-white/15 bg-white/8 p-6 shadow-glow backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-white/45">Latest bulletin</p>
            <p className="mt-3 text-sm text-brand-white/68">
              {latestUpdate ? `Updated ${formatDate(latestUpdate)}` : 'Waiting for the next dispatch'}
            </p>
            {leadArticle ? (
              <Link to={`/blog/${getArticleSlug(leadArticle)}`} className="group mt-5 block rounded-[24px] border border-white/12 bg-black/40 p-5 transition hover:border-white/28 hover:bg-black/55">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-white/45">
                  {resolveCategoryLabel(leadArticle?.category)}
                </p>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-brand-white">
                  {getArticleTitle(leadArticle)}
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-brand-white/70">
                  {getArticleExcerpt(leadArticle)}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-white transition group-hover:gap-3">
                  Open lead story <FiArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ) : (
              <div className="mt-5 rounded-[24px] border border-white/12 bg-black/35 p-5 text-sm text-brand-white/65">
                Published stories will appear here once the blog is active.
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white/90 py-6 dark:border-white/10 dark:bg-[#0b0b0b]">
        <div className="mx-auto w-full max-w-7xl px-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleCategorySelect('all')}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                !searchParams.get('category')
                  ? 'border-black bg-black text-brand-white dark:border-white dark:bg-white dark:text-black'
                  : 'border-black/15 bg-transparent text-black hover:border-black dark:border-white/15 dark:text-brand-white dark:hover:border-white/45'
              }`}
            >
              All categories
            </button>
            {alphabeticalCategories.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => handleCategorySelect(section.key)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  selectedCategory === section.key
                    ? 'border-black bg-black text-brand-white dark:border-white dark:bg-white dark:text-black'
                    : 'border-black/15 bg-transparent text-black hover:border-black dark:border-white/15 dark:text-brand-white dark:hover:border-white/45'
                }`}
              >
                {section.label} <span className="opacity-60">{section.articleCount}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:py-12">
        {loading ? (
          <div className="flex min-h-[45vh] items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="rounded-[28px] border border-black/10 bg-white p-8 text-center shadow-card dark:border-white/10 dark:bg-[#0f0f0f]">
            <p className="text-lg font-semibold">{error}</p>
            <p className="mt-2 text-sm text-black/65 dark:text-brand-white/65">
              Refresh the page or verify the publishing API is reachable.
            </p>
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-[28px] border border-black/10 bg-white p-8 text-center shadow-card dark:border-white/10 dark:bg-[#0f0f0f]">
            <p className="text-lg font-semibold">No published stories yet.</p>
            <p className="mt-2 text-sm text-black/65 dark:text-brand-white/65">
              As soon as the Editorial team publishes content, this page will assemble the full summary automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {orderedSections.map((section, index) => (
              <section
                key={section.key}
                id={`category-${section.key}`}
                className="rounded-[32px] border border-black/10 bg-black px-5 py-6 text-brand-white shadow-card sm:px-6 lg:px-8"
              >
                <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-white/45">
                      {index === 0 ? 'A-Z category order' : 'Category summary'}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-brand-white sm:text-3xl">{section.label}</h2>
                    <p className="mt-2 text-sm text-brand-white/65">
                      {section.articleCount} published stories. Latest update {formatDate(section.newestStoryAt)}.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => scrollRail(section.key, -1)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-brand-white transition hover:border-white/40 hover:bg-white/12"
                      aria-label={`Scroll ${section.label} left`}
                    >
                      <FiChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollRail(section.key, 1)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-brand-white transition hover:border-white/40 hover:bg-white/12"
                      aria-label={`Scroll ${section.label} right`}
                    >
                      <FiChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div
                  ref={(node) => {
                    railRefs.current[section.key] = node;
                  }}
                  className="mt-6 flex gap-4 overflow-x-auto pb-2"
                >
                  {section.articles.map((article) => (
                    <ArticleRailCard key={article._id || getArticleSlug(article)} article={article} />
                  ))}
                </div>
              </section>
            ))}

            <section className="rounded-[32px] border border-black/10 bg-white p-5 shadow-card dark:border-white/10 dark:bg-[#0d0d0d] sm:p-6 lg:p-8">
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-black/45 dark:text-brand-white/45">Video</p>
                  <h2 className="mt-2 text-3xl font-semibold">Published video watchlist</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-black/65 dark:text-brand-white/65">
                    A compact video summary pulled from the MukonoTalks publishing stack, led by the active CMS feature and extended with article video embeds when they exist.
                  </p>

                  <div className="mt-6 overflow-hidden rounded-[28px] border border-black/10 bg-black shadow-card dark:border-white/10">
                    <div className="aspect-video w-full bg-black">
                      <iframe
                        className="h-full w-full"
                        src={discoveredVideos[0]?.embedUrl}
                        title={discoveredVideos[0]?.title || 'MukonoTalks video'}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                    <div className="border-t border-white/10 px-5 py-4 text-brand-white">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-white/45">
                        {discoveredVideos[0]?.platform || 'Video'}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-brand-white">
                        {discoveredVideos[0]?.title || 'MukonoTalks video watch'}
                      </h3>
                      <p className="mt-2 text-sm text-brand-white/65">
                        {discoveredVideos[0]?.articleTitle || 'Editorial video feature'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {discoveredVideos.slice(1).map((video) => (
                    <VideoSummaryCard key={video.id} video={video} />
                  ))}

                  {discoveredVideos.length === 1 && (
                    <div className="rounded-[24px] border border-black/10 bg-[#f5f5f0] p-5 text-sm text-black/65 dark:border-white/10 dark:bg-black/40 dark:text-brand-white/65">
                      More embedded video cards will appear here as editors publish video blocks into articles.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-[24px] border border-white/12 bg-white/6 px-5 py-4 backdrop-blur-sm">
    <Icon className="h-5 w-5 text-brand-white/72" />
    <p className="mt-4 text-3xl font-semibold text-brand-white">{value}</p>
    <p className="mt-1 text-sm text-brand-white/58">{label}</p>
  </div>
);

const ArticleRailCard = ({ article }) => {
  const slug = getArticleSlug(article);
  const title = getArticleTitle(article);
  const excerpt = getArticleExcerpt(article);
  const image = article?.featuredImage;

  return (
    <article className="min-w-[280px] max-w-[280px] flex-shrink-0 overflow-hidden rounded-[26px] border border-white/10 bg-white text-black shadow-card transition hover:-translate-y-1 hover:shadow-glow dark:bg-[#f3f3ef]">
      <Link to={`/blog/${slug}`} className="block">
        <div className="h-44 w-full overflow-hidden bg-[#d9d9d4]">
          {image ? (
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover transition duration-500 hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#dcdcd6,#bcbcb5)] text-black/45">
              <FiGrid className="h-10 w-10" />
            </div>
          )}
        </div>
      </Link>

      <div className="flex h-[230px] flex-col px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/45">
          {resolveCategoryLabel(article?.category)}
        </p>
        <Link to={`/blog/${slug}`}>
          <h3 className="mt-2 line-clamp-3 text-lg font-semibold leading-snug">{title}</h3>
        </Link>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-black/68">{excerpt}</p>

        <div className="mt-auto flex items-center justify-between border-t border-black/10 pt-4 text-xs text-black/58">
          <span className="inline-flex items-center gap-1.5">
            <FiClock className="h-3.5 w-3.5" />
            {getReadingTime(article)} min
          </span>
          <span>{formatDate(article?.publishedAt, { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>
    </article>
  );
};

const VideoSummaryCard = ({ video }) => (
  <article className="rounded-[24px] border border-black/10 bg-[#f5f5f0] p-5 shadow-card dark:border-white/10 dark:bg-black/40">
    <div className="flex items-start gap-3">
      <span className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-black text-brand-white dark:bg-white dark:text-black">
        <FiPlayCircle className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-black/45 dark:text-brand-white/45">{video.platform}</p>
        <h3 className="mt-2 line-clamp-2 text-lg font-semibold">{video.title}</h3>
        <p className="mt-1 text-sm text-black/65 dark:text-brand-white/65">{video.articleTitle}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-black/55 dark:text-brand-white/55">
          <span>{formatDate(video.publishedAt, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          {video.articleSlug ? (
            <Link to={`/blog/${video.articleSlug}`} className="inline-flex items-center gap-1 font-semibold text-black transition hover:gap-2 dark:text-brand-white">
              Open article <FiArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <a
              href={video.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-black transition hover:gap-2 dark:text-brand-white"
            >
              Watch source <FiArrowRight className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  </article>
);

export default ArticlesPage;

