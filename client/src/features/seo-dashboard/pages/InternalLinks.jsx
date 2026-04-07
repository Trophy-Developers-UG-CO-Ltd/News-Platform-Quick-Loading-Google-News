/**
 * InternalLinks — manage auto-linking rules and get link suggestions.
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { linksApi } from '../../../seo/services/seo.api';
import { SuggestPanel, RuleModal } from '../components/InternalLinkPanels';

// ─── Main Page ────────────────────────────────────────────────

export default function InternalLinks() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['seo-links'],
    queryFn: () => linksApi.getAll().then((r) => r.data),
    staleTime: 1000 * 30,
  });

  const createMutation = useMutation({ mutationFn: (d) => linksApi.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['seo-links'] }); setEditing(null); } });
  const updateMutation = useMutation({ mutationFn: ({ id, d }) => linksApi.update(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['seo-links'] }); setEditing(null); } });
  const deleteMutation = useMutation({ mutationFn: (id) => linksApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['seo-links'] }) });

  const rules = (data?.data ?? []).filter((r) =>
    !search || r.keyword.includes(search) || r.targetURL.includes(search)
  );

  function handleSave(d) {
    if (editing?._id) updateMutation.mutate({ id: editing._id, d });
    else createMutation.mutate(d);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Internal Links</h1>
          <p className="text-sm text-gray-500 mt-0.5">Auto-linking rules and orphaned page detection</p>
        </div>
        <button onClick={() => setEditing({})} className="flex items-center gap-2 px-4 py-2 text-sm rounded-none bg-indigo-600 text-white hover:bg-indigo-700">
          <Plus size={16} /> Add Rule
        </button>
      </div>

      {/* Suggestion Tool */}
      <SuggestPanel />

      {/* Rules Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter rules…" className="w-full pl-8 pr-3 py-2 text-sm rounded-[26px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={() => refetch()} className="p-2 rounded-none hover:bg-gray-50 dark:hover:bg-gray-800">
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-indigo-500' : 'text-gray-400'} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Keyword</th>
                <th className="text-left px-4 py-3 font-medium">Target URL</th>
                <th className="text-left px-4 py-3 font-medium">Anchor</th>
                <th className="text-center px-4 py-3 font-medium">Priority</th>
                <th className="text-center px-4 py-3 font-medium">Auto</th>
                <th className="text-center px-4 py-3 font-medium">Uses</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                  {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td>)}
                </tr>
              )) : rules.map((r) => (
                <tr key={r._id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{r.keyword}</td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 max-w-[160px] truncate">{r.targetURL}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{r.anchorText || <span className="italic text-gray-400">same</span>}</td>
                  <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{r.priority}</td>
                  <td className="px-4 py-3 text-center">
                    {r.autoInsert ? <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full">on</span>
                                  : <span className="text-xs text-gray-400">off</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs">{r.usageCount ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditing(r)} className="p-1.5 rounded-none hover:bg-indigo-50 text-gray-500 hover:text-indigo-600"><Edit2 size={14} /></button>
                      <button onClick={() => { if (window.confirm('Delete rule?')) deleteMutation.mutate(r._id); }} className="p-1.5 rounded-none hover:bg-red-50 text-gray-500 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && rules.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No link rules yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editing !== null && (
        <RuleModal
          initial={editing?._id ? editing : null}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          saving={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

// MukonoTalks

