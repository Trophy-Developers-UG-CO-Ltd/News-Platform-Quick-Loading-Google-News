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
          <h1 className="font-display text-3xl font-bold text-text-primary">Editorial CMS</h1>
          <p className="mt-1 text-sm text-text-secondary">Create, edit, and publish article content.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/editor/categories"
            className="rounded-full border border-dark-border bg-dark-slate px-5 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-dark-hover hover:text-text-primary"
          >
            Manage Categories
          </Link>
          <Link
            to="/editor/articles/new"
            className="rounded-full bg-accent-blue px-5 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-category-news"
          >
            New Article
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-dark-slate px-3 py-1 font-semibold text-text-secondary">All: {grouped.all}</span>
        <span className="rounded-full bg-accent-orange/15 px-3 py-1 font-semibold text-accent-orange">Draft: {grouped.draft}</span>
        <span className="rounded-full bg-accent-blue/15 px-3 py-1 font-semibold text-accent-blue">Scheduled: {grouped.scheduled}</span>
        <span className="rounded-full bg-accent-green/15 px-3 py-1 font-semibold text-accent-green">Published: {grouped.published}</span>
      </div>

      <div className="mb-5">
        <label className="text-sm font-medium text-text-secondary">Filter</label>
        <select
          className="ml-2 rounded-full border border-dark-border bg-dark-slate px-3 py-1.5 text-sm text-text-primary"
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
      {loading ? <p className="text-text-secondary">Loading editorial content...</p> : null}

      {!loading && articles.length === 0 ? (
        <p className="text-text-secondary">No articles found for this filter.</p>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <article key={article._id} className="rounded-xl border border-dark-border bg-dark-slate p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">{resolveLocalized(article.title) || 'Untitled'}</h2>
                  <p className="mt-1 text-sm text-text-secondary">Slug: {article.localizedSlug?.en || 'n/a'}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-text-muted">Status: {article.publishStatus}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/editor/articles/${article._id}/edit`}
                    className="rounded-full border border-dark-border bg-dark-charcoal px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-dark-hover hover:text-text-primary"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => togglePublish(article)}
                    className="rounded-full bg-accent-blue px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-category-news"
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
