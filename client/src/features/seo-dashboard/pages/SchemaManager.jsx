/**
 * SchemaManager — browse, add, edit, and delete JSON-LD schemas per page.
 * Features: schema type filter, JSON editor, injectable preview.
 */

import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSchemaList, useUpsertSchema, useDeleteSchema } from '../../../seo/hooks/useSchema';
import SchemaEditorModal from '../components/SchemaEditorModal';

const SCHEMA_TYPES = [
  '', 'Product', 'Article', 'Organization', 'LocalBusiness', 'FAQPage',
  'VideoObject', 'NewsArticle', 'BreadcrumbList', 'CollectionPage',
  'JobPosting', 'Event', 'WebPage', 'WebSite', 'Person', 'HowTo',
  'Review', 'AggregateRating', 'Recipe', 'Course', 'Service',
];

function SchemaTypeTag({ type }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-mono">
      {type}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function SchemaManager() {
  const [filters, setFilters] = useState({ page: 1, limit: 20, schemaType: '', search: '' });
  const [editing, setEditing] = useState(null); // null = closed, {} = new, obj = existing
  const { data, isLoading, refetch } = useSchemaList(filters);
  const upsert = useUpsertSchema();
  const remove = useDeleteSchema();

  const schemas = data?.data ?? [];
  const pagination = data?.pagination ?? {};

  function updateFilter(patch) {
    setFilters((p) => ({ ...p, ...patch }));
  }

  async function handleSave({ pageSlug, schemaType, schemaJSON }) {
    await upsert.mutateAsync({ pageSlug, schemaType, schemaJSON });
    setEditing(null);
    refetch();
  }

  function confirmDelete(pageSlug, schemaType) {
    if (window.confirm(`Delete ${schemaType} schema for "${pageSlug}"?`)) {
      remove.mutate({ pageSlug, schemaType });
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Schema Engine</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage structured data (JSON-LD) for every page</p>
        </div>
        <button onClick={() => setEditing({})} className="flex items-center gap-2 px-4 py-2 text-sm rounded-none bg-indigo-600 text-white hover:bg-indigo-700">
          <Plus size={16} /> Add Schema
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            value={filters.search}
            onChange={(e) => updateFilter({ search: e.target.value, page: 1 })}
            placeholder="Search by page slug…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={filters.schemaType}
          onChange={(e) => updateFilter({ schemaType: e.target.value, page: 1 })}
          className="px-3 py-2 text-sm rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {SCHEMA_TYPES.map((t) => <option key={t} value={t}>{t || 'All types'}</option>)}
        </select>
        <button onClick={() => refetch()} className="p-2 rounded-none border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
          <RefreshCw size={16} className={isLoading ? 'animate-spin text-indigo-500' : 'text-gray-500'} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Page Slug</th>
                <th className="text-left px-4 py-3 font-medium">Schema Type</th>
                <th className="text-left px-4 py-3 font-medium">@type</th>
                <th className="text-left px-4 py-3 font-medium">Last Updated</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : schemas.map((s) => (
                    <tr key={`${s.pageSlug}-${s.schemaType}`} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                      <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">{s.pageSlug}</td>
                      <td className="px-4 py-3"><SchemaTypeTag type={s.schemaType} /></td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs font-mono">{s.schemaJSON?.['@type'] ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditing(s)} className="p-1.5 rounded-none hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-500 hover:text-indigo-600" title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => confirmDelete(s.pageSlug, s.schemaType)} className="p-1.5 rounded-none hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              {!isLoading && schemas.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No schemas found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-500">{pagination.total} schemas</span>
            <div className="flex gap-1">
              <button disabled={filters.page <= 1} onClick={() => updateFilter({ page: filters.page - 1 })} className="p-1.5 rounded-none border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft size={14} />
              </button>
              <button disabled={filters.page >= pagination.totalPages} onClick={() => updateFilter({ page: filters.page + 1 })} className="p-1.5 rounded-none border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {editing !== null && (
        <SchemaEditorModal
          initial={Object.keys(editing).length ? editing : null}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          saving={upsert.isPending}
        />
      )}
    </div>
  );
}

// MukonoTalks

