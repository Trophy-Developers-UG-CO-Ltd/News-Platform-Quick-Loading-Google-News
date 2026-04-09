/**
 * Admin Page Editor — Create / Edit CMS pages
 * Structured form-driven UI with block management, multilingual fields, SEO editing
 * @module pages/admin/AdminPageEditor
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiSave, FiArrowLeft, FiPlus, FiTrash2, FiChevronUp,
  FiChevronDown, FiGlobe, FiEye, FiAlertCircle, FiLink, FiSearch,
  FiFileText, FiLayers,
} from 'react-icons/fi';
import { Search, Share2, Code, LayoutTemplate } from 'lucide-react';
import MediaUploadField from '../../components/admin/MediaUploadField';
import pageService from '../../features/pages/pageService';
import useDocTitle from '../../hooks/useDocTitle';
import Spinner from '../../components/ui/Spinner';
import LucideIconPicker from '../../components/ui/LucideIconPicker';
import SlugChangeDialog from '../../components/admin/SlugChangeDialog';
import toast from 'react-hot-toast';

/* ──────── constants ──────── */
const BLOCK_TYPES = [
  { value: 'page-hero', label: 'Page Hero (image + overlay)' },
  { value: 'hero', label: 'Hero Slider (home page)' },
  { value: 'text', label: 'Text / Paragraph' },
  { value: 'image', label: 'Image' },
  { value: 'cta', label: 'Call-to-Action' },
  { value: 'grid', label: 'Card Grid' },
  { value: 'video', label: 'Video Embed' },
  { value: 'accordion', label: 'Accordion / FAQ' },
];

const LANGS = [
  { code: 'en', label: 'English 🇬🇧' },
  { code: 'zh', label: '中文 🇨🇳' },
  { code: 'sw', label: 'Kiswahili 🇰🇪' },
];

const emptyBlock = (order) => ({
  type: 'text',
  order,
  data: { en: {}, zh: {}, sw: {} },
});

const emptySeo = () => ({
  en: { title: '', description: '', keywords: '', canonicalUrl: '', ogTitle: '', ogDescription: '', ogImage: '' },
  zh: { title: '', description: '', keywords: '', canonicalUrl: '', ogTitle: '', ogDescription: '', ogImage: '' },
  sw: { title: '', description: '', keywords: '', canonicalUrl: '', ogTitle: '', ogDescription: '', ogImage: '' },
});

/* SEO quality indicator */
const SeoBar = ({ value, max, warn, danger }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colour = value > danger ? 'bg-red-500' : value > warn ? 'bg-amber-400' : 'bg-emerald-500';
  return (
    <div className="mt-1 h-1 w-full rounded bg-gray-200">
      <div className={`h-1 rounded transition-all ${colour}`} style={{ width: `${pct}%` }} />
    </div>
  );
};

/* Google SERP preview */
const GooglePreview = ({ title, description, slug, lang }) => {
  const BASE = import.meta.env.VITE_BASE_URL || 'https://mukonotalks.ug';
  const url = `${BASE}/${lang}/${slug || 'page-slug'}`;
  const displayTitle = title || 'Page Title';
  const displayDesc  = description || 'Meta description will appear here. Write 120–160 characters for best results.';
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white">
      <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Google Search Preview</p>
      <p className="text-blue-700 text-lg font-medium truncate">{displayTitle}</p>
      <p className="text-green-700 text-xs mt-0.5 truncate">{url}</p>
      <p className="text-gray-600 text-sm mt-1 line-clamp-2">{displayDesc}</p>
    </div>
  );
};

/* OG / Social preview */
const OgPreview = ({ ogTitle, ogDescription, ogImage, title, description }) => (
  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
    {ogImage
      ? <SafeImage src={ogImage} alt="OG" className="w-full h-36 object-cover" />
      : <div className="w-full h-36 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-400 text-xs">No OG image set</div>
    }
    <div className="p-3">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">mukonotalks.ug</p>
      <p className="font-semibold text-gray-800 text-sm truncate">{ogTitle || title || 'Page Title'}</p>
      <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{ogDescription || description || 'Description shown when shared on social media.'}</p>
    </div>
  </div>
);

