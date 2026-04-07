/**
 * MetadataDrawer — slide-over panel for editing per-page SEO metadata.
 * Renders title, description, canonical, keywords, robots, and a live SERP preview.
 * @module features/seo-dashboard/components/MetadataDrawer
 */

import React, { useState } from 'react';
import { XCircle, RefreshCw } from 'lucide-react';
import { useUpsertSeo } from '../../../seo/hooks/useSEO';
import MetaPreview from '../../../seo/components/MetaPreview';

export default function MetadataDrawer({ pageSlug, onClose, onSaved }) {
  const upsert = useUpsertSeo();
  const [form, setForm] = useState({
    title: '', metaDescription: '', canonical: '',
    focusKeywords: '', secondaryKeywords: '',
    changeFrequency: 'weekly', sitemapPriority: 0.6,
    robots: { noindex: false, nofollow: false },
  });

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    const payload = {
      ...form,
      focusKeywords:     form.focusKeywords.split(',').map((k) => k.trim()).filter(Boolean),
      secondaryKeywords: form.secondaryKeywords.split(',').map((k) => k.trim()).filter(Boolean),
    };
    await upsert.mutateAsync({ pageSlug, data: payload });
    onSaved?.();
    onClose();
  }

  const titleLen = form.title.length;
  const descLen  = form.metaDescription.length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="bg-black/40 absolute inset-0" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 w-full max-w-xl h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Edit Metadata — <span className="font-mono text-sm text-indigo-600">{pageSlug}</span>
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-none hover:bg-gray-100 dark:hover:bg-gray-800"><XCircle size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Meta Title
              <span className={`ml-2 font-normal ${titleLen > 60 ? 'text-red-500' : titleLen < 30 ? 'text-amber-500' : 'text-green-500'}`}>{titleLen}/60</span>
            </label>
            <input value={form.title} onChange={(e) => handleChange('title', e.target.value)}
              className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Page title for search engines" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Meta Description
              <span className={`ml-2 font-normal ${descLen > 160 ? 'text-red-500' : descLen < 70 ? 'text-amber-500' : 'text-green-500'}`}>{descLen}/160</span>
            </label>
            <textarea rows={3} value={form.metaDescription} onChange={(e) => handleChange('metaDescription', e.target.value)}
              className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Compelling description (120–160 chars)" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Canonical URL</label>
            <input value={form.canonical} onChange={(e) => handleChange('canonical', e.target.value)}
              className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://example.com/page" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Focus Keywords <span className="font-normal text-gray-400">(comma-separated)</span>
            </label>
            <input value={form.focusKeywords} onChange={(e) => handleChange('focusKeywords', e.target.value)}
              className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="keyword one, keyword two" />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.robots.noindex} onChange={(e) => setForm((p) => ({ ...p, robots: { ...p.robots, noindex: e.target.checked } }))} className="rounded" />
              noindex
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.robots.nofollow} onChange={(e) => setForm((p) => ({ ...p, robots: { ...p.robots, nofollow: e.target.checked } }))} className="rounded" />
              nofollow
            </label>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">SERP Preview</h4>
            <MetaPreview
              title={form.title || 'Page Title'}
              description={form.metaDescription || 'Page description will appear here.'}
              url={form.canonical || `https://example.com/${pageSlug}`}
              mode="serp"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-none border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
          <button onClick={handleSave} disabled={upsert.isPending}
            className="px-4 py-2 text-sm rounded-none bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
            {upsert.isPending && <RefreshCw size={14} className="animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// MukonoTalks

