/**
 * ReadabilityAnalyzer — displays Flesch-Kincaid & readability metrics.
 */

import React from 'react';

function MetricRow({ label, value, description, good, bad }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div>
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</div>
        {description && <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>}
      </div>
      <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
        good ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
        bad  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
               'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      }`}>
        {value}
      </span>
    </div>
  );
}

function IssueItem({ issue }) {
  const typeColors = {
    error:   'border-red-400 bg-red-50 dark:bg-red-900/20',
    warning: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20',
    info:    'border-blue-400 bg-blue-50 dark:bg-blue-900/20',
    success: 'border-green-400 bg-green-50 dark:bg-green-900/20',
  };
  const textColors = {
    error:   'text-red-800 dark:text-red-300',
    warning: 'text-amber-800 dark:text-amber-300',
    info:    'text-blue-800 dark:text-blue-300',
    success: 'text-green-800 dark:text-green-300',
  };
  const cls = typeColors[issue.type] ?? typeColors.info;
  const txt = textColors[issue.type] ?? textColors.info;
  return (
    <div className={`border-l-4 rounded-r px-3 py-2 ${cls}`}>
      <p className={`text-sm ${txt}`}>{issue.message}</p>
    </div>
  );
}

export default function ReadabilityAnalyzer({ analysis }) {
  if (!analysis) return null;

  const {
    readabilityScore = 0,
    fleschScore = 0,
    fleschLabel = '-',
    avgSentenceLength = 0,
    passiveVoicePercent = 0,
    transitionWordPercent = 0,
    grade = '-',
    issues = [],
  } = analysis.readability ?? analysis;

  const scoreGood = readabilityScore >= 70;
  const scoreBad  = readabilityScore < 50;

  return (
    <div className="space-y-5">
      {/* Main readability score */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-800">
        <div>
          <div className="text-4xl font-bold text-indigo-700 dark:text-indigo-300">{Math.round(readabilityScore)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Readability Score</div>
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-600 dark:text-gray-400">Flesch Reading Ease</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">{Math.round(fleschScore)} — {fleschLabel}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Grade level: {grade}</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 px-4">
        <MetricRow
          label="Avg. Sentence Length"
          value={`${avgSentenceLength} words`}
          description="Ideal: ≤ 20 words"
          good={avgSentenceLength <= 20}
          bad={avgSentenceLength > 25}
        />
        <MetricRow
          label="Passive Voice"
          value={`${passiveVoicePercent?.toFixed(1)}%`}
          description="Ideal: < 10%"
          good={passiveVoicePercent < 10}
          bad={passiveVoicePercent >= 20}
        />
        <MetricRow
          label="Transition Words"
          value={`${transitionWordPercent?.toFixed(1)}%`}
          description="Ideal: ≥ 30%"
          good={transitionWordPercent >= 30}
          bad={transitionWordPercent < 15}
        />
        <MetricRow
          label="Overall Score"
          value={Math.round(readabilityScore)}
          good={scoreGood}
          bad={scoreBad}
        />
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Issues & Recommendations</h4>
          <div className="space-y-2">
            {issues.map((issue, i) => (
              <IssueItem key={i} issue={issue} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// MukonoTalks