/* ──────── helper: generate pageKey from title ──────── */
const slugify = (str) =>
  (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* sanitize slug while typing — keeps trailing hyphen so user can continue typing */
const sanitizeSlugInput = (str) =>
  (str || '').toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-/, '');

/* ================================================================
   BLOCK DATA EDITORS — structured per-type forms
   ================================================================ */

const HeroBlockEditor = ({ data, onChange }) => (
  <div className="space-y-3">
    <label className="block text-xs font-semibold text-gray-500">Heading</label>
    <input className="input" value={data.heading || ''} onChange={(e) => onChange({ ...data, heading: e.target.value })} />
    <label className="block text-xs font-semibold text-gray-500">Subtitle</label>
    <input className="input" value={data.subtitle || ''} onChange={(e) => onChange({ ...data, subtitle: e.target.value })} />
    <label className="block text-xs font-semibold text-gray-500">Background Image URL</label>
    <MediaUploadField
      folder="pages"
      value={data.backgroundImage || ''}
      onChange={(url) => onChange({ ...data, backgroundImage: url })}
    />
    <label className="block text-xs font-semibold text-gray-500">CTA Text</label>
    <input className="input" value={data.ctaText || ''} onChange={(e) => onChange({ ...data, ctaText: e.target.value })} />
    <label className="block text-xs font-semibold text-gray-500">CTA Link</label>
    <input className="input" value={data.ctaLink || ''} onChange={(e) => onChange({ ...data, ctaLink: e.target.value })} placeholder="/products" />
  </div>
);

const PageHeroBlockEditor = ({ data, onChange }) => (
  <div className="space-y-3">
    <label className="block text-xs font-semibold text-gray-500">Badge / Eyebrow Text</label>
    <input className="input" value={data.badge || ''} onChange={(e) => onChange({ ...data, badge: e.target.value })} placeholder="e.g. Trusted Industrial Supplier" />
    <label className="block text-xs font-semibold text-gray-500">Heading</label>
    <textarea className="input min-h-[64px] resize-none" value={data.heading || ''} onChange={(e) => onChange({ ...data, heading: e.target.value })} placeholder="Use a newline to split the heading onto two lines" />
    <label className="block text-xs font-semibold text-gray-500">Subtitle</label>
    <textarea className="input min-h-[80px] resize-none" value={data.subtitle || ''} onChange={(e) => onChange({ ...data, subtitle: e.target.value })} />
    <label className="block text-xs font-semibold text-gray-500">Background Image URL</label>
    <MediaUploadField
      folder="pages"
      value={data.backgroundImage || ''}
      onChange={(url) => onChange({ ...data, backgroundImage: url })}
    />
    <label className="block text-xs font-semibold text-gray-500">Image Opacity (0–100, default 60)</label>
    <input className="input w-24" type="number" min={0} max={100} value={data.overlayOpacity ?? 60} onChange={(e) => onChange({ ...data, overlayOpacity: Number(e.target.value) })} />
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-semibold text-gray-500">Primary Button Text</label>
        <input className="input" value={data.ctaText || ''} onChange={(e) => onChange({ ...data, ctaText: e.target.value })} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500">Primary Button Link</label>
        <input className="input" value={data.ctaLink || ''} onChange={(e) => onChange({ ...data, ctaLink: e.target.value })} placeholder="/products" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500">Secondary Button Text</label>
        <input className="input" value={data.secondaryCtaText || ''} onChange={(e) => onChange({ ...data, secondaryCtaText: e.target.value })} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500">Secondary Button Link</label>
        <input className="input" value={data.secondaryCtaLink || ''} onChange={(e) => onChange({ ...data, secondaryCtaLink: e.target.value })} placeholder="/get-quote" />
      </div>
    </div>
  </div>
);

const TextBlockEditor = ({ data, onChange }) => {
  const bodyStr = Array.isArray(data.body) ? data.body.join('\n') : (data.body || '');
  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-gray-500">Heading</label>
      <input className="input" value={data.heading || ''} onChange={(e) => onChange({ ...data, heading: e.target.value })} />
      <label className="block text-xs font-semibold text-gray-500">Body (one paragraph per line)</label>
      <textarea className="input min-h-[120px]" value={bodyStr}
        onChange={(e) => onChange({ ...data, body: e.target.value.split('\n') })} />
      <label className="block text-xs font-semibold text-gray-500">Highlight / Callout</label>
      <input className="input" value={data.highlight || ''} onChange={(e) => onChange({ ...data, highlight: e.target.value })} />
    </div>
  );
};

