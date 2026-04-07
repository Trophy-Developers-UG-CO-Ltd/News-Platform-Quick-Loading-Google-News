/**
 * MetadataManager — full CRUD table for per-page SEO metadata.
 * Features: search, filter by page type, inline SERP preview, edit drawer.
 */

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  Search, Plus, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';
import { useSeoList, useDeleteSeo } from '../../../seo/hooks/useSEO';
import { setMetadataFilters } from '../seoDashboardSlice';
import MetadataDrawer from '../components/MetadataDrawer';
import { ScoreChip, RobotsBadge } from '../components/MetadataHelpers';

const PAGE_TYPES = ['', 'product', 'article', 'category', 'home', 'job', 'event', 'location', 'page', 'other'];

export default function MetadataManager() {
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.seoDashboard?.metadataFilters ?? {});
  const [searchParams] = useSearchParams();
  const [editSlug, setEditSlug] = useState(searchParams.get('slug') ?? null);
  const [previewSlug, setPreviewSlug] = useState(null);
  const deleteMutation = useDeleteSeo();

  const { data, isLoading, refetch } = useSeoList(filters);
  const pages = data?.data ?? [];
  const pagination = data?.pagination ?? {};

  function updateFilter(patch) {
    dispatch(setMetadataFilters(patch));
  }

  function confirmDelete(slug) {
    if (window.confirm(`Delete SEO metadata for "${slug}"?`)) {
      deleteMutation.mutate(slug);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Metadata Manager</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage per-page titles, descriptions, and robots settings</p>
        </div>
        <button
          onClick={() => setEditSlug('new-page')}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-none bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <Plus size={16} /> Add Page
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            value={filters.search}
            onChange={(e) => updateFilter({ search: e.target.value, page: 1 })}
            placeholder="Search page slugs…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={filters.pageType}
          onChange={(e) => updateFilter({ pageType: e.target.value, page: 1 })}
          className="px-3 py-2 text-sm rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {PAGE_TYPES.map((t) => (
            <option key={t} value={t}>{t || 'All types'}</option>
          ))}
        </select>
        <select
          value={filters.sort}
          onChange={(e) => updateFilter({ sort: e.target.value })}
          className="px-3 py-2 text-sm rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="-updatedAt">Recently Updated</option>
          <option value="seoScore">Score ↑</option>
          <option value="-seoScore">Score ↓</option>
          <option value="pageSlug">Slug A–Z</option>
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
                <th className="text-left px-4 py-3 font-medium">Page Slug</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-center px-4 py-3 font-medium">Score</th>
                <th className="text-center px-4 py-3 font-medium">Robots</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : pages.map((page) => (
                    <tr key={page.pageSlug} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                      <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">{page.pageSlug}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs">{page.pageType}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[200px] truncate">{page.title || <span className="text-gray-400 italic">—</span>}</td>
                      <td className="px-4 py-3 text-center"><ScoreChip score={page.seoScore} /></td>
                      <td className="px-4 py-3 text-center"><RobotsBadge robots={page.robots} /></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setPreviewSlug(page.pageSlug)} className="p-1.5 rounded-none hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-500 hover:text-indigo-600" title="SERP Preview">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => setEditSlug(page.pageSlug)} className="p-1.5 rounded-none hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-500 hover:text-indigo-600" title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => confirmDelete(page.pageSlug)} className="p-1.5 rounded-none hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              {!isLoading && pages.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">No pages found. Add page metadata to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-500">
              {((filters.page - 1) * filters.limit) + 1}–{Math.min(filters.page * filters.limit, pagination.total ?? 0)} of {pagination.total ?? 0}
            </span>
            <div className="flex gap-1">
              <button
                disabled={filters.page <= 1}
                onClick={() => updateFilter({ page: filters.page - 1 })}
                className="p-1.5 rounded-none border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={filters.page >= pagination.totalPages}
                onClick={() => updateFilter({ page: filters.page + 1 })}
                className="p-1.5 rounded-none border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {editSlug && (
        <MetadataDrawer pageSlug={editSlug} onClose={() => setEditSlug(null)} onSaved={() => refetch()} />
      )}
    </div>
  );
}

// MukonoTalks

