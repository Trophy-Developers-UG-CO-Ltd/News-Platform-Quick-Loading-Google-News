/**
 * InternalLinkPanels — sub-components for the Internal Links dashboard page.
 * Exports: SuggestPanel (AI link suggestions), RuleModal (add/edit link rule).
 * @module features/seo-dashboard/components/InternalLinkPanels
 */

import React, { useState } from 'react';
import { RefreshCw, Zap, Link2 } from 'lucide-react';
import { linksApi } from '../../../seo/services/seo.api';

// ─── Link Suggestion Tool ─────────────────────────────────────

export function SuggestPanel() {
  const [content, setContent] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  async function runSuggest() {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await linksApi.suggest(content);
      setSuggestions(res.data?.suggestions ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
        <Zap size={16} className="text-amber-500" /> Link Suggestion Tool
      </h3>
      <textarea
        rows={5}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Paste page content here to find internal link opportunities…"
        className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />
      <button
        onClick={runSuggest}
        disabled={loading || !content.trim()}
        className="flex items-center gap-2 px-4 py-2 text-sm rounded-none bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60"
      >
        {loading ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
        Get Suggestions
      </button>

      {suggestions.length > 0 && (
        <div className="space-y-2 mt-2">
          {suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <Link2 size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-medium text-gray-800 dark:text-gray-200">"{s.keyword}"</span>
                <span className="text-gray-500 dark:text-gray-400"> → </span>
                <a href={s.targetURL} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{s.targetURL}</a>
              </div>
            </div>
          ))}
        </div>
      )}
      {suggestions.length === 0 && content && !loading && (
        <p className="text-sm text-gray-400 text-center">No link opportunities found for this content.</p>
      )}
    </div>
  );
}

// ─── Rule Add / Edit Modal ────────────────────────────────────

export function RuleModal({ initial, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    keyword:    initial?.keyword    ?? '',
    targetURL:  initial?.targetURL  ?? '',
    anchorText: initial?.anchorText ?? '',
    priority:   initial?.priority   ?? 5,
    autoInsert: initial?.autoInsert ?? false,
  });

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-black/40 absolute inset-0" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">{initial ? 'Edit Rule' : 'Add Link Rule'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-none hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Keyword to match</label>
            <input value={form.keyword} onChange={(e) => set('keyword', e.target.value)} placeholder="e.g. industrial coatings"
              className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Target URL</label>
            <input value={form.targetURL} onChange={(e) => set('targetURL', e.target.value)} placeholder="/products/industrial-coatings"
              className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Anchor Text <span className="font-normal">(optional)</span></label>
              <input value={form.anchorText} onChange={(e) => set('anchorText', e.target.value)} placeholder="Same as keyword if blank"
                className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Priority (1–10)</label>
              <input type="number" min={1} max={10} value={form.priority} onChange={(e) => set('priority', Number(e.target.value))}
                className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" checked={form.autoInsert} onChange={(e) => set('autoInsert', e.target.checked)} className="rounded" />
            Auto-insert on first keyword occurrence
          </label>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-none border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
          <button onClick={() => onSave(form)} disabled={saving || !form.keyword || !form.targetURL}
            className="px-4 py-2 text-sm rounded-none bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
            {saving && <RefreshCw size={14} className="animate-spin" />} Save Rule
          </button>
        </div>
      </div>
    </div>
  );
}

// MukonoTalks