const ImageBlockEditor = ({ data, onChange }) => (
  <div className="space-y-3">
    <MediaUploadField
      label="Image"
      folder="pages"
      value={data.src || ''}
      onChange={(url) => onChange({ ...data, src: url })}
    />
    <label className="block text-xs font-semibold text-gray-500">Alt Text</label>
    <input className="input" value={data.alt || ''} onChange={(e) => onChange({ ...data, alt: e.target.value })} />
    <label className="block text-xs font-semibold text-gray-500">Caption</label>
    <input className="input" value={data.caption || ''} onChange={(e) => onChange({ ...data, caption: e.target.value })} />
    <label className="block text-xs font-semibold text-gray-500">Link (optional)</label>
    <input className="input" value={data.link || ''} onChange={(e) => onChange({ ...data, link: e.target.value })} />
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={!!data.fullWidth} onChange={(e) => onChange({ ...data, fullWidth: e.target.checked })} />
      Full Width
    </label>
  </div>
);

const CTABlockEditor = ({ data, onChange }) => (
  <div className="space-y-3">
    <label className="block text-xs font-semibold text-gray-500">Heading</label>
    <input className="input" value={data.heading || ''} onChange={(e) => onChange({ ...data, heading: e.target.value })} />
    <label className="block text-xs font-semibold text-gray-500">Text</label>
    <textarea className="input" value={data.text || ''} onChange={(e) => onChange({ ...data, text: e.target.value })} />
    <label className="block text-xs font-semibold text-gray-500">Button Label</label>
    <input className="input" value={data.buttonText || ''} onChange={(e) => onChange({ ...data, buttonText: e.target.value })} />
    <label className="block text-xs font-semibold text-gray-500">Button Link</label>
    <input className="input" value={data.buttonLink || ''} onChange={(e) => onChange({ ...data, buttonLink: e.target.value })} />
    <label className="block text-xs font-semibold text-gray-500">Variant</label>
    <select className="input" value={data.variant || 'default'} onChange={(e) => onChange({ ...data, variant: e.target.value })}>
      <option value="default">Default</option>
      <option value="dark">Dark</option>
      <option value="accent">Accent</option>
    </select>
  </div>
);

