/**
 * ApplicationSearch — typeahead input for linking applications to a product
 * Searches after 3+ characters; shows "Create new" when no match exists
 * @module components/admin/ApplicationSearch
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiSearch, FiPlus, FiX, FiTag } from 'react-icons/fi';
import adminService from '../../features/admin/adminService';
import toast from 'react-hot-toast';

// ─── Slug generator (mirrors server logic) ────────────────────────────────────
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');

const ApplicationSearch = ({ selectedApplications = [], onChange }) => {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [open, setOpen]         = useState(false);
  const timerRef  = useRef(null);
  const wrapperRef = useRef(null);

  // ── Close dropdown on outside click ───────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Typeahead search ───────────────────────────────────────────────────────
  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);

    if (val.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await adminService.getApplications({ search: val, limit: 10 });
        // Exclude already-selected
        const selectedIds = new Set(selectedApplications.map((a) => a._id));
        setResults((data.applications || []).filter((a) => !selectedIds.has(a._id)));
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  // ── Select existing application ────────────────────────────────────────────
  const handleSelect = useCallback((app) => {
    onChange([...selectedApplications, app]);
    setQuery('');
    setResults([]);
    setOpen(false);
  }, [selectedApplications, onChange]);

  // ── Create new application inline ─────────────────────────────────────────
  const handleCreate = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      const data = await adminService.createApplication({
        title: trimmed,
        slug:  slugify(trimmed),
      });
      const newApp = data.application;
      onChange([...selectedApplications, newApp]);
      toast.success(`Application "${newApp.title}" created`);
      setQuery('');
      setResults([]);
      setOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create application');
    } finally {
      setCreating(false);
    }
  };

  // ── Remove application from selection ─────────────────────────────────────
  const handleRemove = (id) => {
    onChange(selectedApplications.filter((a) => a._id !== id));
  };

  const showCreate = query.length >= 3 && !searching && results.length === 0;
  const showResults = open && (results.length > 0 || showCreate || searching);

  return (
    <div className="space-y-3">
      {/* ── Selected chips ─────────────────────────────────────────────────── */}
      {selectedApplications.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedApplications.map((app) => (
            <span
              key={app._id}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent-blue/30 bg-accent-blue/10 px-3 py-1 text-sm text-accent-blue"
            >
              <FiTag className="h-3 w-3 flex-shrink-0" />
              {app.title}
              <button
                type="button"
                onClick={() => handleRemove(app._id)}
                className="ml-0.5 text-accent-blue/70 transition-colors hover:text-accent-blue"
                aria-label={`Remove ${app.title}`}
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* ── Search input ───────────────────────────────────────────────────── */}
      <div ref={wrapperRef} className="relative">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={handleInput}
            onFocus={() => query.length >= 3 && setOpen(true)}
            placeholder="Search or create application… (type 3+ chars)"
            className="input-field pl-10 text-sm"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
            </div>
          )}
        </div>

        {/* ── Dropdown ─────────────────────────────────────────────────────── */}
        {showResults && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-dark-border bg-dark-slate shadow-card">
            {results.map((app) => (
              <button
                key={app._id}
                type="button"
                onClick={() => handleSelect(app)}
                className="w-full border-b border-dark-border px-4 py-3 text-left transition-colors hover:bg-dark-hover last:border-0"
              >
                <p className="text-sm font-medium text-text-primary">{app.title}</p>
                {app.industryUse && (
                  <p className="mt-0.5 text-xs text-text-secondary">{app.industryUse}</p>
                )}
                <p className="mt-0.5 font-mono text-xs text-text-muted">{app.slug}</p>
              </button>
            ))}

            {showCreate && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex items-center gap-2"
              >
                <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <FiPlus className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700">
                    {creating ? 'Creating…' : `Create "${query.trim()}"`}
                  </p>
                  <p className="font-mono text-xs text-text-muted">
                    slug: {slugify(query.trim())}
                  </p>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-text-muted">
        Type 3+ characters to search existing applications. No match? A new one will be created instantly.
      </p>
    </div>
  );
};

export default ApplicationSearch;

// MukonoTalks

