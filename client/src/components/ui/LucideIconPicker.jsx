/**
 * LucideIconPicker
 * Searchable icon picker for admin forms — resolves Lucide icon names.
 * Usage:
 *   <LucideIconPicker value="Award" onChange={(name) => ...} />
 */

import React, { useState, useRef, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search, X } from 'lucide-react';

/* ── Curated list of icons useful for a B2B chemical/industrial site ── */
const ICON_NAMES = [
  // Business & stats
  'Award', 'TrendingUp', 'TrendingDown', 'BarChart2', 'BarChart', 'PieChart',
  'Users', 'UserCheck', 'Briefcase', 'Building', 'Building2', 'Landmark',
  'Globe', 'Globe2', 'MapPin', 'Map', 'Navigation',
  // Industry & manufacturing
  'Factory', 'Hammer', 'Wrench', 'Settings', 'Settings2', 'Cpu', 'Layers',
  'Package', 'Boxes', 'Box', 'Container', 'Truck', 'Ship', 'Plane', 'Train',
  // Science & chemistry
  'FlaskConical', 'Flask', 'TestTube', 'TestTube2', 'Microscope', 'Atom',
  'Beaker', 'Thermometer', 'ActivitySquare', 'Dna',
  // Nature & elements
  'Droplets', 'Droplet', 'Flame', 'Wind', 'Sun', 'Moon', 'Cloud', 'Leaf',
  'Zap', 'Waves',
  // Art & colour
  'Paintbrush', 'Paintbrush2', 'Palette', 'Brush', 'Pipette', 'Pen', 'PenTool',
  // Documents & compliance
  'FileText', 'File', 'FileBadge', 'ClipboardList', 'Clipboard', 'BookOpen',
  'BookMarked', 'Shield', 'ShieldCheck', 'ShieldAlert', 'Lock', 'CheckCircle',
  'CheckSquare',
  // Communication
  'Mail', 'Phone', 'MessageSquare', 'Bell', 'Megaphone', 'HeartHandshake',
  // Misc / UI
  'Star', 'Heart', 'Rocket', 'Target', 'Flag', 'Tag', 'Tags', 'Link',
  'ExternalLink', 'ArrowRight', 'ChevronRight', 'Plus', 'Info', 'HelpCircle',
];

export default function LucideIconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const popoverRef = useRef(null);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? ICON_NAMES.filter((n) => n.toLowerCase().includes(query.toLowerCase()))
    : ICON_NAMES;

  const SelectedIcon = value ? LucideIcons[value] : null;

  const handleSelect = (name) => {
    onChange(name);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center gap-2 w-full text-left"
      >
        {SelectedIcon ? (
          <>
            <SelectedIcon className="w-4 h-4 text-primary-600 shrink-0" />
            <span className="flex-1 text-gray-800 text-sm">{value}</span>
          </>
        ) : (
          <span className="flex-1 text-gray-400 text-sm">Choose an icon…</span>
        )}
        {value && (
          <X
            className="w-3.5 h-3.5 text-gray-400 hover:text-red-500 shrink-0"
            onClick={handleClear}
          />
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute z-50 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-3 space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              autoFocus
              className="input pl-8 text-sm"
              placeholder="Search icons…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Icon grid */}
          <div className="grid grid-cols-6 gap-1 max-h-56 overflow-y-auto pr-1">
            {filtered.length === 0 && (
              <p className="col-span-6 text-center text-xs text-gray-400 py-4">No icons found</p>
            )}
            {filtered.map((name) => {
              const Icon = LucideIcons[name];
              if (!Icon) return null;
              const selected = name === value;
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => handleSelect(name)}
                  className={`flex items-center justify-center rounded-none p-2 transition-colors ${
                    selected
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:bg-primary-50 hover:text-primary-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          {/* Current selection label */}
          {value && (
            <p className="text-xs text-center text-gray-500 border-t pt-2">
              Selected: <span className="font-semibold text-gray-700">{value}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
