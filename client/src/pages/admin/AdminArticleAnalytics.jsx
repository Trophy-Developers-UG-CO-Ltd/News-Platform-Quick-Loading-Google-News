/**
 * Admin Article Analytics page
 * Publishing engine performance dashboard — views, categories, top articles, tags
 * @module pages/admin/AdminArticleAnalytics
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchArticleAnalytics } from '../../features/articles/articleSlice';
import Spinner from '../../components/ui/Spinner';
import useDocTitle from '../../hooks/useDocTitle';
import {
  FiArrowLeft,
  FiEye,
  FiFileText,
  FiTag,
  FiTrendingUp,
  FiBarChart2,
  FiFolder,
} from 'react-icons/fi';

const CATEGORY_LABELS = {
  blog: 'Blog',
  insight: 'Industry Insight',
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

const AdminArticleAnalytics = () => {
  useDocTitle('Article Analytics — Admin');
  const dispatch = useDispatch();
  const { analytics, isLoading } = useSelector((state) => state.articles);

  useEffect(() => {
    dispatch(fetchArticleAnalytics());
  }, [dispatch]);

  if (isLoading || !analytics) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const {
    totalArticles = 0,
    publishedCount = 0,
    draftCount = 0,
    scheduledCount = 0,
    totalViews = 0,
    topByViews = [],
    byCategory = [],
    topTags = [],
  } = analytics;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/admin/articles"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <FiArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Article Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Publishing engine performance overview
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Total Articles"
          value={totalArticles}
          icon={FiFileText}
          color="bg-primary-100 text-primary-600"
        />
        <StatCard
          label="Published"
          value={publishedCount}
          icon={FiTrendingUp}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          label="Drafts"
          value={draftCount}
          icon={FiFileText}
          color="bg-yellow-100 text-yellow-600"
        />
        <StatCard
          label="Scheduled"
          value={scheduledCount}
          icon={FiBarChart2}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Total Views"
          value={totalViews.toLocaleString()}
          icon={FiEye}
          color="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performing Articles */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiTrendingUp className="h-5 w-5 text-green-500" />
            Top Performing Articles
          </h2>
          {topByViews.length === 0 ? (
            <p className="text-sm text-gray-500">No articles with views yet.</p>
          ) : (
            <div className="space-y-3">
              {topByViews.map((article, idx) => (
                <div
                  key={article._id}
                  className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/admin/articles/${article._id}/edit`}
                      className="font-medium text-gray-800 hover:text-primary-600 text-sm truncate block"
                    >
                      {article.title?.en || article.title || 'Untitled'}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${CATEGORY_COLORS[article.category] || 'bg-gray-100 text-gray-600'}`}>
                        {CATEGORY_LABELS[article.category] || article.category}
                      </span>
                      {article.publishedAt && (
                        <span>
                          {new Date(article.publishedAt).toLocaleDateString('en-ZA')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                    <FiEye className="h-4 w-4 text-gray-400" />
                    {(article.viewCount || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Articles by Category */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiFolder className="h-5 w-5 text-blue-500" />
            Articles by Category
          </h2>
          {byCategory.length === 0 ? (
            <p className="text-sm text-gray-500">No categories yet.</p>
          ) : (
            <div className="space-y-3">
              {byCategory.map((cat) => {
                const pct = totalArticles > 0 ? Math.round((cat.count / totalArticles) * 100) : 0;
                return (
                  <div key={cat._id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        {CATEGORY_LABELS[cat._id] || cat._id}
                      </span>
                      <span className="text-gray-500">
                        {cat.count} article{cat.count !== 1 ? 's' : ''} · {(cat.totalViews || 0).toLocaleString()} views
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-primary-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Tags */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiTag className="h-5 w-5 text-orange-500" />
            Most Used Tags
          </h2>
          {topTags.length === 0 ? (
            <p className="text-sm text-gray-500">No tags in use yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topTags.map((tag) => (
                <span
                  key={tag._id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  <FiTag className="h-3 w-3" />
                  {tag._id}
                  <span className="ml-1 text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 font-medium">
                    {tag.count}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Publishing Summary */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiBarChart2 className="h-5 w-5 text-purple-500" />
            Publishing Summary
          </h2>
          <div className="space-y-4">
            <SummaryRow
              label="Published"
              count={publishedCount}
              total={totalArticles}
              color="bg-green-500"
            />
            <SummaryRow
              label="Drafts"
              count={draftCount}
              total={totalArticles}
              color="bg-yellow-500"
            />
            <SummaryRow
              label="Scheduled"
              count={scheduledCount}
              total={totalArticles}
              color="bg-blue-500"
            />
          </div>

          {totalArticles > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100 text-sm text-gray-500">
              Average views per article:{' '}
              <span className="font-semibold text-gray-700">
                {Math.round(totalViews / totalArticles).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Stat Card Component ───────────────────────── */
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="card p-4">
    <div className="flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  </div>
);

/* ─── Summary Row Component ─────────────────────── */
const SummaryRow = ({ label, count, total, color }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-800">
          {count} ({pct}%)
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default AdminArticleAnalytics;

// MukonoTalks

