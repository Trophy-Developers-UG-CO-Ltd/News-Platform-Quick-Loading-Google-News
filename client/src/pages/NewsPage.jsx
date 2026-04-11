import React, { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../app/axios';
import SchemaInjector from '../seo/components/SchemaInjector';
import MonetizedAdSlot from '../components/ads/MonetizedAdSlot';
import { buildArticlePath } from '../features/articles/articleUrls';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://mukonotalks.ug';
const LANGS = ['en', 'sw', 'zh'];

const resolveLocalized = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.en || value.sw || value.zh || '';
};

const formatDate = (value) => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatCategory = (value) => {
  if (!value) return 'News';
  return String(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

const NewsPage = () => {
  const [searchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const categorySlug = searchParams.get('category')?.trim();

  if (categorySlug) {
    return <Navigate to={`/category/${categorySlug}`} replace />;
  }

  useEffect(() => {
    let mounted = true;

    const loadArticles = async () => {
      try {
        const { data } = await api.get('/articles', { params: { page: 1, limit: 20 } });
        if (mounted) {
          setArticles(Array.isArray(data.articles) ? data.articles : []);
        }
      } catch (_) {
        if (mounted) setArticles([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadArticles();
    return () => {
      mounted = false;
    };
  }, []);

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Mukono News',
    url: `${BASE_URL}/news`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: articles
        .filter((a) => a?.localizedSlug?.en)
        .map((article, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${BASE_URL}${buildArticlePath(article)}`,
          name: resolveLocalized(article.title),
        })),
    },
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <Helmet>
        <title>Mukono News | MukonoTalks</title>
        <meta name="description" content="Latest news stories from Mukono and surrounding communities." />
        <link rel="canonical" href={`${BASE_URL}/news`} />
        {LANGS.map((lang) => (
          <link key={lang} rel="alternate" hrefLang={lang} href={`${BASE_URL}/news?lang=${lang}`} />
        ))}
        <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}/news`} />
      </Helmet>

      <SchemaInjector schemas={itemListSchema} />

      <div className="mb-8 rounded-3xl bg-dark-black p-6 text-text-primary shadow-card sm:p-8">
        <h1 className="font-display text-3xl font-bold">Latest News</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary sm:text-base">
          Fast-loading, SEO-friendly stories designed for discoverability and daily publishing.
        </p>
      </div>

      <MonetizedAdSlot slotKey="newsTop" className="mb-8" />

      {loading ? (
        <p className="text-text-secondary">Loading news...</p>
      ) : articles.length === 0 ? (
        <p className="text-text-secondary">No published stories yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => {
            const title = resolveLocalized(article?.title) || 'Untitled story';
            const slug = article?.localizedSlug?.en;
            const excerpt = resolveLocalized(article?.excerpt) || 'No summary available.';
            const category = formatCategory(article?.category);
            const authorName = article?.author?.name || 'MukonoTalks Editorial Desk';
            const publishedDate = formatDate(article?.publishedAt);

            if (!slug) return null;

            return (
              <React.Fragment key={article._id}>
                <article className="rounded-2xl border border-dark-border bg-dark-slate p-5 shadow-card">
                  <p className="text-xs font-semibold uppercase tracking-wide text-category-news">{category}</p>
                  <h2 className="mt-2 line-clamp-2 text-xl font-semibold text-text-primary">{title}</h2>
                  <p className="mt-2 text-xs text-text-secondary">By {authorName} • {publishedDate}</p>
                  <p className="mt-3 line-clamp-3 text-sm text-text-secondary">{excerpt}</p>
                  <Link
                    to={buildArticlePath(article)}
                    className="mt-4 inline-block text-sm font-semibold text-accent-blue transition-colors hover:text-category-news"
                  >
                    Read story
                  </Link>
                </article>
                {(index + 1) % 6 === 0 ? (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <MonetizedAdSlot slotKey="newsInFeed" className="mt-1" />
                  </div>
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NewsPage;
