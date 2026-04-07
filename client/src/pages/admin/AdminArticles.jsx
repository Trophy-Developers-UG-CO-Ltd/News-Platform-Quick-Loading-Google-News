/**
 * Admin Articles page
 * Article listing with search, filter, publish/schedule, delete
 * Enterprise publishing engine management
 * @module pages/admin/AdminArticles
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllArticles } from '../../features/articles/articleSlice';
import articleService from '../../features/articles/articleService';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiSearch,
  FiFilter,
  FiClock,
  FiBarChart2,
} from 'react-icons/fi';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'blog', label: 'Blog' },
  { value: 'insight', label: 'Industry Insight' },
  { value: 'knowledge-base', label: 'Knowledge Base' },
  { value: 'case-study', label: 'Case Study' },
  { value: 'announcement', label: 'Announcement' },
];

const STATUS_COLORS = {
  draft: 'bg-yellow-100 text-yellow-700',
  scheduled: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
};

const AdminArticles = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { articles, pagination, isLoading } = useSelector((state) => state.articles);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadArticles = useCallback(() => {
    dispatch(
      fetchAllArticles({
        search: search || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        page: currentPage,
        limit: 20,
      })
    );
  }, [dispatch, search, statusFilter, categoryFilter, currentPage]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadArticles();
  };

  const handlePublishToggle = async (article) => {
    const action = article.publishStatus === 'published' ? 'unpublish' : 'publish';
    try {
      await articleService.publishArticle(article._id, action);
      toast.success(`Article ${action === 'publish' ? 'published' : 'unpublished'} successfully`);
      loadArticles();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} article`);
    }
  };

  const handleDelete = async (article) => {
    if (!window.confirm(`Delete "${article.title?.en}"? This action cannot be undone.`)) return;
    try {
      await articleService.deleteArticle(article._id);
      toast.success('Article deleted successfully');
      loadArticles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete article');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Publishing Engine</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage articles, insights, knowledge base, and announcements
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/articles/analytics"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <FiBarChart2 className="h-4 w-4" /> Analytics
          </Link>
          <Link
            to="/admin/articles/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            <FiPlus className="h-4 w-4" /> New Article
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-[48px] focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-[48px] focus:ring-2 focus:ring-primary-500 text-sm appearance-none bg-white"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-[48px] focus:ring-2 focus:ring-primary-500 text-sm appearance-none bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <button type="submit" className="btn-primary px-4 py-2 text-sm">Search</button>
          </div>
        </form>
      </div>

      {/* Article List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : !articles || articles.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 mb-4">No articles found.</p>
          <Link to="/admin/articles/new" className="btn-primary px-6 py-2">
            Create Your First Article
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {articles.map((article) => (
              <div key={article._id} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {article.title?.en || 'Untitled'}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[article.publishStatus]}`}>
                        {article.publishStatus}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                        {article.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>/{article.localizedSlug?.en}</span>
                      {article.viewCount > 0 && (
                        <span className="flex items-center gap-1">
                          <FiEye className="h-3 w-3" /> {article.viewCount}
                        </span>
                      )}
                      {article.scheduledAt && article.publishStatus === 'scheduled' && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <FiClock className="h-3 w-3" /> {new Date(article.scheduledAt).toLocaleDateString('en-ZA')}
                        </span>
                      )}
                      <span>
                        {article.publishedAt
                          ? `Published ${new Date(article.publishedAt).toLocaleDateString('en-ZA')}`
                          : `Created ${new Date(article.createdAt).toLocaleDateString('en-ZA')}`}
                      </span>
                      {article.tags && article.tags.length > 0 && (
                        <span className="hidden sm:inline">
                          Tags: {article.tags.slice(0, 3).join(', ')}
                          {article.tags.length > 3 && `+${article.tags.length - 3}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePublishToggle(article)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-none transition-colors ${
                        article.publishStatus === 'published'
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {article.publishStatus === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    {article.publishStatus === 'published' && (
                      <Link
                        to={`/blog/en/${article.localizedSlug?.en}`}
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                        title="View"
                      >
                        <FiEye className="h-4 w-4" />
                      </Link>
                    )}
                    <button
                      onClick={() => navigate(`/admin/articles/${article._id}/edit`)}
                      className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(article)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-none disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} articles)
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-4 py-2 text-sm border border-gray-300 rounded-none disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminArticles;

// MukonoTalks

