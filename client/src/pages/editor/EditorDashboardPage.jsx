import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import articleService from '../../features/articles/articleService';

const resolveLocalized = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.en || value.sw || value.zh || '';
};

const EditorDashboardPage = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { articles: rows = [] } = await articleService.getAllArticles(
        statusFilter ? { status: statusFilter, page: 1, limit: 100 } : { page: 1, limit: 100 }
      );
      setArticles(rows);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load articles. Ensure you are logged in as admin.');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const grouped = useMemo(() => {
    return {
      all: articles.length,
      draft: articles.filter((a) => a.publishStatus === 'draft').length,
      scheduled: articles.filter((a) => a.publishStatus === 'scheduled').length,
      published: articles.filter((a) => a.publishStatus === 'published').length,
    };
  }, [articles]);

  const togglePublish = async (article) => {
    const action = article.publishStatus === 'published' ? 'unpublish' : 'publish';
    try {
      await articleService.publishArticle(article._id, action);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || `Unable to ${action} article.`);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editorial CMS</h1>
          <p className="mt-1 text-sm text-gray-600">Create, edit, and publish article content.</p>
        </div>
        <Link
          to="/editor/articles/new"
          className="rounded-full bg-primary-700 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-800"
        >
          New Article
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">All: {grouped.all}</span>
        <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-900">Draft: {grouped.draft}</span>
        <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-900">Scheduled: {grouped.scheduled}</span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-900">Published: {grouped.published}</span>
      </div>

      <div className="mb-5">
        <label className="text-sm font-medium text-gray-700">Filter</label>
        <select
          className="ml-2 rounded-full border border-gray-300 px-3 py-1.5 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
        </select>
      </div>

      {error ? <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-gray-600">Loading editorial content...</p> : null}

      {!loading && articles.length === 0 ? (
        <p className="text-gray-600">No articles found for this filter.</p>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <article key={article._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{resolveLocalized(article.title) || 'Untitled'}</h2>
                  <p className="mt-1 text-sm text-gray-600">Slug: {article.localizedSlug?.en || 'n/a'}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">Status: {article.publishStatus}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/editor/articles/${article._id}/edit`}
                    className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => togglePublish(article)}
                    className="rounded-full bg-primary-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-800"
                  >
                    {article.publishStatus === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default EditorDashboardPage;
