/**
 * SeoScoreCard — circular gauge showing SEO score 0–100 with colour coding.
 * Usage: <SeoScoreCard score={72} label="SEO Score" size="md" />
 */

import React from 'react';

const SIZE_MAP = {
  sm: { r: 28, stroke: 5, width: 72, fontSize: 'text-lg', labelSize: 'text-[10px]' },
  md: { r: 40, stroke: 7, width: 100, fontSize: 'text-2xl', labelSize: 'text-xs' },
  lg: { r: 56, stroke: 9, width: 136, fontSize: 'text-4xl', labelSize: 'text-sm' },
};

function getColor(score) {
  if (score >= 80) return '#22c55e'; // green-500
  if (score >= 60) return '#f59e0b'; // amber-500
  if (score >= 40) return '#f97316'; // orange-500
  return '#ef4444';                  // red-500
}

function getGrade(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Work';
  return 'Poor';
}

export default function SeoScoreCard({ score = 0, label = 'SEO Score', size = 'md', showGrade = false }) {
  const { r, stroke, width, fontSize, labelSize } = SIZE_MAP[size] ?? SIZE_MAP.md;
  const normalised = Math.max(0, Math.min(100, Math.round(score)));
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (normalised / 100) * circumference;
  const color = getColor(normalised);
  const cx = width / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={width} height={width} viewBox={`0 0 ${width} ${width}`} className="-rotate-90">
        {/* Track */}
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      {/* Score number overlay — must counter-rotate */}
      <div className="relative" style={{ marginTop: -(width) }}>
        <div className={`flex flex-col items-center justify-center`} style={{ width, height: width }}>
          <span className={`font-bold leading-none ${fontSize}`} style={{ color }}>{normalised}</span>
          <span className={`text-gray-500 dark:text-gray-400 ${labelSize} mt-0.5`}>{label}</span>
        </div>
      </div>
      {showGrade && (
        <span className="text-xs font-medium mt-1" style={{ color }}>{getGrade(normalised)}</span>
      )}
    </div>
  );
}

// MukonoTalks

