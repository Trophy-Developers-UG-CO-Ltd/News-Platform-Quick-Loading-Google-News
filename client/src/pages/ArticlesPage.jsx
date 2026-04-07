/**
 * Public Articles Page — Blog / Insights / Knowledge Base listing
 * Premium B2B blog listing with featured hero, search, category filters, pagination
 * SEO metadata injection via react-helmet-async
 * @module pages/ArticlesPage
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPublicArticles } from '../features/articles/articleSlice';
import Spinner from '../components/ui/Spinner';
import Reveal, { StaggerReveal } from '../components/ui/Reveal';
import {
  FiSearch,
  FiClock,
  FiEye,
  FiTag,
  FiChevronLeft,
  FiChevronRight,
  FiArrowRight,
  FiBookOpen,
  FiUser,
} from 'react-icons/fi';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'blog', label: 'Blog' },
  { value: 'insight', label: 'Insights' },
  { value: 'knowledge-base', label: 'Knowledge Base' },
  { value: 'case-study', label: 'Case Studies' },
  { value: 'announcement', label: 'Announcements' },
];

const CATEGORY_COLORS = {
  blog: 'bg-blue-50 text-blue-700 border-blue-200',
  insight: 'bg-purple-50 text-purple-700 border-purple-200',
  'knowledge-base': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'case-study': 'bg-amber-50 text-amber-700 border-amber-200',
  announcement: 'bg-red-50 text-red-700 border-red-200',
};

const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://mukonotalks.ug';

const ArticlesPage = () => {
  const dispatch = useDispatch();
  const { lang = 'en' } = useParams();
  const { articles, pagination, isLoading } = useSelector((state) => state.articles);
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [tag, setTag] = useState(searchParams.get('tag') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const loadArticles = useCallback(() => {
    const params = { page, limit: 12 };
    if (search) params.search = search;
    if (category) params.category = category;
    if (tag) params.tag = tag;
    dispatch(fetchPublicArticles(params));
  }, [dispatch, page, search, category, tag]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  /* Sync URL params */
  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    if (tag) params.tag = tag;
    if (page > 1) params.page = page;
    setSearchParams(params, { replace: true });
  }, [search, category, tag, page, setSearchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadArticles();
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setPage(1);
  };

  const handleTagClick = (t) => {
    setTag(t);
    setPage(1);
  };

  const clearTag = () => {
    setTag('');
    setPage(1);
  };

  // Split first article as featured (only on page 1 with no filters)
  const isFirstPage = page === 1 && !search && !category && !tag;
  const featuredArticle = isFirstPage && articles?.length > 0 ? articles[0] : null;
  const gridArticles = isFirstPage && articles?.length > 1 ? articles.slice(1) : articles || [];

  return (
    <>
      <Helmet>
        <title>Blog &amp; Insights | MukonoTalks</title>
        <meta
          name="description"
          content="Industry insights, technical knowledge base, case studies, and announcements from MukonoTalks — Africa's trusted industrial chemicals supplier."
        />
        <link rel="canonical" href={`${BASE_URL}/${lang}/blog`} />
        <meta property="og:title" content="Blog & Insights | MukonoTalks" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/${lang}/blog`} />
      </Helmet>

      {/* ── Hero Banner ──────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 text-white">
        <div className="container mx-auto px-4 py-16 sm:py-20">
          <Reveal variant="fade-up">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-6">
                <FiBookOpen className="h-4 w-4 text-primary-300" />
                <span className="text-slate-200">Knowledge Hub</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                Blog &amp; Industry Insights
              </h1>
              <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
                Technical guides, market analysis, case studies, and the latest
                news from Africa&apos;s trusted industrial chemicals supplier.
              </p>
            </div>
          </Reveal>

          {/* Search bar in hero */}
          <Reveal variant="fade-up" delay={150}>
            <form onSubmit={handleSearch} className="max-w-xl mx-auto mt-8 relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles, topics, or keywords..."
                className="w-full pl-12 pr-24 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-500 hover:bg-primary-400 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors"
              >
                Search
              </button>
            </form>
          </Reveal>
        </div>
      </section>

      {/* ── Category Tabs + Tag Filter ───────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:justify-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  category === cat.value
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {tag && (
            <div className="flex justify-center pb-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-full text-sm">
                <FiTag className="h-3.5 w-3.5" />
                Tag: <strong>{tag}</strong>
                <button
                  onClick={clearTag}
                  className="ml-1 hover:text-primary-900 font-bold"
                >
                  ×
                </button>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="bg-gray-50 min-h-[50vh]">
        <div className="container mx-auto px-4 py-10">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : !articles || articles.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiBookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg font-medium mb-2">No articles found</p>
              <p className="text-gray-400 text-sm">
                Try adjusting your search or filters to find what you&apos;re looking for.
              </p>
            </div>
          ) : (
            <>
              {/* Featured article (first page only, no filters) */}
              {featuredArticle && (
                <Reveal variant="fade-up">
                  <FeaturedCard article={featuredArticle} lang={lang} onTagClick={handleTagClick} />
                </Reveal>
              )}

              {/* Article Grid */}
              {gridArticles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  <StaggerReveal stagger={60}>
                    {gridArticles.map((article) => (
                      <ArticleCard
                        key={article._id}
                        article={article}
                        lang={lang}
                        onTagClick={handleTagClick}
                      />
                    ))}
                  </StaggerReveal>
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium bg-white border border-gray-200 rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <FiChevronLeft className="h-4 w-4" /> Previous
                  </button>

                  {/* Page numbers */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                      .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === '...' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm">...</span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => setPage(item)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                              page === item
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}
                  </div>

                  <span className="sm:hidden text-sm text-gray-500">
                    {pagination.page} / {pagination.totalPages}
                  </span>

                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium bg-white border border-gray-200 rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Next <FiChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

/* ─── Featured Article Card (Hero-style, first article on page 1) ──── */
const FeaturedCard = ({ article, lang, onTagClick }) => {
  const slug = article.localizedSlug?.[lang] || article.localizedSlug?.en || article.localizedSlug;
  const title = article.title?.[lang] || article.title?.en || article.title || 'Untitled';
  const excerpt = article.excerpt?.[lang] || article.excerpt?.en || article.excerpt || '';
  const categoryClass = CATEGORY_COLORS[article.category] || 'bg-gray-50 text-gray-600 border-gray-200';
  const categoryLabel = CATEGORIES.find((c) => c.value === article.category)?.label || article.category;

  return (
    <Link
      to={`/${lang}/blog/${slug}`}
      className="block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group border border-gray-100"
    >
      <div className="grid md:grid-cols-2 gap-0">
        {/* Image */}
        <div className="h-56 md:h-full min-h-[280px] overflow-hidden bg-gray-100">
          {article.featuredImage ? (
            <img
              src={article.featuredImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
              <FiBookOpen className="w-16 h-16 text-primary-300" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${categoryClass}`}>
              {categoryLabel}
            </span>
            {article.readingTime > 0 && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <FiClock className="h-3 w-3" />
                {article.readingTime} min read
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors leading-snug">
            {title}
          </h2>

          {excerpt && (
            <p className="text-gray-500 mb-5 leading-relaxed line-clamp-3">
              {excerpt}
            </p>
          )}

          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-4 text-xs text-gray-400">
              {article.author?.name && (
                <span className="flex items-center gap-1">
                  <FiUser className="h-3.5 w-3.5" />
                  {article.author.name}
                </span>
              )}
              {article.publishedAt && (
                <span className="flex items-center gap-1">
                  <FiClock className="h-3.5 w-3.5" />
                  {new Date(article.publishedAt).toLocaleDateString('en-ZA', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 group-hover:gap-2.5 transition-all">
              Read Article <FiArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

/* ─── Article Card Component ─────────────────────── */
const ArticleCard = ({ article, lang, onTagClick }) => {
  const slug = article.localizedSlug?.[lang] || article.localizedSlug?.en || article.localizedSlug;
  const title = article.title?.[lang] || article.title?.en || article.title || 'Untitled';
  const excerpt = article.excerpt?.[lang] || article.excerpt?.en || article.excerpt || '';
  const categoryClass = CATEGORY_COLORS[article.category] || 'bg-gray-50 text-gray-600 border-gray-200';
  const categoryLabel = CATEGORIES.find((c) => c.value === article.category)?.label || article.category;

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group border border-gray-100 flex flex-col">
      {/* Featured Image */}
      <Link to={`/${lang}/blog/${slug}`} className="block">
        <div className="h-48 overflow-hidden bg-gray-100">
          {article.featuredImage ? (
            <img
              src={article.featuredImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <FiBookOpen className="w-10 h-10 text-gray-300" />
            </div>
          )}
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-1">
        {/* Category + Reading time */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${categoryClass}`}>
            {categoryLabel}
          </span>
          {article.readingTime > 0 && (
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <FiClock className="h-3 w-3" />
              {article.readingTime} min
            </span>
          )}
        </div>

        {/* Title */}
        <Link to={`/${lang}/blog/${slug}`}>
          <h2 className="text-base font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
            {title}
          </h2>
        </Link>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed flex-1">
            {excerpt}
          </p>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {article.tags.slice(0, 3).map((t) => (
              <button
                key={t}
                onClick={(e) => {
                  e.preventDefault();
                  onTagClick(t);
                }}
                className="px-2 py-0.5 text-[11px] bg-gray-50 text-gray-500 rounded-full hover:bg-primary-50 hover:text-primary-600 transition-colors border border-gray-100"
              >
                #{t}
              </button>
            ))}
            {article.tags.length > 3 && (
              <span className="px-2 py-0.5 text-[11px] text-gray-400">
                +{article.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer: Author + Date + Read More */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {article.author?.name && (
              <span className="flex items-center gap-1 font-medium text-gray-500">
                <FiUser className="h-3 w-3" />
                {article.author.name}
              </span>
            )}
            {article.publishedAt && (
              <span>
                {new Date(article.publishedAt).toLocaleDateString('en-ZA', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            )}
            {article.viewCount > 0 && (
              <span className="flex items-center gap-1">
                <FiEye className="h-3 w-3" /> {article.viewCount.toLocaleString()}
              </span>
            )}
          </div>

          <Link
            to={`/${lang}/blog/${slug}`}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 group-hover:gap-1.5 transition-all"
          >
            Read <FiArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ArticlesPage;

// MukonoTalks

