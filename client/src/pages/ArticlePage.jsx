/**
 * Single Article Page — Blog / Insight / Knowledge Base article view
 * SEO metadata injection, hreflang, structured block rendering
 * Server-side view count increment via API
 * @module pages/ArticlePage
 */

import React, { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPublicArticle, clearArticle } from '../features/articles/articleSlice';
import ArticleBlockRenderer from '../features/articles/ArticleBlockRenderer';
import Spinner from '../components/ui/Spinner';
import resolveImageUrl from '../utils/resolveImageUrl';
import {
  FiArrowLeft,
  FiClock,
  FiEye,
  FiTag,
  FiUser,
  FiCalendar,
  FiShare2,
} from 'react-icons/fi';
import SchemaInjector from '../seo/components/SchemaInjector';
import { buildArticleSchema, buildBreadcrumbSchema } from '../seo/utils/schemaBuilders';
import Reveal from '../components/ui/Reveal';

const CATEGORY_LABELS = {
  blog: 'Blog',
  insight: 'Insights',
  'knowledge-base': 'Knowledge Base',
  'case-study': 'Case Study',
  announcement: 'Announcement',
};

const CATEGORY_COLORS = {
  blog: 'bg-blue-100 text-blue-700',
  insight: 'bg-purple-100 text-purple-700',
  'knowledge-base': 'bg-green-100 text-green-700',
  'case-study': 'bg-orange-100 text-orange-700',
  announcement: 'bg-red-100 text-red-700',
};

const SUPPORTED_LANGUAGES = ['en', 'sw', 'zh'];
const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://mukonotalks.ug';

