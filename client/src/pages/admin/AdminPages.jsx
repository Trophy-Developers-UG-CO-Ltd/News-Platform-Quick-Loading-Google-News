/**
 * Admin Pages — CMS page management list
 * View, search, publish/unpublish, and delete pages
 * @module pages/admin/AdminPages
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiRefreshCw, FiGlobe } from 'react-icons/fi';
import pageService from '../../features/pages/pageService';
import useDocTitle from '../../hooks/useDocTitle';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const STATUS_BADGES = {
  draft: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
};

const AdminPages = () => {
  useDocTitle('CMS Pages — Admin');
  const navigate = useNavigate();

  const [pages, setPages] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadPages = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { page: currentPage, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await pageService.getAllPages(params);
      setPages(data.pages);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Failed to load pages');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, statusFilter]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handlePublishToggle = async (page) => {
    const action = page.publishStatus === 'published' ? 'unpublish' : 'publish';
    try {
      await pageService.publishPage(page._id, action);
      toast.success(`Page ${action}ed successfully`);
      loadPages();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} page`);
    }
  };

  const handleDelete = async (page) => {
    if (!window.confirm(`Delete page "${page.title?.en || page.pageKey}"? This cannot be undone.`)) return;
    try {
      await pageService.deletePage(page._id);
      toast.success('Page deleted');
      loadPages();
    } catch (err) {
      toast.error('Failed to delete page');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadPages();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">CMS Pages</h1>
          <p className="text-sm text-gray-500 mt-1">Manage database-driven content pages</p>
        </div>
        <Link
          to="/admin/pages/new"
          className="btn-primary px-5 py-2 flex items-center gap-2"
        >
          <FiPlus className="h-4 w-4" /> New Page
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by key or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input flex-grow"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="input w-auto"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <button type="submit" className="btn-primary px-4 py-2">Search</button>
          <button
            type="button"
            onClick={() => { setSearch(''); setStatusFilter(''); setCurrentPage(1); }}
            className="btn-secondary px-4 py-2"
          >
            <FiRefreshCw className="h-4 w-4" />
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : pages.length === 0 ? (
        <div className="card p-12 text-center">
          <FiGlobe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No pages found. Create your first CMS page.</p>
        </div>
      ) : (
        <>
          {/* Pages Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Page Key</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Title (EN)</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Slug (EN)</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Updated</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pages.map((pg) => (
                    <tr key={pg._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-700">{pg.pageKey}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        <Link
                          to={`/admin/pages/${pg._id}/edit`}
                          className="text-primary-600 hover:text-primary-800 hover:underline transition-colors"
                        >
                          {pg.title?.en || pg.pageKey || '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 font-mono">/{pg.localizedSlug?.en}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${STATUS_BADGES[pg.publishStatus]}`}>
                          {pg.publishStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(pg.updatedAt).toLocaleDateString('en-ZA')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {pg.publishStatus === 'published' && (
                            <Link
                              to={`/en/${pg.localizedSlug?.en}`}
                              target="_blank"
                              className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
                              title="View live"
                            >
                              <FiEye className="h-4 w-4" />
                            </Link>
                          )}
                          <button
                            onClick={() => navigate(`/admin/pages/${pg._id}/edit`)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePublishToggle(pg)}
                            className={`px-2 py-1 text-xs rounded-none font-medium ${
                              pg.publishStatus === 'published'
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {pg.publishStatus === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleDelete(pg)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <span className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage >= pagination.totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPages;

// MukonoTalks

