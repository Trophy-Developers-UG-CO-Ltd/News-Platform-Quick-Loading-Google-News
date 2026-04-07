import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import articleService from '../../features/articles/articleService';

const CATEGORIES = ['blog', 'insight', 'knowledge-base', 'case-study', 'announcement'];

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const EditorArticleFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('blog');
  const [tags, setTags] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedStatus, setSavedStatus] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!isEdit) return;
      setLoading(true);
      setError('');
      try {
        const { article } = await articleService.getArticleById(id);
        setTitle(article?.title?.en || '');
        setSlug(article?.localizedSlug?.en || '');
        setExcerpt(article?.excerpt?.en || '');
        const textBlock = (article?.contentBlocks || []).find((b) => b?.type === 'text');
        const initialBody =
          textBlock?.data?.en?.body ||
          textBlock?.data?.en?.text ||
          '';
        setBody(initialBody.replace(/<[^>]+>/g, ''));
        setCategory(article?.category || 'blog');
        setTags((article?.tags || []).join(', '));
        setFeaturedImage(article?.featuredImage || '');
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to load article.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  const payload = useMemo(() => {
    const tagList = tags
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);

    return {
      title: { en: title, zh: '', sw: '' },
      localizedSlug: { en: slug, zh: '', sw: '' },
      excerpt: { en: excerpt, zh: '', sw: '' },
      category,
      tags: tagList,
      featuredImage: featuredImage || '',
      author: { name: 'MukonoTalks Editorial Desk', role: 'Editor' },
      seo: {
        en: {
          title: title.slice(0, 60),
          description: (excerpt || body).slice(0, 150),
        },
        zh: {},
        sw: {},
      },
      contentBlocks: [
        {
          type: 'text',
          order: 0,
          data: {
            en: { body: `<p>${body.replace(/\n/g, '</p><p>')}</p>` },
            zh: null,
            sw: null,
          },
        },
      ],
    };
  }, [title, slug, excerpt, category, tags, featuredImage, body]);

  const save = async (publishAfterSave = false) => {
    setLoading(true);
    setError('');
    setSavedStatus('');
    try {
      const result = isEdit
        ? await articleService.updateArticle(id, payload)
        : await articleService.createArticle(payload);

      const articleId = result?.article?._id || id;

      if (publishAfterSave && articleId) {
        await articleService.publishArticle(articleId, 'publish');
      }

      setSavedStatus(publishAfterSave ? 'Saved and published.' : 'Saved as draft.');
      if (!isEdit && articleId) {
        navigate(`/editor/articles/${articleId}/edit`);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Save failed. Ensure required fields are valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit Article' : 'Create Article'}</h1>
        <Link to="/editor" className="text-sm font-semibold text-primary-700 hover:text-primary-900">
          Back to CMS
        </Link>
      </div>

      {error ? <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {savedStatus ? <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{savedStatus}</p> : null}

      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Title</span>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!isEdit || !slug) {
                setSlug(slugify(e.target.value));
              }
            }}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Slug</span>
          <input
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Excerpt</span>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Body</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Tags (comma separated)</span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Featured image URL (optional)</span>
          <input
            value={featuredImage}
            onChange={(e) => setFeaturedImage(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
          />
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => save(false)}
            disabled={loading || !title || !slug || !body}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            onClick={() => save(true)}
            disabled={loading || !title || !slug || !body}
            className="rounded-full bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50"
          >
            Save and Publish
          </button>
        </div>
      </div>
    </section>
  );
};

export default EditorArticleFormPage;
