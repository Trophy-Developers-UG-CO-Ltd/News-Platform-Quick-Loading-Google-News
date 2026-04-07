import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api from '../app/axios';
import SchemaInjector from '../seo/components/SchemaInjector';
import BannerAdSlot from '../components/ads/BannerAdSlot';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://mukonotalks.ug';
const LANGS = ['en', 'sw', 'zh'];

const NewsArticlePage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const langParam = searchParams.get('lang');
  const lang = LANGS.includes(langParam) ? langParam : 'en';
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadArticle = async () => {
      try {
        const { data } = await api.get(`/articles/${lang}/${slug}`);
        if (mounted) {
          setArticle(data.article || null);
        }
      } catch (_) {
        if (mounted) setArticle(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (slug) loadArticle();

    return () => {
      mounted = false;
    };
  }, [lang, slug]);

  if (loading) {
    return <div className="mx-auto w-full max-w-3xl px-4 py-12 text-gray-600">Loading story...</div>;
  }

  if (!article) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Story not found</h1>
        <Link to="/news" className="mt-4 inline-block text-primary-700 hover:text-primary-900">Back to news</Link>
      </div>
    );
  }

  const title = article.title || 'Untitled story';
  const excerpt = article.excerpt || '';
  const blocks = Array.isArray(article.contentBlocks) ? article.contentBlocks : [];
  const canonicalUrl = `${BASE_URL}/news/${article.slug || slug}`;

  const newsSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: canonicalUrl,
    headline: title,
    description: excerpt || title,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'MukonoTalks Editorial Desk',
    },
    publisher: {
      '@type': 'Organization',
      name: 'MukonoTalks',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    ...(article.featuredImage ? { image: article.featuredImage } : {}),
    ...(article.tags?.length ? { keywords: article.tags.join(', ') } : {}),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'News', item: `${BASE_URL}/news` },
      { '@type': 'ListItem', position: 3, name: title, item: canonicalUrl },
    ],
  };

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10">
      <Helmet>
        <title>{title} | MukonoTalks</title>
        <meta name="description" content={excerpt || 'MukonoTalks story'} />
        <link rel="canonical" href={canonicalUrl} />
        {LANGS.map((supportedLang) => {
          const localizedSlug = article?.availableSlugs?.[supportedLang] || article.slug || slug;
          return (
            <link
              key={supportedLang}
              rel="alternate"
              hrefLang={supportedLang}
              href={`${BASE_URL}/news/${localizedSlug}?lang=${supportedLang}`}
            />
          );
        })}
        <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      </Helmet>

      <SchemaInjector schemas={[newsSchema, breadcrumbSchema]} />

      <Link to="/news" className="text-sm font-medium text-primary-700 hover:text-primary-900">
        Back to news
      </Link>

      <h1 className="mt-3 text-4xl font-bold leading-tight text-gray-900">{title}</h1>
      {excerpt ? <p className="mt-3 text-lg text-gray-600">{excerpt}</p> : null}

      <BannerAdSlot slotKey="articleInline" className="my-6" />

      <div className="space-y-4 text-base leading-7 text-gray-800">
        {blocks.length > 0 ? (
          blocks.map((block, idx) => {
            const body = block?.data?.body || block?.data?.text || '';
            if (!body) return null;
            return <p key={`${block?._id || 'block'}-${idx}`} dangerouslySetInnerHTML={{ __html: body }} />;
          })
        ) : (
          <p>No body content available for this article.</p>
        )}
      </div>

      <BannerAdSlot slotKey="articleFooter" className="mt-8" />
    </article>
  );
};

export default NewsArticlePage;
