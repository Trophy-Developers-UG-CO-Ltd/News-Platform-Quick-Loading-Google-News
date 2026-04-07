/**
 * MetadataHelpers — small display-only components for the Metadata Manager table.
 * Exports: ScoreChip, RobotsBadge.
 * @module features/seo-dashboard/components/MetadataHelpers
 */

import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export function ScoreChip({ score }) {
  if (!score && score !== 0) return <span className="text-gray-400 text-xs">—</span>;
  const cls = score >= 80 ? 'bg-green-100 text-green-700'
            : score >= 60 ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700';
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{score}</span>;
}

export function RobotsBadge({ robots }) {
  if (!robots) return null;
  return robots.noindex
    ? <span className="flex items-center gap-0.5 text-xs text-red-600"><XCircle size={12} /> noindex</span>
    : <span className="flex items-center gap-0.5 text-xs text-green-600"><CheckCircle size={12} /> index</span>;
}

// MukonoTalks

