/**
 * SEO Overview Dashboard — main landing page for the SEO admin module.
 * Shows aggregate stats, score distribution, top pages, and pages needing attention.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Search, FileText, Link2, Globe, BarChart2, AlertTriangle,
  TrendingUp, Settings, RefreshCw, CheckCircle
} from 'lucide-react';
import { useSeoAnalyticsDashboard, useTopPages, usePagesNeedingAttention } from '../../../seo/hooks/useSEO';
import SeoScoreCard from '../components/SeoScoreCard';
import { StatCard, ScoreBadge } from '../components/SeoOverviewHelpers';

export default function SeoOverview() {
  const { data: analytics, isLoading: loadingAnalytics, refetch } = useSeoAnalyticsDashboard();
  const { data: topPages, isLoading: loadingTop } = useTopPages(10);
  const { data: attention, isLoading: loadingAttn } = usePagesNeedingAttention();

  const meta = analytics?.metadata ?? {};
  const schema = analytics?.schema ?? {};
  const redirects = analytics?.redirects ?? {};
  const links = analytics?.links ?? {};
  const avgScore = meta.avgSeoScore ?? 0;

  const quickLinks = [
    { label: 'Metadata Manager', to: '/admin/seo/metadata', icon: FileText, desc: 'Edit per-page SEO fields' },
    { label: 'Schema Engine', to: '/admin/seo/schema', icon: Search, desc: 'Manage JSON-LD structured data' },
    { label: 'Content Analyzer', to: '/admin/seo/analyzer', icon: BarChart2, desc: 'Score & improve content' },
    { label: 'Redirects', to: '/admin/seo/redirects', icon: Link2, desc: 'Manage 301/302 redirects' },
    { label: 'Internal Links', to: '/admin/seo/links', icon: Link2, desc: 'Auto internal linking rules' },
    { label: 'Technical SEO', to: '/admin/seo/technical', icon: Settings, desc: 'Robots.txt & crawl audits' },
    { label: 'Sitemap', to: '/admin/seo/sitemap', icon: Globe, desc: 'View & regenerate sitemaps' },
    { label: 'Indexing', to: '/admin/seo/indexing', icon: TrendingUp, desc: 'Submit to Google & IndexNow' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SEO Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Enterprise SEO management centre</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-none border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <RefreshCw size={14} className={loadingAnalytics ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText}     label="Total Pages" value={meta.total}      sub={`${meta.noMetadata ?? 0} without metadata`} color="indigo" to="/admin/seo/metadata" />
        <StatCard icon={CheckCircle}  label="Excellent (≥80)" value={meta.excellent}  color="green"  />
        <StatCard icon={AlertTriangle} label="Poor (<40)"   value={meta.poor}      color="red"    to="/admin/seo/analytics" />
        <StatCard icon={Search}       label="Schemas"      value={schema.total}   sub={`${schema.byType?.length ?? 0} types in use`} color="indigo" to="/admin/seo/schema" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center gap-3">
          <SeoScoreCard score={Math.round(avgScore)} label="Avg. SEO Score" size="lg" showGrade />
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Across {meta.total ?? 0} indexed pages
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Score Distribution</h3>
          {loadingAnalytics ? (
            <div className="h-32 flex items-center justify-center text-gray-400">Loading…</div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Excellent (80–100)', count: meta.excellent ?? 0, total: meta.total ?? 1, color: 'bg-green-500' },
                { label: 'Good (60–79)',       count: meta.good ?? 0,      total: meta.total ?? 1, color: 'bg-amber-400' },
                { label: 'Needs Work (40–59)', count: meta.needsWork ?? 0, total: meta.total ?? 1, color: 'bg-orange-500' },
                { label: 'Poor (<40)',         count: meta.poor ?? 0,      total: meta.total ?? 1, color: 'bg-red-500' },
              ].map(({ label, count, total, color }) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>{label}</span>
                      <span>{count} pages ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Top Pages by Score</h3>
            <Link to="/admin/seo/analytics" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">View all</Link>
          </div>
          {loadingTop ? (
            <div className="py-8 text-center text-gray-400">Loading…</div>
          ) : (
            <div className="space-y-2">
              {(topPages ?? []).slice(0, 8).map((page) => (
                <div key={page.pageSlug} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[220px]">{page.pageSlug}</span>
                  <ScoreBadge score={page.seoScore ?? 0} />
                </div>
              ))}
              {(!topPages || topPages.length === 0) && (
                <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" /> Needs Attention
            </h3>
            <Link to="/admin/seo/metadata" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Fix all</Link>
          </div>
          {loadingAttn ? (
            <div className="py-8 text-center text-gray-400">Loading…</div>
          ) : (
            <div className="space-y-2">
              {(attention ?? []).slice(0, 8).map((page) => (
                <div key={page.pageSlug} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[220px]">{page.pageSlug}</span>
                  <Link
                    to={`/admin/seo/metadata?slug=${page.pageSlug}`}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <ScoreBadge score={page.seoScore ?? 0} />
                    <span className="ml-1">Fix</span>
                  </Link>
                </div>
              ))}
              {(!attention || attention.length === 0) && (
                <p className="text-sm text-green-600 dark:text-green-400 text-center py-4">All pages are in good shape!</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">SEO Tools</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map(({ label, to, icon: Icon, desc }) => (
            <Link
              key={to}
              to={to}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group"
            >
              <Icon size={20} className="text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Link2}       label="Redirects"       value={redirects.total}   sub={`${redirects.active ?? 0} active`}          color="indigo" to="/admin/seo/redirects" />
        <StatCard icon={Link2}       label="Link Rules"      value={links.totalRules}  sub={`${links.autoInsert ?? 0} auto-insert`}      color="indigo" to="/admin/seo/links" />
        <StatCard icon={Globe}       label="Sitemaps"        value="7"                 sub="Updated on content change"                    color="green"  to="/admin/seo/sitemap" />
        <StatCard icon={TrendingUp}  label="Indexed Pages"   value={meta.indexed}      sub="Submitted to search engines"                  color="green"  to="/admin/seo/indexing" />
      </div>
    </div>
  );
}

// MukonoTalks

