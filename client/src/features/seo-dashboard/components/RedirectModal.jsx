/**
 * RedirectModal — add/edit dialog for 301/302 redirect entries.
 * Props: initial (existing redirect or null), onClose, onSave, saving.
 * @module features/seo-dashboard/components/RedirectModal
 */

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export default function RedirectModal({ initial, onClose, onSave, saving }) {
  const [from, setFrom] = useState(initial?.fromPath ?? '');
  const [to, setTo]     = useState(initial?.toPath   ?? '');
  const [code, setCode] = useState(initial?.statusCode ?? 301);
  const [note, setNote] = useState(initial?.note       ?? '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-black/40 absolute inset-0" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">{initial ? 'Edit Redirect' : 'Add Redirect'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-none hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">From Path</label>
            <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="/old-path"
              className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">To Path / URL</label>
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="/new-path or https://…"
              className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Status Code</label>
              <select value={code} onChange={(e) => setCode(Number(e.target.value))}
                className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value={301}>301 Permanent</option>
                <option value={302}>302 Temporary</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Note (optional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason…"
                className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-none border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
          <button onClick={() => onSave({ fromPath: from, toPath: to, statusCode: code, note })}
            disabled={saving || !from || !to}
            className="px-4 py-2 text-sm rounded-none bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
            {saving && <RefreshCw size={14} className="animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

// MukonoTalks