const VideoBlockEditor = ({ data, onChange }) => (
  <div className="space-y-3">
    <label className="block text-xs font-semibold text-gray-500">Video URL (YouTube, Vimeo, or direct)</label>
    <input className="input" value={data.url || ''} onChange={(e) => onChange({ ...data, url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
    <label className="block text-xs font-semibold text-gray-500">Title</label>
    <input className="input" value={data.title || ''} onChange={(e) => onChange({ ...data, title: e.target.value })} />
    <label className="block text-xs font-semibold text-gray-500">Poster Image URL</label>
    <input className="input" value={data.poster || ''} onChange={(e) => onChange({ ...data, poster: e.target.value })} />
  </div>
);

/* Grid block: items array */
const GridBlockEditor = ({ data, onChange }) => {
  const items = data.items || [];

  const updateItem = (idx, field, value) => {
    const updated = items.map((item, i) => (i === idx ? { ...item, [field]: value } : item));
    onChange({ ...data, items: updated });
  };
  const addItem = () => onChange({ ...data, items: [...items, { title: '', description: '' }] });
  const removeItem = (idx) => onChange({ ...data, items: items.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-gray-500">Columns</label>
      <select className="input w-24" value={data.columns || 3} onChange={(e) => onChange({ ...data, columns: Number(e.target.value) })}>
        <option value={2}>2</option>
        <option value={3}>3</option>
        <option value={4}>4</option>
      </select>
      <div className="space-y-3 mt-2">
        {items.map((item, idx) => (
          <div key={idx} className="border rounded p-3 space-y-2 bg-gray-50 relative">
            <button type="button" onClick={() => removeItem(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
              <FiTrash2 className="h-3.5 w-3.5" />
            </button>
            <input className="input" placeholder="Title" value={item.title || ''} onChange={(e) => updateItem(idx, 'title', e.target.value)} />
            <input className="input" placeholder="Description" value={item.description || ''} onChange={(e) => updateItem(idx, 'description', e.target.value)} />
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Icon</label>
              <LucideIconPicker value={item.icon || ''} onChange={(name) => updateItem(idx, 'icon', name)} />
            </div>
            <input className="input" placeholder="Image URL" value={item.image || ''} onChange={(e) => updateItem(idx, 'image', e.target.value)} />
            <input className="input" placeholder="Link URL" value={item.link || ''} onChange={(e) => updateItem(idx, 'link', e.target.value)} />
          </div>
        ))}
      </div>
      <button type="button" onClick={addItem} className="btn-secondary text-sm px-3 py-1 flex items-center gap-1">
        <FiPlus className="h-3.5 w-3.5" /> Add Card
      </button>
    </div>
  );
};

/* Accordion block: items array of question+answer */
const AccordionBlockEditor = ({ data, onChange }) => {
  const items = data.items || [];

  const updateItem = (idx, field, value) => {
    const updated = items.map((item, i) => (i === idx ? { ...item, [field]: value } : item));
    onChange({ ...data, items: updated });
  };
  const addItem = () => onChange({ ...data, items: [...items, { question: '', answer: '' }] });
  const removeItem = (idx) => onChange({ ...data, items: items.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-gray-500">Heading</label>
      <input className="input" value={data.heading || ''} onChange={(e) => onChange({ ...data, heading: e.target.value })} />
      <div className="space-y-3 mt-2">
        {items.map((item, idx) => (
          <div key={idx} className="border rounded p-3 space-y-2 bg-gray-50 relative">
            <button type="button" onClick={() => removeItem(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
              <FiTrash2 className="h-3.5 w-3.5" />
            </button>
            <input className="input" placeholder="Question" value={item.question || ''} onChange={(e) => updateItem(idx, 'question', e.target.value)} />
            <textarea className="input min-h-[60px]" placeholder="Answer" value={item.answer || ''} onChange={(e) => updateItem(idx, 'answer', e.target.value)} />
          </div>
        ))}
      </div>
      <button type="button" onClick={addItem} className="btn-secondary text-sm px-3 py-1 flex items-center gap-1">
        <FiPlus className="h-3.5 w-3.5" /> Add FAQ Item
      </button>
    </div>
  );
};

const BLOCK_EDITORS = {
  'page-hero': PageHeroBlockEditor,
  hero: HeroBlockEditor,
  text: TextBlockEditor,
  image: ImageBlockEditor,
  cta: CTABlockEditor,
  grid: GridBlockEditor,
  video: VideoBlockEditor,
  accordion: AccordionBlockEditor,
};

/* ================================================================
   MAIN EDITOR COMPONENT
   ================================================================ */

const AdminPageEditor = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  useDocTitle(isEdit ? 'Edit Page — Admin' : 'Create Page — Admin');
  const navigate = useNavigate();

  /* form state */
  const [pageKey, setPageKey] = useState('');
  const [title, setTitle] = useState({ en: '', zh: '', sw: '' });
  const [localizedSlug, setLocalizedSlug] = useState({ en: '', zh: '', sw: '' });
  const [contentBlocks, setContentBlocks] = useState([]);
  const [seo, setSeo] = useState(emptySeo());
  const [schemas, setSchemas] = useState([]);
  const [publishStatus, setPublishStatus] = useState('draft');

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [activeLang, setActiveLang] = useState('en');
  const [activeBlockIdx, setActiveBlockIdx] = useState(null);
  const [activeSeoTab, setActiveSeoTab] = useState('basic'); // basic | social | schema

  // Slug-change detection
  const originalSlugRef = useRef(null); // stores localizedSlug at load time
  const [slugDialog, setSlugDialog] = useState({ open: false, oldPath: '', newPath: '' });

  /* load existing page */
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const data = await pageService.getPageById(id);
        const pg = data.page;
        setPageKey(pg.pageKey);
        setTitle(pg.title || { en: '', zh: '', sw: '' });
        setLocalizedSlug(pg.localizedSlug || { en: '', zh: '', sw: '' });
        // ← remember the original slug for change detection
        originalSlugRef.current = { ...(pg.localizedSlug || { en: '', zh: '', sw: '' }) };
        setContentBlocks(pg.contentBlocks || []);
        setSeo(pg.seo || emptySeo());
        setSchemas(pg.schemas || []);
        setPublishStatus(pg.publishStatus);
      } catch (err) {
        toast.error('Failed to load page');
        navigate('/admin/pages');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, isEdit, navigate]);

  /* auto-generate slug from English title (create mode only) */
  const handleTitleChange = (lang, value) => {
    setTitle((prev) => ({ ...prev, [lang]: value }));
    if (lang === 'en' && !isEdit) {
      const slug = slugify(value);
      setLocalizedSlug((prev) => ({ ...prev, en: slug }));
      setPageKey(slug);
    }
  };

  /* ──────── block management ──────── */
  const addBlock = (type) => {
    const order = contentBlocks.length > 0
      ? Math.max(...contentBlocks.map((b) => b.order)) + 1
      : 0;
    setContentBlocks([...contentBlocks, { ...emptyBlock(order), type }]);
    setActiveBlockIdx(contentBlocks.length);
  };

  const removeBlock = (idx) => {
    setContentBlocks(contentBlocks.filter((_, i) => i !== idx).map((b, i) => ({ ...b, order: i })));
    setActiveBlockIdx(null);
  };

  const moveBlock = (idx, direction) => {
    const target = idx + direction;
    if (target < 0 || target >= contentBlocks.length) return;
    const updated = [...contentBlocks];
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    setContentBlocks(updated.map((b, i) => ({ ...b, order: i })));
    setActiveBlockIdx(target);
  };

  const updateBlockType = (idx, type) => {
    const updated = [...contentBlocks];
    updated[idx] = { ...updated[idx], type };
    setContentBlocks(updated);
  };

  const updateBlockData = useCallback((idx, lang, newData) => {
    setContentBlocks((prev) => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        data: { ...updated[idx].data, [lang]: newData },
      };
      return updated;
    });
  }, []);

  /* ──────── SEO management ──────── */
  const updateSeo = (lang, field, value) => {
    setSeo((prev) => ({
      ...prev,
      [lang]: { ...prev[lang], [field]: value },
    }));
  };

  /* ──────── save ──────── */
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      pageKey,
      title,
      localizedSlug,
      contentBlocks: contentBlocks.map((b) => ({
        type: b.type,
        order: b.order,
        data: b.data,
      })),
      seo,
      schemas,
    };

    try {
      if (isEdit) {
        await pageService.updatePage(id, payload);
        toast.success('Page updated');
        // Detect slug change and offer to sync redirects + nav menu
        const origSlug = originalSlugRef.current?.en;
        const newSlug  = localizedSlug.en;
        if (origSlug && newSlug && origSlug !== newSlug) {
          setSlugDialog({
            open:    true,
            oldPath: `/en/${origSlug}`,
            newPath: `/en/${newSlug}`,
          });
          // Advance the baseline so repeated saves don't re-trigger
          originalSlugRef.current = { ...localizedSlug };
        }
      } else {
        const res = await pageService.createPage(payload);
        toast.success('Page created');
        navigate(`/admin/pages/${res.page._id}/edit`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Save failed';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <form onSubmit={handleSave}>

        {/* ── Sticky action bar ─────────────────────────────────────── */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/pages')}
              className="p-2 rounded-none hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
            >
              <FiArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 flex-grow min-w-0">
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-widest leading-none mb-0.5">
                  {isEdit ? 'Page Editor' : 'New Page'}
                </p>
                <h1 className="text-base font-bold text-gray-800 truncate leading-tight">
                  {title.en || (isEdit ? 'Untitled Page' : 'Create Page')}
                </h1>
              </div>
              {isEdit && (
                <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${
                  publishStatus === 'published'
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    : 'bg-amber-50 text-amber-700 ring-amber-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    publishStatus === 'published' ? 'bg-emerald-500' : 'bg-amber-400'
                  }`} />
                  {publishStatus === 'published' ? 'Live' : 'Draft'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isEdit && localizedSlug.en && (
                <a
                  href={
                    publishStatus === 'published'
                      ? `/en/${localizedSlug.en}`
                      : `/en/${localizedSlug.en}?preview=1`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 text-gray-600 transition-colors font-medium"
                  title={publishStatus !== 'published' ? 'Preview draft (admin only)' : 'View live page'}
                >
                  <FiEye className="h-3.5 w-3.5" /> {publishStatus === 'published' ? 'View Live' : 'Preview Draft'}
                </a>
              )}
              <button
                type="button"
                onClick={() => navigate('/admin/pages')}
                className="hidden sm:inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-none hover:bg-gray-50 text-gray-600 transition-colors font-medium"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-none shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving
                  ? <><Spinner size="sm" /><span className="ml-1">Saving…</span></>
                  : <><FiSave className="h-4 w-4" /><span>{isEdit ? 'Update Page' : 'Create Page'}</span></>
                }
              </button>
            </div>
          </div>
        </div>

        {/* ── Scrollable content ──────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Language Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {LANGS.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              onClick={() => setActiveLang(code)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeLang === code ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <FiGlobe className="inline h-3.5 w-3.5 mr-1" />{label}
            </button>
          ))}
        </div>

        {activeLang !== 'en' && (
          <div className="flex items-center gap-2.5 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 mb-4">
            <FiAlertCircle className="h-4 w-4 flex-shrink-0 text-blue-500" />
            <span>Fields in this language are <strong className="font-semibold">optional</strong>. English content is required before publishing.</span>
          </div>
        )}

        {/* Basic Info */}
        <div className="card p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary-50">
              <FiFileText className="h-3.5 w-3.5 text-primary-600" />
            </span>
            Page Info
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Page Key {!isEdit && <span className="text-gray-400">(auto-generated)</span>}
              </label>
              <input
                className="input font-mono"
                value={pageKey}
                onChange={(e) => setPageKey(sanitizeSlugInput(e.target.value))}
                disabled={isEdit}
                required
                placeholder="about-us"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Title ({activeLang.toUpperCase()}) {activeLang === 'en' && <span className="text-red-500">*</span>}
              </label>
              <input
                className="input"
                value={title[activeLang] || ''}
                onChange={(e) => handleTitleChange(activeLang, e.target.value)}
                required={activeLang === 'en'}
                placeholder="Page title..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                URL Slug ({activeLang.toUpperCase()}) {activeLang === 'en' && <span className="text-red-500">*</span>}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">/{activeLang}/</span>
                <input
                  className="input flex-grow font-mono"
                  value={localizedSlug[activeLang] || ''}
                  onChange={(e) => setLocalizedSlug((prev) => ({ ...prev, [activeLang]: sanitizeSlugInput(e.target.value) }))}
                  required={activeLang === 'en'}
                  placeholder="page-slug"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content Blocks */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-violet-50">
                <FiLayers className="h-3.5 w-3.5 text-violet-600" />
              </span>
              Content Blocks
            </h2>
            <div className="relative group">
              <button type="button" className="btn-primary px-3 py-1.5 text-sm flex items-center gap-1">
                <FiPlus className="h-4 w-4" /> Add Block
              </button>
              <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border py-2 w-48 z-20">
                {BLOCK_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => addBlock(value)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {contentBlocks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No blocks yet. Add your first content block above.
            </p>
          ) : (
            <div className="space-y-4">
              {contentBlocks.map((block, idx) => {
                const isActive = activeBlockIdx === idx;
                const BlockEditor = BLOCK_EDITORS[block.type];
                return (
                  <div key={idx} className={`border rounded-lg overflow-hidden ${isActive ? 'border-primary-400 shadow' : 'border-gray-200'}`}>
                    {/* Block header */}
                    <div
                      className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer"
                      onClick={() => setActiveBlockIdx(isActive ? null : idx)}
                    >
                      <span className="text-xs font-bold text-gray-400 w-6 text-center">{idx + 1}</span>
                      <select
                        value={block.type}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => { e.stopPropagation(); updateBlockType(idx, e.target.value); }}
                        className="text-sm border rounded-[48px] px-2 py-1 bg-white"
                      >
                        {BLOCK_TYPES.map(({ value, label }) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <span className="text-xs text-gray-400 flex-grow">
                        ({activeLang.toUpperCase()})
                      </span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={(e) => { e.stopPropagation(); moveBlock(idx, -1); }}
                          disabled={idx === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                          <FiChevronUp className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); moveBlock(idx, 1); }}
                          disabled={idx === contentBlocks.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                          <FiChevronDown className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeBlock(idx); }}
                          className="p-1 text-red-400 hover:text-red-600">
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Block content (expanded) */}
                    {isActive && BlockEditor && (
                      <div className="p-4 border-t bg-white">
                        <BlockEditor
                          data={block.data?.[activeLang] || {}}
                          onChange={(newData) => updateBlockData(idx, activeLang, newData)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SEO */}
        <div className="card p-6 mb-6">
          {/* Tab bar */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50">
                <FiSearch className="h-3.5 w-3.5 text-emerald-600" />
              </span>
              SEO &amp; Metadata
              <span className="ml-1 px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-500 font-medium">{activeLang.toUpperCase()}</span>
            </h2>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {[
                { id: 'basic',  label: 'Search', Icon: Search },
                { id: 'social', label: 'Social',  Icon: Share2 },
                { id: 'schema', label: 'Schema',  Icon: Code },
              ].map(({ id, label, Icon }) => (
                <button key={id} type="button"
                  onClick={() => setActiveSeoTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-semibold transition-colors ${
                    activeSeoTab === id ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>
          </div>

          {/* ── BASIC (Search) ─────────────────────────────── */}
          {activeSeoTab === 'basic' && (
            <div className="space-y-5">
              {/* Google preview */}
              <GooglePreview
                title={seo[activeLang]?.title}
                description={seo[activeLang]?.description}
                slug={localizedSlug[activeLang]}
                lang={activeLang}
              />

              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="block text-sm font-medium text-gray-600">Meta Title</label>
                  <span className={`text-xs ${(seo[activeLang]?.title || '').length > 60 ? 'text-red-500' : 'text-gray-400'}`}>
                    {(seo[activeLang]?.title || '').length}/60
                  </span>
                </div>
                <input
                  className="input"
                  value={seo[activeLang]?.title || ''}
                  onChange={(e) => updateSeo(activeLang, 'title', e.target.value)}
                  maxLength={120}
                  placeholder="Descriptive title for search engines (50–60 chars ideal)…"
                />
                <SeoBar value={(seo[activeLang]?.title || '').length} max={120} warn={60} danger={80} />
                <p className="text-xs text-gray-400 mt-1">Falls back to the page title if empty.</p>
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="block text-sm font-medium text-gray-600">Meta Description</label>
                  <span className={`text-xs ${(seo[activeLang]?.description || '').length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                    {(seo[activeLang]?.description || '').length}/160
                  </span>
                </div>
                <textarea
                  className="input min-h-[80px] resize-none"
                  value={seo[activeLang]?.description || ''}
                  onChange={(e) => updateSeo(activeLang, 'description', e.target.value)}
                  maxLength={300}
                  placeholder="Compelling summary for search results (120–160 chars ideal)…"
                />
                <SeoBar value={(seo[activeLang]?.description || '').length} max={300} warn={160} danger={200} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Keywords</label>
                <input
                  className="input"
                  value={Array.isArray(seo[activeLang]?.keywords) ? seo[activeLang].keywords.join(', ') : (seo[activeLang]?.keywords || '')}
                  onChange={(e) => updateSeo(activeLang, 'keywords', e.target.value)}
                  placeholder="chemical, supplier, east africa (comma-separated)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1.5">
                  <FiLink className="h-3.5 w-3.5" /> Canonical URL
                </label>
                <input
                  className="input font-mono text-sm"
                  type="url"
                  value={seo[activeLang]?.canonicalUrl || ''}
                  onChange={(e) => updateSeo(activeLang, 'canonicalUrl', e.target.value)}
                  placeholder="https://mukonotalks.ug/en/about (leave blank to auto-generate)"
                />
                <p className="text-xs text-gray-400 mt-1">Only set if this page duplicates another URL. Leave blank otherwise.</p>
              </div>
            </div>
          )}

          {/* ── SOCIAL (OG) ────────────────────────────────── */}
          {activeSeoTab === 'social' && (
            <div className="space-y-5">
              <OgPreview
                ogTitle={seo[activeLang]?.ogTitle}
                ogDescription={seo[activeLang]?.ogDescription}
                ogImage={seo[activeLang]?.ogImage}
                title={seo[activeLang]?.title || title[activeLang]}
                description={seo[activeLang]?.description}
              />
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">OG Title</label>
                <input
                  className="input"
                  value={seo[activeLang]?.ogTitle || ''}
                  onChange={(e) => updateSeo(activeLang, 'ogTitle', e.target.value)}
                  placeholder="Falls back to Meta Title if empty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">OG Description</label>
                <textarea
                  className="input min-h-[70px] resize-none"
                  value={seo[activeLang]?.ogDescription || ''}
                  onChange={(e) => updateSeo(activeLang, 'ogDescription', e.target.value)}
                  placeholder="Falls back to Meta Description if empty"
                />
              </div>
              <div>
                <MediaUploadField
                  label="OG / Social Image"
                  hint="Shown when shared on LinkedIn, Facebook, Twitter/X, WhatsApp"
                  folder="seo"
                  recommendedSize="1200×630"
                  value={seo[activeLang]?.ogImage || ''}
                  onChange={(url) => updateSeo(activeLang, 'ogImage', url)}
                />
              </div>
            </div>
          )}

          {/* ── SCHEMA (JSON-LD) ───────────────────────────── */}
          {activeSeoTab === 'schema' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                JSON-LD structured data injected into <code className="bg-gray-100 px-1 rounded text-xs">&lt;script type="application/ld+json"&gt;</code>.
                Helps Google understand page context and may generate rich results.
              </p>

              {/* Presets */}
              <div className="flex flex-wrap gap-2">
                <button type="button"
                  onClick={() => setSchemas((s) => [...s, {
                    '@context': 'https://schema.org',
                    '@type': 'WebPage',
                    name: title.en || '',
                    description: seo.en?.description || '',
                    url: `${(import.meta.env.VITE_BASE_URL || 'https://mukonotalks.ug')}/en/${localizedSlug.en || ''}`,
                    inLanguage: 'en',
                    isPartOf: { '@type': 'WebSite', name: 'MukonoTalks', url: import.meta.env.VITE_BASE_URL || 'https://mukonotalks.ug' },
                  }])}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1.5 rounded-none hover:bg-primary-100 transition-colors"
                >
                  <LayoutTemplate className="w-3.5 h-3.5" /> + WebPage Schema
                </button>
                <button type="button"
                  onClick={() => setSchemas((s) => [...s, {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                      { '@type': 'ListItem', position: 1, name: 'Home', item: import.meta.env.VITE_BASE_URL || 'https://mukonotalks.ug' },
                      { '@type': 'ListItem', position: 2, name: title.en || 'Page', item: `${(import.meta.env.VITE_BASE_URL || 'https://mukonotalks.ug')}/en/${localizedSlug.en || ''}` },
                    ],
                  }])}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-none hover:bg-amber-100 transition-colors"
                >
                  <Code className="w-3.5 h-3.5" /> + Breadcrumb Schema
                </button>
                <button type="button"
                  onClick={() => setSchemas((s) => [...s, { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [] }])}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-none hover:bg-teal-100 transition-colors"
                >
                  <Code className="w-3.5 h-3.5" /> + FAQ Schema
                </button>
              </div>

              {/* Schema list */}
              {schemas.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
                  No schemas yet. Use the presets above to add common ones.
                </p>
              )}
              {schemas.map((sc, idx) => {
                let jsonStr = '';
                try { jsonStr = JSON.stringify(sc, null, 2); } catch { jsonStr = ''; }
                return (
                  <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-gray-200">
                      <span className="text-xs font-semibold text-gray-600 font-mono">{sc['@type'] || `Schema ${idx + 1}`}</span>
                      <button type="button" onClick={() => setSchemas((s) => s.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-600">
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <textarea
                      className="w-full font-mono text-xs p-3 min-h-[140px] resize-y bg-gray-950 text-green-300 focus:outline-none"
                      value={jsonStr}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setSchemas((s) => s.map((item, i) => (i === idx ? parsed : item)));
                        } catch { /* keep old value while user types */ }
                      }}
                      spellCheck={false}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        </div>{/* end scrollable content */}
      </form>

      {/* Slug change sync dialog */}
      <SlugChangeDialog
        open={slugDialog.open}
        oldPath={slugDialog.oldPath}
        newPath={slugDialog.newPath}
        resourceType="page"
        onClose={() => setSlugDialog((s) => ({ ...s, open: false }))}
      />
    </div>
  );
};

export default AdminPageEditor;

// MukonoTalks

