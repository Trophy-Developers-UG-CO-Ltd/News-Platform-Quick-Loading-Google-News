import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import articleService from '../../features/articles/articleService';
import categoryService from '../../features/articles/categoryService';
import RichTextEditor from '../../components/ui/RichTextEditor';

const FALLBACK_CATEGORIES = [
  { value: 'news', label: 'News' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'politics', label: 'Politics' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'opportunities', label: 'Opportunities' },
];

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const stripHtml = (html = '') =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const EditorArticleFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('news');
  const [tags, setTags] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [categoryOptions, setCategoryOptions] = useState(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedStatus, setSavedStatus] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadCategories = async () => {
      try {
        const result = await categoryService.listCategories();
        const options = categoryService.normalizeCategoryOptions(result?.categories || []);
        if (mounted && options.length) {
          setCategoryOptions(options);
          setCategory((current) => (
            options.some((option) => option.value === current) ? current : options[0].value
          ));
        }
      } catch (_) {
        if (mounted) {
          setCategoryOptions(FALLBACK_CATEGORIES);
        }
      }
    };

    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

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
        const initialBodyRaw = textBlock?.data?.en?.body || textBlock?.data?.en?.text || '';
        const initialBody = Array.isArray(initialBodyRaw)
          ? initialBodyRaw.map((part) => `<p>${part}</p>`).join('')
          : initialBodyRaw;
        setBody(initialBody);
        setCategory(article?.category || 'news');
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
      excerpt: { en: stripHtml(excerpt).slice(0, 500), zh: '', sw: '' },
      category,
      tags: tagList,
      featuredImage: featuredImage || '',
      author: { name: 'MukonoTalks Editorial Desk', role: 'Editor' },
      seo: {
        en: {
          title: title.slice(0, 60),
          description: stripHtml(excerpt || body).slice(0, 150),
        },
        zh: {},
        sw: {},
      },
      contentBlocks: [
        {
          type: 'text',
          order: 0,
          data: {
            en: { body },
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
        <h1 className="font-display text-3xl font-bold text-text-primary">{isEdit ? 'Edit Article' : 'Create Article'}</h1>
        <Link to="/editor" className="text-sm font-semibold text-accent-blue transition-colors hover:text-category-news">
          Back to CMS
        </Link>
      </div>

      {error ? <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {savedStatus ? <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{savedStatus}</p> : null}

      <div className="space-y-4 rounded-2xl border border-dark-border bg-dark-slate p-6 shadow-card">
        <label className="block">
          <span className="text-sm font-medium text-text-secondary">Title</span>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!isEdit || !slug) {
                setSlug(slugify(e.target.value));
              }
            }}
            className="mt-1 w-full rounded-xl border border-dark-border bg-dark-charcoal px-3 py-2 text-text-primary placeholder:text-text-muted"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-text-secondary">Slug</span>
          <input
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            className="mt-1 w-full rounded-xl border border-dark-border bg-dark-charcoal px-3 py-2 text-text-primary placeholder:text-text-muted"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-text-secondary">Excerpt</span>
          <RichTextEditor
            value={excerpt}
            onChange={setExcerpt}
            minHeight={140}
            placeholder="Write a short excerpt..."
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-text-secondary">Body</span>
          <RichTextEditor
            value={body}
            onChange={setBody}
            minHeight={340}
            placeholder="Write article body content..."
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-text-secondary">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-dark-border bg-dark-charcoal px-3 py-2 text-text-primary"
            >
              {categoryOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-text-secondary">Tags (comma separated)</span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-1 w-full rounded-xl border border-dark-border bg-dark-charcoal px-3 py-2 text-text-primary placeholder:text-text-muted"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-text-secondary">Featured image URL (optional)</span>
          <input
            value={featuredImage}
            onChange={(e) => setFeaturedImage(e.target.value)}
            className="mt-1 w-full rounded-xl border border-dark-border bg-dark-charcoal px-3 py-2 text-text-primary placeholder:text-text-muted"
          />
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => save(false)}
            disabled={loading || !title || !slug || !stripHtml(body)}
            className="rounded-full border border-dark-border bg-dark-charcoal px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-dark-hover hover:text-text-primary disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            onClick={() => save(true)}
            disabled={loading || !title || !slug || !stripHtml(body)}
            className="rounded-full bg-accent-blue px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-category-news disabled:opacity-50"
          >
            Save and Publish
          </button>
        </div>
      </div>
    </section>
  );
};

export default EditorArticleFormPage;
