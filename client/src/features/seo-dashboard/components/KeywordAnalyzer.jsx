/**
 * KeywordAnalyzer — displays keyword density analysis results.
 * Receives `analysis` from the SEO analyzer endpoint.
 */

import React from 'react';

function DensityBar({ density, max = 5 }) {
  const pct = Math.min((density / max) * 100, 100);
  let bg = 'bg-green-500';
  if (density > 4) bg = 'bg-red-500';
  else if (density > 2.5) bg = 'bg-amber-400';
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
      <div className={`${bg} h-1.5 rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function KeywordAnalyzer({ analysis }) {
  if (!analysis) return null;

  const { keywords = [], headings = {}, links = {}, images = {}, wordCount = 0 } = analysis;

  return (
    <div className="space-y-6">
      {/* Word count summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Word Count', value: wordCount },
          { label: 'H1', value: headings.h1 ?? 0 },
          { label: 'Internal Links', value: links.internal ?? 0 },
          { label: 'Images w/o Alt', value: images.withoutAlt ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Headings breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Heading Structure</h4>
        <div className="flex flex-wrap gap-2">
          {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((h) => (
            <span key={h} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-mono">
              {h.toUpperCase()}: {headings[h] ?? 0}
            </span>
          ))}
        </div>
      </div>

      {/* Keyword table */}
      {keywords.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Keyword Density</h4>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-left px-3 py-2 text-gray-600 dark:text-gray-400 font-medium">Keyword</th>
                  <th className="text-right px-3 py-2 text-gray-600 dark:text-gray-400 font-medium">Count</th>
                  <th className="text-right px-3 py-2 text-gray-600 dark:text-gray-400 font-medium">Density</th>
                  <th className="px-3 py-2 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-2 text-gray-900 dark:text-white font-medium">{kw.keyword}</td>
                    <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{kw.count}</td>
                    <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{kw.density?.toFixed(2)}%</td>
                    <td className="px-3 py-2">
                      <DensityBar density={kw.density ?? 0} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Images */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: 'Total Images', value: images.total ?? 0 },
          { label: 'With Alt', value: images.withAlt ?? 0, good: true },
          { label: 'Missing Alt', value: images.withoutAlt ?? 0, bad: true },
        ].map(({ label, value, good, bad }) => (
          <div key={label} className={`rounded-lg p-3 ${good ? 'bg-green-50 dark:bg-green-900/20' : bad ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
            <div className={`text-xl font-bold ${good ? 'text-green-600' : bad && value > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// MukonoTalks

