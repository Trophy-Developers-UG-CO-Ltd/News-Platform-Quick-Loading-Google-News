/**
 * RedirectManager — manage 301/302 redirects with approval workflow.
 * Wraps the existing /api/redirects backend routes.
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, RefreshCw, Search, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { redirectApi } from '../../../seo/services/seo.api';
import RedirectModal from '../components/RedirectModal';

const STATUS_OPTS = ['', 'pending', 'approved', 'rejected'];

function StatusBadge({ status }) {
  const map = {
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

function CodeChip({ code }) {
  const cls = code === 301 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                             'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
  return <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${cls}`}>{code}</span>;
}

// ─── Main Page ────────────────────────────────────────────────

export default function RedirectManager() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ page: 1, limit: 20, status: '' });
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['redirects', filters],
    queryFn: () => redirectApi.getAll(filters).then((r) => r.data),
    staleTime: 1000 * 30,
  });

  const createMutation = useMutation({
    mutationFn: (d) => redirectApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['redirects'] }); setEditing(null); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }) => redirectApi.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['redirects'] }); setEditing(null); },
  });
  const approveMutation = useMutation({
    mutationFn: (id) => redirectApi.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['redirects'] }),
  });
  const rejectMutation = useMutation({
    mutationFn: (id) => redirectApi.reject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['redirects'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => redirectApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['redirects'] }),
  });

  const redirects = (data?.data ?? []).filter((r) =>
    !search || r.fromPath.includes(search) || r.toPath.includes(search)
  );
  const pagination = data?.pagination ?? {};

  function handleSave(d) {
    if (editing?._id) updateMutation.mutate({ id: editing._id, data: d });
    else createMutation.mutate(d);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Redirect Manager</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage 301/302 redirects with approval workflow</p>
        </div>
        <button onClick={() => setEditing({})} className="flex items-center gap-2 px-4 py-2 text-sm rounded-none bg-indigo-600 text-white hover:bg-indigo-700">
          <Plus size={16} /> Add Redirect
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by path…" className="w-full pl-9 pr-3 py-2 text-sm rounded-[26px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))} className="px-3 py-2 text-sm rounded-[26px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {STATUS_OPTS.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
        <button onClick={() => refetch()} className="p-2 rounded-none border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
          <RefreshCw size={16} className={isLoading ? 'animate-spin text-indigo-500' : 'text-gray-500'} />
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium">From</th>
                <th className="text-left px-4 py-3 font-medium"></th>
                <th className="text-left px-4 py-3 font-medium">To</th>
                <th className="text-center px-4 py-3 font-medium">Code</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Clicks</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : redirects.map((r) => (
                    <tr key={r._id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">{r.fromPath}</td>
                      <td className="px-1"><ArrowRight size={14} className="text-gray-400" /></td>
                      <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 truncate max-w-[200px]">{r.toPath}</td>
                      <td className="px-4 py-3 text-center"><CodeChip code={r.statusCode} /></td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 text-center text-gray-500 text-xs">{r.clickCount ?? 0}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {r.status === 'pending' && (
                            <>
                              <button onClick={() => approveMutation.mutate(r._id)} className="p-1.5 rounded-none hover:bg-green-50 text-gray-500 hover:text-green-600" title="Approve"><CheckCircle size={14} /></button>
                              <button onClick={() => rejectMutation.mutate(r._id)} className="p-1.5 rounded-none hover:bg-red-50 text-gray-500 hover:text-red-600" title="Reject"><XCircle size={14} /></button>
                            </>
                          )}
                          <button onClick={() => setEditing(r)} className="p-1.5 rounded-none hover:bg-indigo-50 text-gray-500 hover:text-indigo-600" title="Edit"><Edit2 size={14} /></button>
                          <button onClick={() => { if (window.confirm('Delete redirect?')) deleteMutation.mutate(r._id); }} className="p-1.5 rounded-none hover:bg-red-50 text-gray-500 hover:text-red-600" title="Delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              {!isLoading && redirects.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No redirects found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-500">{pagination.total} redirects</span>
            <div className="flex gap-1">
              <button disabled={filters.page <= 1} onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))} className="p-1.5 rounded-none border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50"><ChevronLeft size={14} /></button>
              <button disabled={filters.page >= pagination.totalPages} onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))} className="p-1.5 rounded-none border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {editing !== null && (
        <RedirectModal
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

