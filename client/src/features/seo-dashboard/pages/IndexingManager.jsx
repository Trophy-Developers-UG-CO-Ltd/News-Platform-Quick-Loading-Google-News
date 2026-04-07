/**
 * IndexingManager — submit pages to IndexNow and Google Indexing API.
 */

import React, { useState } from 'react';
import { TrendingUp, RefreshCw, CheckCircle, AlertTriangle, Send } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { indexingApi } from '../../../seo/services/seo.api';

function ResultCard({ result, label }) {
  if (!result) return null;
  const ok = result.success !== false;
  return (
    <div className={`rounded-xl border p-4 ${ok ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' : 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'}`}>
      <div className={`flex items-center gap-2 font-semibold text-sm mb-1 ${ok ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
        {ok ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
        {label}
      </div>
      <pre className={`text-xs whitespace-pre-wrap ${ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}

export default function IndexingManager() {
  const [urlsInput, setUrlsInput] = useState('');
  const [engine, setEngine] = useState('both'); // 'indexnow' | 'google' | 'both'
  const [submitAllResult, setSubmitAllResult] = useState(null);

  const submitCustom = useMutation({
    mutationFn: async ({ urls, engine: eng }) => {
      const results = {};
      if (eng === 'indexnow' || eng === 'both') {
        const r = await indexingApi.submitIndexNow(urls);
        results.indexnow = r.data;
      }
      if (eng === 'google' || eng === 'both') {
        const r = await indexingApi.submitGoogle(urls);
        results.google = r.data;
      }
      return results;
    },
  });

  const submitAll = useMutation({
    mutationFn: () => indexingApi.submitAll(),
    onSuccess: (r) => setSubmitAllResult(r.data),
  });

  function handleCustomSubmit() {
    const urls = urlsInput.split('\n').map((u) => u.trim()).filter(Boolean);
    if (!urls.length) return;
    submitCustom.mutate({ urls, engine });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={22} className="text-indigo-500" /> Indexing Manager
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Submit pages to IndexNow (Bing/Yandex) and Google Indexing API</p>
        </div>
        <button
          onClick={() => submitAll.mutate()}
          disabled={submitAll.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-none bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
        >
          {submitAll.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
          Submit All Active Pages
        </button>
      </div>

      {submitAllResult && <ResultCard result={submitAllResult} label="Submit All Result" />}

      {/* Custom URL submission */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Submit Specific URLs</h3>

        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">URLs <span className="font-normal text-gray-400">(one per line)</span></label>
          <textarea
            rows={5}
            value={urlsInput}
            onChange={(e) => setUrlsInput(e.target.value)}
            placeholder="https://example.com/products/chemical-x&#10;https://example.com/blog/new-article"
            className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Engine</label>
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              className="px-3 py-2 text-sm rounded-[48px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="both">Both (IndexNow + Google)</option>
              <option value="indexnow">IndexNow only</option>
              <option value="google">Google only</option>
            </select>
          </div>
          <button
            onClick={handleCustomSubmit}
            disabled={submitCustom.isPending || !urlsInput.trim()}
            className="self-end flex items-center gap-2 px-4 py-2 text-sm rounded-none bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitCustom.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            Submit
          </button>
        </div>

        {submitCustom.data && (
          <div className="space-y-3">
            {submitCustom.data.indexnow && <ResultCard result={submitCustom.data.indexnow} label="IndexNow" />}
            {submitCustom.data.google && <ResultCard result={submitCustom.data.google} label="Google Indexing API" />}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-4">
          <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 text-sm mb-2">IndexNow</h4>
          <ul className="text-xs text-indigo-700 dark:text-indigo-300 space-y-1 list-disc list-inside">
            <li>Submits to Bing, Yandex, and api.indexnow.org simultaneously</li>
            <li>Requires <code className="font-mono font-bold">INDEXNOW_KEY</code> env var</li>
            <li>Instant crawl trigger for supported engines</li>
          </ul>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-4">
          <h4 className="font-semibold text-purple-800 dark:text-purple-200 text-sm mb-2">Google Indexing API</h4>
          <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1 list-disc list-inside">
            <li>Requires <code className="font-mono font-bold">GOOGLE_SERVICE_ACCOUNT_KEY</code> env var</li>
            <li>Only for eligible content types (JobPosting, BroadcastEvent)</li>
            <li>General indexing uses Google Search Console instead</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// MukonoTalks

