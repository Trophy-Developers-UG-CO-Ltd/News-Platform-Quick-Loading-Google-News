/**
 * SeoOverviewHelpers — display-only UI primitives for the SEO Overview dashboard.
 * Exports: StatCard, ScoreBadge.
 * @module features/seo-dashboard/components/SeoOverviewHelpers
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const COLOR_MAP = {
  indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  green:  'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  amber:  'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  red:    'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
};

export function StatCard({ icon: Icon, label, value, sub, color = 'indigo', to }) {
  const card = (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`rounded-xl p-3 ${COLOR_MAP[color]}`}>
        <Icon size={22} className="shrink-0" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</div>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</div>
        {sub && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</div>}
      </div>
      {to && <ArrowRight size={16} className="text-gray-400 shrink-0 mt-1" />}
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

export function ScoreBadge({ score }) {
  if (score >= 80) return <span className="text-green-600 font-bold">{score}</span>;
  if (score >= 60) return <span className="text-amber-600 font-bold">{score}</span>;
  return <span className="text-red-600 font-bold">{score}</span>;
}

// MukonoTalks