const ArticlePage = () => {
  const { lang = 'en', slug } = useParams();
  const dispatch = useDispatch();
  const { currentArticle: article, isLoading, error } = useSelector((state) => state.articles);

  /* Validate language parameter */
  const validLang = useMemo(
    () => (SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en'),
    [lang]
  );

  useEffect(() => {
    if (slug) {
      dispatch(fetchPublicArticle({ lang: validLang, slug }));
    }
    return () => {
      dispatch(clearArticle());
    };
  }, [dispatch, validLang, slug]);

  /* Share handler */
  const handleShare = async () => {
    const localizedShareSlug = article?.localizedSlug?.[validLang] || article?.localizedSlug?.en || slug;
    const shareUrl = `${BASE_URL}/${validLang}/blog/${localizedShareSlug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title || 'MukonoTalks Article',
          url: shareUrl,
        });
      } catch (_) {
        /* User cancelled share */
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  /* Reading time estimate */
  const readingTime = useMemo(() => {
    if (!article?.contentBlocks) return 0;
    let wordCount = 0;
    article.contentBlocks.forEach((block) => {
      const data = block.data;
      if (!data) return;
      if (typeof data === 'string') {
        wordCount += data.split(/\s+/).length;
      } else if (data.body) {
        wordCount += String(data.body).split(/\s+/).length;
      } else if (data.content) {
        wordCount += String(data.content).split(/\s+/).length;
      } else if (data.text) {
        wordCount += String(data.text).split(/\s+/).length;
      } else if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item) => {
          wordCount += String(item).split(/\s+/).length;
        });
      }
    });
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [article]);

  /* Error / Not Found */
  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Article Not Found</h1>
        <p className="text-gray-500 mb-6">
          The article you're looking for doesn't exist or hasn't been published yet.
        </p>
        <Link
          to={`/${validLang}/blog`}
          className="inline-flex items-center gap-2 btn-primary"
        >
          <FiArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>
      </div>
    );
  }

  /* Loading */
  if (isLoading || !article) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  /* Resolved localized fields */
  const title = article.title || 'Untitled';
  const excerpt = article.excerpt || '';
  const seoTitle = article.seo?.title || title;
  const seoDescription = article.seo?.description || excerpt;
  const category = article.category;
  const categoryLabel = CATEGORY_LABELS[category] || category;
  const categoryColor = CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-600';
  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <>
      {/* SEO Head */}
      <Helmet>
        <title>{seoTitle} | MukonoTalks</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={`${BASE_URL}/${validLang}/blog/${slug}`} />

        {/* hreflang */}
        {SUPPORTED_LANGUAGES.map((l) => (
          <link
            key={l}
            rel="alternate"
            hrefLang={l}
            href={`${BASE_URL}/${l}/blog/${article.localizedSlug?.[l] || slug}`}
          />
        ))}
        <link
          rel="alternate"
          hrefLang="x-default"
          href={`${BASE_URL}/en/blog/${article.localizedSlug?.en || slug}`}
        />

        {/* Open Graph */}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${BASE_URL}/${validLang}/blog/${slug}`} />
        {article.featuredImage && (
          <meta property="og:image" content={article.featuredImage} />
        )}

        {/* Article meta */}
        {publishedDate && (
          <meta property="article:published_time" content={article.publishedAt} />
        )}
        {article.author?.name && (
          <meta property="article:author" content={article.author.name} />
        )}
        {article.tags?.map((tag, i) => (
          <meta key={i} property="article:tag" content={tag} />
        ))}

        {/* JSON-LD structured data */}
      </Helmet>

      {/* Article + Breadcrumb schemas */}
      <SchemaInjector schemas={[
        buildArticleSchema(article, validLang),
        buildBreadcrumbSchema([
          { name: 'Home',     url: `${BASE_URL}/${validLang}` },
          { name: 'Blog',     url: `${BASE_URL}/${validLang}/blog` },
          ...(category ? [{ name: CATEGORY_LABELS[category] || category, url: `${BASE_URL}/${validLang}/blog?category=${category}` }] : []),
          { name: title },
        ]),
      ]} />

      {/* Article Content */}
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li>
              <Link to={`/${validLang}`} className="hover:text-primary-600 transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link to={`/${validLang}/blog`} className="hover:text-primary-600 transition-colors">
                Blog
              </Link>
            </li>
            {category && (
              <>
                <li>/</li>
                <li>
                  <Link
                    to={`/${validLang}/blog?category=${category}`}
                    className="hover:text-primary-600 transition-colors"
                  >
                    {categoryLabel}
                  </Link>
                </li>
              </>
            )}
            <li>/</li>
            <li className="text-gray-800 font-medium truncate max-w-[200px]">
              {title}
            </li>
          </ol>
        </nav>

        {/* Header */}
        <Reveal variant="fade-up">
        <header className="mb-8">
          {/* Category badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${categoryColor}`}>
              {categoryLabel}
            </span>
            {readingTime > 0 && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <FiClock className="h-3.5 w-3.5" />
                {readingTime} min read
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
            {title}
          </h1>

          {/* Excerpt */}
          {excerpt && (
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              {excerpt}
            </p>
          )}

          {/* Meta bar */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 border-y border-gray-200 py-4">
            {article.author?.name && (
              <span className="flex items-center gap-1.5">
                <FiUser className="h-4 w-4" />
                <span className="font-medium text-gray-700">{article.author.name}</span>
                {article.author.role && (
                  <span className="text-gray-400">· {article.author.role}</span>
                )}
              </span>
            )}
            {publishedDate && (
              <span className="flex items-center gap-1.5">
                <FiCalendar className="h-4 w-4" />
                {publishedDate}
              </span>
            )}
            {article.viewCount > 0 && (
              <span className="flex items-center gap-1.5">
                <FiEye className="h-4 w-4" />
                {article.viewCount.toLocaleString()} views
              </span>
            )}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 transition-colors ml-auto"
              title="Share this article"
            >
              <FiShare2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </header>
        </Reveal>

        {/* Featured Image */}
        {article.featuredImage && (
          <Reveal variant="zoom" delay={100}>
          <div className="mb-10 rounded-xl overflow-hidden shadow-lg">
            <img
              src={article.featuredImage}
              alt={title}
              className="w-full h-auto max-h-[500px] object-cover"
              loading="lazy"
            />
          </div>
          </Reveal>
        )}

        {/* Content Blocks */}
        <Reveal variant="fade-up" delay={150}>
        <div className="prose prose-lg max-w-none">
          <ArticleBlockRenderer blocks={article.contentBlocks} />
        </div>
        </Reveal>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 flex-wrap">
              <FiTag className="h-4 w-4 text-gray-400" />
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/${validLang}/blog?tag=${tag}`}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-primary-100 hover:text-primary-700 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Products (Knowledge Base only) */}
        {category === 'knowledge-base' && article.relatedProducts && article.relatedProducts.length > 0 && (
          <div className="mt-10 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Related Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {article.relatedProducts.map((product) => (
                <Link
                  key={product._id || product.slug}
                  to={`/${validLang}/products/${product.slug}`}
                  className="card p-4 hover:shadow-md transition-shadow flex items-center gap-4"
                >
                  {product.images?.[0] && (
                    <img
                      src={resolveImageUrl(product.images[0]?.url || product.images[0])}
                      alt={product.title}
                      className="w-16 h-16 rounded-lg object-cover"
                      loading="lazy"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">{product.title}</p>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to Blog */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <Link
            to={`/${validLang}/blog`}
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <FiArrowLeft className="h-4 w-4" /> Back to Blog &amp; Insights
          </Link>
        </div>
      </article>
    </>
  );
};

export default ArticlePage;

// MukonoTalks

