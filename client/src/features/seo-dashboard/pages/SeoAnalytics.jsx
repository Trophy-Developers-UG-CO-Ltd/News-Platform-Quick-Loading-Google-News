/**
 * SeoAnalytics — charts and tables for SEO scores, top pages, and pages needing attention.
 */

import React, { useState } from 'react';
import { BarChart2, RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react';
import { useSeoAnalyticsDashboard, useTopPages, usePagesNeedingAttention, useScoreHistory } from '../../../seo/hooks/useSEO';
import SeoScoreCard from '../components/SeoScoreCard';

function ScoreRow({ page, rank }) {
  const score = page.seoScore ?? 0;
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="w-5 text-xs text-gray-400 text-right">{rank}</span>
      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate font-mono">{page.pageSlug}</span>
      <div className="flex items-center gap-2">
        <div className="w-24 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
          <div className={`${color} h-1.5 rounded-full`} style={{ width: `${score}%` }} />
        </div>
        <span className="text-xs font-bold w-8 text-right" style={{ color: score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444' }}>{score}</span>
      </div>
    </div>
  );
}

function AttentionRow({ page }) {
  const score = page.seoScore ?? 0;
  const issues = page.issues ?? [];
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">{page.pageSlug}</div>
        {issues.length > 0 && (
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{issues[0]?.message ?? ''}</div>
        )}
      </div>
      <span className="text-xs font-bold text-red-500 shrink-0">{score}</span>
    </div>
  );
}

function DistributionBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{label}</span>
        <span>{count} ({pct}%)</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SeoAnalytics() {
  const [topLimit, setTopLimit] = useState(20);
  const { data: analytics, isLoading: loadingAnalytics, refetch } = useSeoAnalyticsDashboard();
  const { data: topPages, isLoading: loadingTop } = useTopPages(topLimit);
  const { data: attention, isLoading: loadingAttn } = usePagesNeedingAttention();

  const meta = analytics?.metadata ?? {};
  const schema = analytics?.schema ?? {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart2 size={22} className="text-indigo-500" /> SEO Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Score distribution, top pages, and improvement opportunities</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 text-sm rounded-none border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
          <RefreshCw size={14} className={loadingAnalytics ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Pages', value: meta.total ?? '—' },
          { label: 'Avg SEO Score', value: Math.round(meta.avgSeoScore ?? 0) },
          { label: 'No Metadata', value: meta.noMetadata ?? '—' },
          { label: 'Schema Types', value: schema.byType?.length ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Score gauge + distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center gap-2">
          <SeoScoreCard score={Math.round(meta.avgSeoScore ?? 0)} label="Avg SEO Score" size="lg" showGrade />
          <SeoScoreCard score={Math.round(meta.avgReadabilityScore ?? 0)} label="Avg Readability" size="sm" showGrade />
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Score Distribution</h3>
          <div className="space-y-4">
            <DistributionBar label="Excellent (80–100)" count={meta.excellent ?? 0} total={meta.total ?? 1} color="bg-green-500" />
            <DistributionBar label="Good (60–79)"       count={meta.good ?? 0}      total={meta.total ?? 1} color="bg-amber-400" />
            <DistributionBar label="Needs Work (40–59)" count={meta.needsWork ?? 0} total={meta.total ?? 1} color="bg-orange-500" />
            <DistributionBar label="Poor (< 40)"        count={meta.poor ?? 0}      total={meta.total ?? 1} color="bg-red-500" />
          </div>
        </div>
      </div>

      {/* Schema breakdown */}
      {schema.byType?.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-500" /> Schema Usage
          </h3>
          <div className="flex flex-wrap gap-2">
            {schema.byType.map((t) => (
              <span key={t._id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                {t._id}
                <span className="bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 rounded-full px-1.5 py-0.5 text-xs font-bold">{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top pages + Needs attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Top Pages by Score</h3>
            <select
              value={topLimit}
              onChange={(e) => setTopLimit(Number(e.target.value))}
              className="text-xs px-2 py-1 rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              {[10, 20, 50].map((n) => <option key={n} value={n}>Top {n}</option>)}
            </select>
          </div>
          {loadingTop ? <div className="h-48 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg" /> : (
            <div>
              {(topPages ?? []).map((page, i) => <ScoreRow key={page.pageSlug} page={page} rank={i + 1} />)}
              {(!topPages || topPages.length === 0) && <p className="text-sm text-gray-400 text-center py-6">No data yet</p>}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" /> Needs Attention
          </h3>
          {loadingAttn ? <div className="h-48 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg" /> : (
            <div>
              {(attention ?? []).map((page) => <AttentionRow key={page.pageSlug} page={page} />)}
              {(!attention || attention.length === 0) && (
                <p className="text-sm text-green-600 dark:text-green-400 text-center py-6">All pages look great!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// MukonoTalks

