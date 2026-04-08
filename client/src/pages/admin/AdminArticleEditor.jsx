/**
 * Admin Article Editor
 * Full structured form editor for enterprise publishing engine
 * Language tabs, block editors, SEO, scheduling, knowledge base extensions
 * @module pages/admin/AdminArticleEditor
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import articleService from '../../features/articles/articleService';
import categoryService from '../../features/articles/categoryService';
import Spinner from '../../components/ui/Spinner';
import SlugChangeDialog from '../../components/admin/SlugChangeDialog';
import toast from 'react-hot-toast';
import RichTextEditor from '../../components/ui/RichTextEditor';
import {
  FiSave,
  FiEye,
  FiPlus,
  FiTrash2,
  FiChevronUp,
  FiChevronDown,
  FiCalendar,
  FiArrowLeft,
} from 'react-icons/fi';
import MediaUploadField from '../../components/admin/MediaUploadField';

const LANGS = ['en', 'zh', 'sw'];
const LANG_LABELS = { en: 'English', zh: 'Chinese (中文)', sw: 'Swahili (Kiswahili)' };
const BLOCK_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'image', label: 'Image' },
  { value: 'quote', label: 'Quote' },
  { value: 'code', label: 'Code' },
  { value: 'list', label: 'List' },
  { value: 'video', label: 'Video' },
];
const FALLBACK_CATEGORIES = [
  { value: 'news', label: 'News' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'politics', label: 'Politics' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'opportunities', label: 'Opportunities' },
  { value: 'knowledge-base', label: 'Knowledge Base' },
];

const emptyArticle = {
  title: { en: '', zh: '', sw: '' },
  localizedSlug: { en: '', zh: '', sw: '' },
  excerpt: { en: '', zh: '', sw: '' },
  contentBlocks: [],
  category: 'news',
  tags: [],
  author: { name: '', role: '' },
  featuredImage: '',
  seo: {
    en: { title: '', description: '' },
    zh: { title: '', description: '' },
    sw: { title: '', description: '' },
  },
  relatedProducts: [],
  attachments: [],
  technicalReferences: [],
};

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

/* sanitize slug while typing — keeps trailing hyphen so user can continue typing */
const sanitizeSlugInput = (str) =>
  (str || '').toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-/, '');

const AdminArticleEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [article, setArticle] = useState(emptyArticle);
  const [activeLang, setActiveLang] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState(FALLBACK_CATEGORIES);
  const [tagInput, setTagInput] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  // Slug-change detection
  const originalSlugRef = useRef(null);
  const [slugDialog, setSlugDialog] = useState({ open: false, oldPath: '', newPath: '' });

  useEffect(() => {
    let mounted = true;

    const loadCategories = async () => {
      try {
        const result = await categoryService.listCategories();
        const options = categoryService.normalizeCategoryOptions(result?.categories || []);
        if (mounted && options.length) {
          setCategoryOptions(options);
          setArticle((prev) => ({
            ...prev,
            category: options.some((option) => option.value === prev.category)
              ? prev.category
              : options[0].value,
          }));
        }
      } catch (_) {
        if (mounted) setCategoryOptions(FALLBACK_CATEGORIES);
      }
    };

    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (isEditing) {
      setIsLoading(true);
      articleService
        .getArticleById(id)
        .then((res) => {
          const a = res.article;
          setArticle({
            title: a.title || { en: '', zh: '', sw: '' },
            localizedSlug: a.localizedSlug || { en: '', zh: '', sw: '' },
            excerpt: a.excerpt || { en: '', zh: '', sw: '' },
            contentBlocks: a.contentBlocks || [],
            category: a.category || 'news',
            tags: a.tags || [],
            author: a.author || { name: '', role: '' },
            featuredImage: a.featuredImage || '',
            seo: a.seo || { en: {}, zh: {}, sw: {} },
            relatedProducts: a.relatedProducts || [],
            attachments: a.attachments || [],
            technicalReferences: a.technicalReferences || [],
          });
          // capture for slug-change detection
          originalSlugRef.current = { ...(a.localizedSlug || { en: '', zh: '', sw: '' }) };
          if (a.scheduledAt) {
            setScheduleDate(new Date(a.scheduledAt).toISOString().slice(0, 16));
            setShowSchedule(true);
          }
        })
        .catch((err) => {
          toast.error(err.response?.data?.message || 'Failed to load article');
          navigate('/admin/articles');
        })
        .finally(() => setIsLoading(false));
    }
  }, [id, isEditing, navigate]);

  // Auto-slug from English title
  const handleTitleChange = (lang, value) => {
    setArticle((prev) => {
      const next = { ...prev, title: { ...prev.title, [lang]: value } };
      if (lang === 'en' && !isEditing) {
        next.localizedSlug = { ...prev.localizedSlug, en: slugify(value) };
      }
      return next;
    });
  };

  const updateField = (path, value) => {
    setArticle((prev) => {
      const keys = path.split('.');
      const updated = JSON.parse(JSON.stringify(prev));
      let obj = updated;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  // ─── Block Management ─────────────────────────────────
  const addBlock = (type) => {
    const maxOrder = article.contentBlocks.reduce((max, b) => Math.max(max, b.order), -1);
    const newBlock = {
      type,
      order: maxOrder + 1,
      data: { en: {}, zh: null, sw: null },
    };
    setArticle((prev) => ({
      ...prev,
      contentBlocks: [...prev.contentBlocks, newBlock],
    }));
  };

  const updateBlock = (index, field, value) => {
    setArticle((prev) => {
      const blocks = [...prev.contentBlocks];
      if (field === 'data') {
        blocks[index] = { ...blocks[index], data: { ...blocks[index].data, [activeLang]: value } };
      } else {
        blocks[index] = { ...blocks[index], [field]: value };
      }
      return { ...prev, contentBlocks: blocks };
    });
  };

  const removeBlock = (index) => {
    setArticle((prev) => ({
      ...prev,
      contentBlocks: prev.contentBlocks.filter((_, i) => i !== index),
    }));
  };

  const moveBlock = (index, direction) => {
    setArticle((prev) => {
      const blocks = [...prev.contentBlocks];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= blocks.length) return prev;
      const tempOrder = blocks[index].order;
      blocks[index] = { ...blocks[index], order: blocks[targetIndex].order };
      blocks[targetIndex] = { ...blocks[targetIndex], order: tempOrder };
      blocks.sort((a, b) => a.order - b.order);
      return { ...prev, contentBlocks: blocks };
    });
  };

  // ─── Tags ─────────────────────────────────────────────
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !article.tags.includes(tag)) {
      setArticle((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput('');
  };

  const removeTag = (tag) => {
    setArticle((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  // ─── Attachments (Knowledge Base) ─────────────────────
  const addAttachment = () => {
    setArticle((prev) => ({
      ...prev,
      attachments: [...prev.attachments, { label: '', url: '', fileType: '' }],
    }));
  };

  const updateAttachment = (index, field, value) => {
    setArticle((prev) => {
      const att = [...prev.attachments];
      att[index] = { ...att[index], [field]: value };
      return { ...prev, attachments: att };
    });
  };

  const removeAttachment = (index) => {
    setArticle((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  // ─── Technical References ─────────────────────────────
  const addReference = () => {
    setArticle((prev) => ({
      ...prev,
      technicalReferences: [...prev.technicalReferences, ''],
    }));
  };

  const updateReference = (index, value) => {
    setArticle((prev) => {
      const refs = [...prev.technicalReferences];
      refs[index] = value;
      return { ...prev, technicalReferences: refs };
    });
  };

  const removeReference = (index) => {
    setArticle((prev) => ({
      ...prev,
      technicalReferences: prev.technicalReferences.filter((_, i) => i !== index),
    }));
  };

  // ─── Save ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!article.title.en) return toast.error('English title is required');
    if (!article.localizedSlug.en) return toast.error('English slug is required');
    if (!article.category) return toast.error('Category is required');

    setIsSaving(true);
    try {
      if (isEditing) {
        await articleService.updateArticle(id, article);
        toast.success('Article updated successfully');
        // Detect slug change and offer to sync redirects + nav menu
        const origSlug = originalSlugRef.current?.en;
        const newSlug  = article.localizedSlug?.en;
        if (origSlug && newSlug && origSlug !== newSlug) {
          setSlugDialog({
            open:    true,
            oldPath: `/en/blog/${origSlug}`,
            newPath: `/en/blog/${newSlug}`,
          });
          originalSlugRef.current = { ...article.localizedSlug };
        }
      } else {
        const res = await articleService.createArticle(article);
        toast.success('Article created successfully');
        navigate(`/admin/articles/${res.article._id}/edit`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save article');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Schedule ─────────────────────────────────────────
  const handleSchedule = async () => {
    if (!scheduleDate) return toast.error('Please select a schedule date');
    try {
      await articleService.scheduleArticle(id, new Date(scheduleDate).toISOString());
      toast.success('Article scheduled successfully');
      navigate('/admin/articles');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule article');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/admin/articles" className="text-gray-400 hover:text-gray-600">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Edit Article' : 'New Article'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && article.localizedSlug?.en && (
            <Link
              to={`/en/blog/${article.localizedSlug.en}`}
              target="_blank"
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FiEye className="h-4 w-4" /> Preview
            </Link>
          )}
          {isEditing && (
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-blue-300 text-blue-600 rounded-none hover:bg-blue-50"
            >
              <FiCalendar className="h-4 w-4" /> Schedule
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1 btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            <FiSave className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Schedule Panel */}
      {showSchedule && isEditing && (
        <div className="card p-4 mb-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">Schedule Publishing</h3>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm text-blue-700 mb-1">Publish Date & Time</label>
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-[48px] focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <button
              onClick={handleSchedule}
              className="px-4 py-2 bg-blue-600 text-white rounded-none hover:bg-blue-700 text-sm"
            >
              Confirm Schedule
            </button>
          </div>
        </div>
      )}

      {/* Language Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {LANGS.map((lang) => (
          <button
            key={lang}
            onClick={() => setActiveLang(lang)}
            className={`px-4 py-2 text-sm rounded-none transition-colors ${
              activeLang === lang
                ? 'bg-white text-primary-700 shadow-sm font-medium'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {LANG_LABELS[lang]}
          </button>
        ))}
      </div>

      {/* Basic Info */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title ({LANG_LABELS[activeLang]}) {activeLang === 'en' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={article.title[activeLang] || ''}
              onChange={(e) => handleTitleChange(activeLang, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-[48px] focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder="Article title..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug ({LANG_LABELS[activeLang]}) {activeLang === 'en' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={article.localizedSlug[activeLang] || ''}
              onChange={(e) => updateField(`localizedSlug.${activeLang}`, sanitizeSlugInput(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-[48px] focus:ring-2 focus:ring-primary-500 text-sm font-mono"
              placeholder="article-url-slug"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={article.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-[48px] focus:ring-2 focus:ring-primary-500 text-sm bg-white"
            >
              {categoryOptions.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Excerpt ({LANG_LABELS[activeLang]})
            </label>
            <RichTextEditor
              value={article.excerpt[activeLang] || ''}
              onChange={(html) => updateField(`excerpt.${activeLang}`, html)}
              minHeight={140}
              placeholder="Brief summary..."
            />
          </div>
        </div>
      </div>

      {/* Author & Featured Image */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Author & Media</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author Name</label>
            <input
              type="text"
              value={article.author.name || ''}
              onChange={(e) => updateField('author.name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-[48px] focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author Role</label>
            <input
              type="text"
              value={article.author.role || ''}
              onChange={(e) => updateField('author.role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-[48px] focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder="e.g., Technical Director"
            />
          </div>
          <div>
            <MediaUploadField
              label="Featured Image"
              hint="Shown at the top of the article"
              folder="articles"
              recommendedSize="1200×630"
              value={article.featuredImage || ''}
              onChange={(url) => updateField('featuredImage', url)}
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Tags</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-[48px] focus:ring-2 focus:ring-primary-500 text-sm"
            placeholder="Add a tag and press Enter..."
          />
          <button onClick={addTag} className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 text-sm">
            Add
          </button>
        </div>
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="text-primary-400 hover:text-red-600">
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content Blocks */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Content Blocks ({LANG_LABELS[activeLang]})
          </h2>
          <div className="flex gap-2">
            {BLOCK_TYPES.map((bt) => (
              <button
                key={bt.value}
                onClick={() => addBlock(bt.value)}
                className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-none hover:bg-primary-50 hover:border-primary-300 transition-colors"
              >
                + {bt.label}
              </button>
            ))}
          </div>
        </div>

        {article.contentBlocks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No content blocks yet. Add blocks using the buttons above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {[...article.contentBlocks]
              .sort((a, b) => a.order - b.order)
              .map((block, index) => (
                <BlockEditor
                  key={block._id || `block-${index}`}
                  block={block}
                  index={index}
                  lang={activeLang}
                  totalBlocks={article.contentBlocks.length}
                  onUpdate={updateBlock}
                  onRemove={removeBlock}
                  onMove={moveBlock}
                />
              ))}
          </div>
        )}
      </div>

      {/* SEO */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          SEO ({LANG_LABELS[activeLang]})
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SEO Title
              <span className="text-gray-400 ml-2">
                {(article.seo[activeLang]?.title || '').length}/120
              </span>
            </label>
            <input
              type="text"
              value={article.seo[activeLang]?.title || ''}
              onChange={(e) => updateField(`seo.${activeLang}.title`, e.target.value)}
              maxLength={120}
              className="w-full px-3 py-2 border border-gray-300 rounded-[48px] focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SEO Description
              <span className="text-gray-400 ml-2">
                {(article.seo[activeLang]?.description || '').length}/320
              </span>
            </label>
            <textarea
              value={article.seo[activeLang]?.description || ''}
              onChange={(e) => updateField(`seo.${activeLang}.description`, e.target.value)}
              maxLength={320}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-[48px] focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Knowledge Base Extensions */}
      {article.category === 'knowledge-base' && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Knowledge Base Extensions</h2>

          {/* Attachments */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Downloadable Attachments</h3>
              <button
                onClick={addAttachment}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 rounded-none hover:bg-gray-200"
              >
                <FiPlus className="h-3 w-3" /> Add Attachment
              </button>
            </div>
            {article.attachments.map((att, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={att.label}
                  onChange={(e) => updateAttachment(i, 'label', e.target.value)}
                  placeholder="Label"
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded-[48px] text-sm"
                />
                <input
                  type="text"
                  value={att.url}
                  onChange={(e) => updateAttachment(i, 'url', e.target.value)}
                  placeholder="URL"
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded-[48px] text-sm"
                />
                <input
                  type="text"
                  value={att.fileType || ''}
                  onChange={(e) => updateAttachment(i, 'fileType', e.target.value)}
                  placeholder="PDF"
                  className="w-20 px-2 py-1.5 border border-gray-300 rounded-[48px] text-sm"
                />
                <button onClick={() => removeAttachment(i)} className="text-red-400 hover:text-red-600">
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Technical References */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Technical References</h3>
              <button
                onClick={addReference}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 rounded-none hover:bg-gray-200"
              >
                <FiPlus className="h-3 w-3" /> Add Reference
              </button>
            </div>
            {article.technicalReferences.map((ref, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={ref}
                  onChange={(e) => updateReference(i, e.target.value)}
                  placeholder="Reference URL or description"
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded-[48px] text-sm"
                />
                <button onClick={() => removeReference(i)} className="text-red-400 hover:text-red-600">
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slug change sync dialog */}
      <SlugChangeDialog
        open={slugDialog.open}
        oldPath={slugDialog.oldPath}
        newPath={slugDialog.newPath}
        resourceType="article"
        onClose={() => setSlugDialog((s) => ({ ...s, open: false }))}
      />
    </div>
  );
};

// ─── Block Editor Component ─────────────────────────────────

const BlockEditor = ({ block, index, lang, totalBlocks, onUpdate, onRemove, onMove }) => {
  const data = block.data?.[lang] || {};

  const updateData = (field, value) => {
    onUpdate(index, 'data', { ...data, [field]: value });
  };

  const renderEditor = () => {
    switch (block.type) {
      case 'text':
        return <TextBlockEditor data={data} onChange={updateData} />;
      case 'image':
        return <ImageBlockEditor data={data} onChange={updateData} />;
      case 'quote':
        return <QuoteBlockEditor data={data} onChange={updateData} />;
      case 'code':
        return <CodeBlockEditor data={data} onChange={updateData} />;
      case 'list':
        return <ListBlockEditor data={data} onChange={updateData} />;
      case 'video':
        return <VideoBlockEditor data={data} onChange={updateData} />;
      default:
        return <p className="text-gray-400 text-sm">Unknown block type: {block.type}</p>;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white bg-gray-600 rounded px-2 py-0.5 uppercase">
            {block.type}
          </span>
          <span className="text-xs text-gray-400">Order: {block.order}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMove(index, 'up')}
            disabled={index === 0}
            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
          >
            <FiChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => onMove(index, 'down')}
            disabled={index === totalBlocks - 1}
            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
          >
            <FiChevronDown className="h-4 w-4" />
          </button>
          <button
            onClick={() => onRemove(index)}
            className="p-1 text-gray-400 hover:text-red-600"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {renderEditor()}
    </div>
  );
};

// ─── Per-Type Block Editors ──────────────────────────────────

const TextBlockEditor = ({ data, onChange }) => (
  <div className="space-y-3">
    <input
      type="text"
      value={data.heading || ''}
      onChange={(e) => onChange('heading', e.target.value)}
      placeholder="Heading"
      className="w-full px-3 py-2 border border-gray-300 rounded-[48px] text-sm"
    />
    <input
      type="text"
      value={data.subheading || ''}
      onChange={(e) => onChange('subheading', e.target.value)}
      placeholder="Subheading (optional)"
      className="w-full px-3 py-2 border border-gray-300 rounded-[48px] text-sm"
    />
    <RichTextEditor
      value={Array.isArray(data.body) ? data.body.map((part) => `<p>${part}</p>`).join('') : data.body || ''}
      onChange={(html) => onChange('body', html)}
      minHeight={220}
      placeholder="Write body content..."
    />
    <input
      type="text"
      value={data.highlight || ''}
      onChange={(e) => onChange('highlight', e.target.value)}
      placeholder="Highlight / callout (optional)"
      className="w-full px-3 py-2 border border-gray-300 rounded-[48px] text-sm"
    />
  </div>
);

const ImageBlockEditor = ({ data, onChange }) => (
  <div className="space-y-3">
    <MediaUploadField
      label="Image"
      folder="articles"
      value={data.src || ''}
      onChange={(url) => onChange('src', url)}
    />
    <div className="grid grid-cols-2 gap-3">
      <input
        type="text"
        value={data.alt || ''}
        onChange={(e) => onChange('alt', e.target.value)}
        placeholder="Alt text"
        className="px-3 py-2 border border-gray-300 rounded-[48px] text-sm"
      />
      <input
        type="text"
        value={data.caption || ''}
        onChange={(e) => onChange('caption', e.target.value)}
        placeholder="Caption"
        className="px-3 py-2 border border-gray-300 rounded-[48px] text-sm"
      />
    </div>
    <input
      type="text"
      value={data.credit || ''}
      onChange={(e) => onChange('credit', e.target.value)}
      placeholder="Photo credit (optional)"
      className="w-full px-3 py-2 border border-gray-300 rounded-[48px] text-sm"
    />
    <label className="flex items-center gap-2 text-sm text-gray-600">
      <input
        type="checkbox"
        checked={data.fullWidth || false}
        onChange={(e) => onChange('fullWidth', e.target.checked)}
        className="rounded"
      />
      Full width image
    </label>
  </div>
);

const QuoteBlockEditor = ({ data, onChange }) => (
  <div className="space-y-3">
    <RichTextEditor
      value={data.quote || ''}
      onChange={(html) => onChange('quote', html)}
      minHeight={140}
      placeholder="Quote text"
    />
    <div className="grid grid-cols-2 gap-3">
      <input
        type="text"
        value={data.attribution || ''}
        onChange={(e) => onChange('attribution', e.target.value)}
        placeholder="Attribution (who said it)"
        className="px-3 py-2 border border-gray-300 rounded-[48px] text-sm"
      />
      <input
        type="text"
        value={data.role || ''}
        onChange={(e) => onChange('role', e.target.value)}
        placeholder="Role / title"
        className="px-3 py-2 border border-gray-300 rounded-[48px] text-sm"
      />
    </div>
  </div>
);

const CodeBlockEditor = ({ data, onChange }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <input
        type="text"
        value={data.language || ''}
        onChange={(e) => onChange('language', e.target.value)}
        placeholder="Language (e.g., javascript)"
        className="px-3 py-2 border border-gray-300 rounded-[48px] text-sm"
      />
      <input
        type="text"
        value={data.title || ''}
        onChange={(e) => onChange('title', e.target.value)}
        placeholder="Title (optional)"
        className="px-3 py-2 border border-gray-300 rounded-[48px] text-sm"
      />
    </div>
    <textarea
      value={data.code || ''}
      onChange={(e) => onChange('code', e.target.value)}
      rows={8}
      placeholder="Code snippet..."
      className="w-full px-3 py-2 border border-gray-300 rounded-[48px] text-sm font-mono bg-gray-900 text-green-400"
    />
  </div>
);

const ListBlockEditor = ({ data, onChange }) => {
  const items = data.items || [];

  const addItem = () => onChange('items', [...items, '']);
  const updateItem = (i, val) => {
    const updated = [...items];
    updated[i] = val;
    onChange('items', updated);
  };
  const removeItem = (i) => onChange('items', items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div className="flex gap-3 items-center">
        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="List title (optional)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-[48px] text-sm"
        />
        <select
          value={data.listType || 'unordered'}
          onChange={(e) => onChange('listType', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-[48px] text-sm bg-white"
        >
          <option value="unordered">Bullet List</option>
          <option value="ordered">Numbered List</option>
        </select>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <span className="text-sm text-gray-400 mt-2 w-6">{i + 1}.</span>
          <input
            type="text"
            value={item}
            onChange={(e) => updateItem(i, e.target.value)}
            placeholder="List item"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-[48px] text-sm"
          />
          <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
      >
        <FiPlus className="h-3 w-3" /> Add Item
      </button>
    </div>
  );
};

const VideoBlockEditor = ({ data, onChange }) => (
  <div className="space-y-3">
    <input
      type="text"
      value={data.url || ''}
      onChange={(e) => onChange('url', e.target.value)}
      placeholder="Video URL (YouTube, Vimeo, or direct)"
      className="w-full px-3 py-2 border border-gray-300 rounded-[48px] text-sm"
    />
    <div className="grid grid-cols-2 gap-3">
      <input
        type="text"
        value={data.title || ''}
        onChange={(e) => onChange('title', e.target.value)}
        placeholder="Title (optional)"
        className="px-3 py-2 border border-gray-300 rounded-[48px] text-sm"
      />
      <input
        type="text"
        value={data.caption || ''}
        onChange={(e) => onChange('caption', e.target.value)}
        placeholder="Caption (optional)"
        className="px-3 py-2 border border-gray-300 rounded-[48px] text-sm"
      />
    </div>
  </div>
);

export default AdminArticleEditor;

// MukonoTalks

