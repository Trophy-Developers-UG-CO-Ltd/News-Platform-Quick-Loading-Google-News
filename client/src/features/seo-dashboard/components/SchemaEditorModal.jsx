/**
 * SchemaEditorModal — JSON-LD editor dialog for adding/editing schema records.
 * Validates JSON on save and reports syntax errors inline.
 * @module features/seo-dashboard/components/SchemaEditorModal
 */

import React, { useState } from 'react';
import { Code, RefreshCw } from 'lucide-react';

const SCHEMA_TYPES = [
  'Article', 'Organization', 'LocalBusiness', 'FAQPage',
  'VideoObject', 'NewsArticle', 'BreadcrumbList', 'CollectionPage',
  'JobPosting', 'Event', 'WebPage', 'WebSite', 'Person', 'HowTo',
  'Review', 'AggregateRating', 'Recipe', 'Course', 'Service',
];

export default function SchemaEditorModal({ initial, onClose, onSave, saving }) {
  const [slug, setSlug] = useState(initial?.pageSlug ?? '');
  const [type, setType] = useState(initial?.schemaType ?? 'WebPage');
  const [json, setJson] = useState(
    initial?.schemaJSON
      ? JSON.stringify(initial.schemaJSON, null, 2)
      : '{\n  "@context": "https://schema.org",\n  "@type": "WebPage"\n}'
  );
  const [jsonError, setJsonError] = useState('');

  function validateAndSave() {
    try {
      const parsed = JSON.parse(json);
      setJsonError('');
      onSave({ pageSlug: slug, schemaType: type, schemaJSON: parsed });
    } catch (e) {
      setJsonError(e.message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-black/40 absolute inset-0" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Code size={18} className="text-indigo-500" /> {initial ? 'Edit Schema' : 'Add Schema'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-none hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Page Slug</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} disabled={!!initial}
                placeholder="news/local-election-update"
                className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Schema Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {SCHEMA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">JSON-LD</label>
            <textarea rows={14} value={json} onChange={(e) => setJson(e.target.value)}
              className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              spellCheck={false} />
            {jsonError && <p className="mt-1 text-xs text-red-500">Invalid JSON: {jsonError}</p>}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-none border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
          <button onClick={validateAndSave} disabled={saving || !slug || !type}
            className="px-4 py-2 text-sm rounded-none bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
            {saving && <RefreshCw size={14} className="animate-spin" />}
            Save Schema
          </button>
        </div>
      </div>
    </div>
  );
}

// MukonoTalks

