/**
 * TechnicalSEO — robots.txt editor and full technical audit dashboard.
 */

import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, Save, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { technicalApi } from '../../../seo/services/seo.api';

function AuditSection({ title, items = [], emptyMsg = 'No issues found' }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
        <CheckCircle size={16} className={items.length === 0 ? 'text-green-500' : 'text-amber-500'} />
        {title} <span className="text-xs font-normal text-gray-500">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-green-600 dark:text-green-400">{emptyMsg}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
              {typeof item === 'string' ? item : item.slug ?? item.url ?? JSON.stringify(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function TechnicalSEO() {
  const qc = useQueryClient();
  const [robotsDraft, setRobotsDraft] = useState('');
  const [savedIndicator, setSavedIndicator] = useState(false);

  const { data: robotsData, isLoading: loadingRobots } = useQuery({
    queryKey: ['technical-seo', 'robots'],
    queryFn: () => technicalApi.getRobots().then((r) => r.data.data),
    staleTime: 1000 * 60,
  });

  const { data: auditData, isLoading: loadingAudit, refetch: refetchAudit } = useQuery({
    queryKey: ['technical-seo', 'audit'],
    queryFn: () => technicalApi.runAudit().then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
  });

  const saveRobots = useMutation({
    mutationFn: (content) => technicalApi.saveRobots(content),
    onSuccess: () => {
      setSavedIndicator(true);
      qc.invalidateQueries({ queryKey: ['technical-seo', 'robots'] });
      setTimeout(() => setSavedIndicator(false), 2000);
    },
  });

  useEffect(() => {
    if (robotsData?.content && !robotsDraft) {
      setRobotsDraft(robotsData.content);
    }
  }, [robotsData]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings size={22} className="text-indigo-500" /> Technical SEO
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Robots.txt management and crawl audit tools</p>
        </div>
        <button onClick={() => refetchAudit()} className="flex items-center gap-2 px-4 py-2 text-sm rounded-none border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
          <RefreshCw size={14} className={loadingAudit ? 'animate-spin' : ''} />
          Run Audit
        </button>
      </div>

      {/* Robots.txt editor */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">robots.txt</h3>
          <div className="flex items-center gap-2">
            {savedIndicator && (
              <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle size={12} /> Saved</span>
            )}
            <button
              onClick={() => setRobotsDraft(robotsData?.default ?? '')}
              className="px-3 py-1.5 text-xs rounded-none border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Reset to Default
            </button>
            <button
              onClick={() => saveRobots.mutate(robotsDraft)}
              disabled={saveRobots.isPending || !robotsDraft}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-none bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saveRobots.isPending ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
              Save
            </button>
          </div>
        </div>
        <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
          <Info size={13} className="shrink-0 mt-0.5" />
          Avoid adding <code className="font-mono font-bold">Disallow: /</code> — this will block all crawling.
        </div>
        {loadingRobots ? (
          <div className="h-48 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse" />
        ) : (
          <textarea
            rows={14}
            value={robotsDraft}
            onChange={(e) => setRobotsDraft(e.target.value)}
            className="w-full rounded-[48px] border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            spellCheck={false}
          />
        )}
      </div>

      {/* Audit results */}
      {loadingAudit ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : auditData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AuditSection
            title="Canonical Issues"
            items={auditData.canonicalIssues ?? []}
            emptyMsg="All canonicals look good!"
          />
          <AuditSection
            title="Duplicate Meta"
            items={auditData.duplicateMeta ?? []}
            emptyMsg="No duplicate titles/descriptions found."
          />
          <AuditSection
            title="Orphaned Pages"
            items={auditData.orphanedPages ?? []}
            emptyMsg="No orphaned pages detected."
          />
          <AuditSection
            title="URL Cleanup Suggestions"
            items={auditData.urlCleanup ?? []}
            emptyMsg="URLs look clean!"
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-400">
          Click "Run Audit" to check technical SEO issues.
        </div>
      )}
    </div>
  );
}

// MukonoTalks

