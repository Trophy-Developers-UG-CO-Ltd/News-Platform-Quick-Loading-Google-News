/**
 * ContentAnalyzer — paste content and get real-time SEO + readability scoring.
 */

import React, { useState } from 'react';
import { BarChart2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAnalyzeContent } from '../../../seo/hooks/useSEO';
import SeoScoreCard from '../components/SeoScoreCard';
import KeywordAnalyzer from '../components/KeywordAnalyzer';
import ReadabilityAnalyzer from '../components/ReadabilityAnalyzer';

function IssueItem({ issue }) {
  const colors = {
    error:   'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300',
    warning: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300',
    success: 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300',
    info:    'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
  };
  return (
    <div className={`border-l-4 rounded-r px-3 py-2 text-sm ${colors[issue.type] ?? colors.info}`}>
      {issue.message}
    </div>
  );
}

export default function ContentAnalyzer() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const analyze = useAnalyzeContent();

  function handleAnalyze() {
    analyze.mutate({
      content,
      title,
      metaDescription: description,
      focusKeywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
    });
  }

  const result = analyze.data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Analyzer</h1>
        <p className="text-sm text-gray-500 mt-0.5">Paste your content and get actionable SEO recommendations</p>
      </div>

      {/* Input panel */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Page Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Your page title…"
              className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Meta Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Meta description…"
              className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Focus Keywords <span className="font-normal text-gray-400">(comma-sep.)</span></label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="keyword one, keyword two"
              className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
            Page Content
            <span className="ml-2 font-normal text-gray-400">{content.split(/\s+/).filter(Boolean).length} words</span>
          </label>
          <textarea
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your page content here (plain text or HTML)…"
            className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={analyze.isPending || !content.trim()}
          className="flex items-center gap-2 px-6 py-2.5 text-sm rounded-none bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {analyze.isPending ? <RefreshCw size={16} className="animate-spin" /> : <BarChart2 size={16} />}
          {analyze.isPending ? 'Analyzing…' : 'Analyze Content'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Score row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center">
              <SeoScoreCard score={result.seoScore ?? 0} label="SEO Score" size="md" showGrade />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center">
              <SeoScoreCard score={result.readabilityScore ?? 0} label="Readability" size="md" showGrade />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center gap-2">
              <div className="text-3xl font-bold text-gray-900 dark:text-white uppercase">{result.grade ?? '—'}</div>
              <div className="text-sm text-gray-500">Overall Grade</div>
              <div className="text-xs text-gray-400">{result.wordCount} words</div>
            </div>
          </div>

          {/* Issues & Recommendations */}
          {(result.issues?.length > 0 || result.recommendations?.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {result.issues?.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" /> Issues ({result.issues.length})
                  </h3>
                  <div className="space-y-2">
                    {result.issues.map((issue, i) => <IssueItem key={i} issue={issue} />)}
                  </div>
                </div>
              )}
              {result.recommendations?.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" /> Recommendations ({result.recommendations.length})
                  </h3>
                  <div className="space-y-2">
                    {result.recommendations.map((rec, i) => <IssueItem key={i} issue={{ ...rec, type: 'info' }} />)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Keyword + Readability details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Keyword Analysis</h3>
              <KeywordAnalyzer analysis={result} />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Readability</h3>
              <ReadabilityAnalyzer analysis={result} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// MukonoTalks

