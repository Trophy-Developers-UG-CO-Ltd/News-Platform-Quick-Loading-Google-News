/**
 * TranslationStatusBadge
 * Displays per-language translation status (en / sw / zh) as colored inline badges.
 * Intended for admin CMS list views and document detail panels.
 *
 * Props:
 *   translationStatus  {Object}  e.g. { en: 'completed', sw: 'pending', zh: 'failed' }
 *   compact            {boolean} When true renders small icon-only badges (for table cells)
 *   onRetry            {func}    Optional – called with (lang) when the Retry button is clicked
 *
 * Status values: 'pending' | 'processing' | 'completed' | 'failed'
 *
 * @module components/admin/TranslationStatusBadge
 */

import React from 'react';
import {
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  RotateCcw,
} from 'lucide-react';

const LANG_LABELS = { en: 'EN', sw: 'SW', zh: 'ZH' };
const LANG_NAMES  = { en: 'English', sw: 'Kiswahili', zh: 'Chinese' };

const STATUS_CONFIG = {
  completed: {
    label: 'Translated',
    Icon: CheckCircle2,
    colors: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconColor: 'text-emerald-500',
    dot: 'bg-emerald-400',
  },
  processing: {
    label: 'Processing',
    Icon: Loader2,
    colors: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-500 animate-spin',
    dot: 'bg-amber-400',
  },
  failed: {
    label: 'Failed',
    Icon: XCircle,
    colors: 'bg-red-50 text-red-700 border-red-200',
    iconColor: 'text-red-500',
    dot: 'bg-red-400',
  },
  pending: {
    label: 'Pending',
    Icon: Clock,
    colors: 'bg-gray-50 text-gray-500 border-gray-200',
    iconColor: 'text-gray-400',
    dot: 'bg-gray-300',
  },
};

/**
 * Single language badge.
 */
function LangBadge({ lang, status, compact, onRetry }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const { Icon, colors, iconColor, label, dot } = cfg;

  if (compact) {
    return (
      <span
        title={`${LANG_NAMES[lang]}: ${label}`}
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${colors}`}
      >
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />
        {LANG_LABELS[lang]}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium ${colors}`}
    >
      <Icon size={14} className={iconColor} />
      <span className="font-semibold">{LANG_LABELS[lang]}</span>
      <span className="text-xs opacity-70">{label}</span>
      {status === 'failed' && onRetry && (
        <button
          type="button"
          onClick={() => onRetry(lang)}
          title={`Retry ${LANG_NAMES[lang]} translation`}
          className="ml-1 rounded p-0.5 hover:bg-red-100 transition-colors"
        >
          <RotateCcw size={12} />
        </button>
      )}
    </div>
  );
}

/**
 * Main component — renders badges for every language present in translationStatus.
 */
const TranslationStatusBadge = ({
  translationStatus = {},
  compact = false,
  onRetry,
  className = '',
}) => {
  const langs = Object.keys(LANG_LABELS);

  if (!langs.some((l) => translationStatus[l])) {
    return (
      <span className="text-xs text-gray-400 italic">No translation data</span>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {langs.map((lang) => {
        const status = translationStatus[lang] ?? 'pending';
        return (
          <LangBadge
            key={lang}
            lang={lang}
            status={status}
            compact={compact}
            onRetry={onRetry}
          />
        );
      })}
    </div>
  );
};

export default TranslationStatusBadge;

// MukonoTalks

