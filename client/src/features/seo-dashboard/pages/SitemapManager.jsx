/**
 * SitemapManager — overview of all generated sitemaps with direct links and regen trigger.
 */

import React from 'react';
import { Globe, ExternalLink, RefreshCw, CheckCircle } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../../app/axios';

const SITEMAPS = [
  { name: 'Sitemap Index', path: '/sitemap.xml', desc: 'Root index pointing to all sub-sitemaps' },
  { name: 'Pages Sitemap', path: '/sitemap-pages.xml', desc: 'Static CMS pages' },
  { name: 'Products Sitemap', path: '/sitemap-products.xml', desc: 'All active products with image extensions' },
  { name: 'Articles Sitemap', path: '/sitemap-articles.xml', desc: 'Blog articles with hreflang tags' },
  { name: 'Categories Sitemap', path: '/sitemap-categories.xml', desc: 'Product categories' },
  { name: 'News Sitemap', path: '/news-sitemap.xml', desc: 'Articles published in past 48 hours' },
  { name: 'Video Sitemap', path: '/video-sitemap.xml', desc: 'Video content structured data' },
];

export default function SitemapManager() {
  const siteUrl = window.location.origin;

  const { mutate: ping, isPending, isSuccess } = useMutation({
    mutationFn: () => api.post('/seo-indexing/submit-all'),
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe size={22} className="text-indigo-500" /> Sitemap Manager
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Sitemaps are auto-regenerated on content changes</p>
        </div>
        <button
          onClick={() => ping()}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-none bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {isPending ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Submit All to Search Engines
        </button>
      </div>

      {isSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm border border-green-200 dark:border-green-800">
          <CheckCircle size={16} /> All active pages submitted to IndexNow and Google Indexing API.
        </div>
      )}

      {/* Sitemap cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SITEMAPS.map(({ name, path, desc }) => {
          const fullUrl = `${siteUrl}${path}`;
          return (
            <div
              key={path}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-start gap-4 hover:shadow-md transition-shadow"
            >
              <Globe size={20} className="text-indigo-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-mono"
                >
                  {path} <ExternalLink size={11} />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-5">
        <h3 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2">How sitemaps are generated</h3>
        <ul className="text-sm text-indigo-700 dark:text-indigo-300 space-y-1 list-disc list-inside">
          <li>Sitemaps are generated dynamically from the database on each request.</li>
          <li>Product and article sitemaps include lastmod based on document updatedAt.</li>
          <li>The articles sitemap includes hreflang tags for en/zh/sw languages.</li>
          <li>The news sitemap only includes articles published in the last 48 hours.</li>
          <li>A 30-second debounce queue auto-notifies after any content change.</li>
        </ul>
      </div>
    </div>
  );
}

// MukonoTalks

