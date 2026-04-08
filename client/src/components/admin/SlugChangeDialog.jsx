/**
 * SlugChangeDialog
 * Post-save modal that appears when a page/article slug has changed.
 * Offers to:
 *   1. Create a 301 redirect (old URL → new URL)  — auto-approved via slug-change source
 *   2. Update navigation menu items pointing to the old URL
 * All three systems (URL Redirects, Navigation Menu, CMS Pages) stay in sync.
 * @module components/admin/SlugChangeDialog
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ArrowLeftRight,
  Navigation,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Info,
  Link2,
} from 'lucide-react';
import slugSyncService from '../../features/slug/slugSyncService';
import toast from 'react-hot-toast';

/**
 * @param {object}   props
 * @param {boolean}  props.open
 * @param {string}   props.oldPath      – full old relative path, e.g. "/en/page/old-slug"
 * @param {string}   props.newPath      – full new relative path, e.g. "/en/page/new-slug"
 * @param {string}   props.resourceType – "page" | "article"
 * @param {Function} props.onClose      – called when dialog is dismissed (after apply or skip)
 */
const SlugChangeDialog = ({ open, oldPath, newPath, resourceType = 'page', onClose }) => {
  const [createRedirect, setCreateRedirect] = useState(true);
  const [updateNavMenu,  setUpdateNavMenu]  = useState(true);
  const [isApplying,     setIsApplying]     = useState(false);
  const [results,        setResults]        = useState(null); // null | { actions: string[], errors: string[] }

  // Reset state whenever dialog reopens
  useEffect(() => {
    if (open) {
      setCreateRedirect(true);
      setUpdateNavMenu(true);
      setIsApplying(false);
      setResults(null);
    }
  }, [open]);

  if (!open || !oldPath || !newPath || oldPath === newPath) return null;

  const handleApply = async () => {
    if (!createRedirect && !updateNavMenu) {
      onClose();
      return;
    }

    setIsApplying(true);
    const actions = [];
    const errors  = [];

    try {
      if (createRedirect) {
        try {
          await slugSyncService.createSlugRedirect(oldPath, newPath, resourceType);
          actions.push(`301 redirect created: ${oldPath} → ${newPath}`);
        } catch (err) {
          errors.push(`Redirect: ${err?.response?.data?.message || 'failed'}`);
        }
      }

      if (updateNavMenu) {
        try {
          const count = await slugSyncService.updateNavItemsForSlug(oldPath, newPath);
          actions.push(
            count > 0
              ? `${count} nav item${count === 1 ? '' : 's'} updated to ${newPath}`
              : 'No nav items were pointing to the old URL'
          );
        } catch (err) {
          errors.push(`Nav menu: ${err?.response?.data?.message || 'failed'}`);
        }
      }

      setResults({ actions, errors });

      if (errors.length === 0) {
        toast.success('Slug sync complete');
      } else if (actions.length > 0) {
        toast('Sync partially failed — check details', { icon: '⚠️' });
      } else {
        toast.error('Slug sync failed');
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleDone = () => {
    setResults(null);
    onClose();
  };

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center">
      <div className="animate-in slide-in-from-bottom-4 w-full max-w-lg overflow-hidden rounded-2xl border border-dark-border bg-dark-slate shadow-2xl duration-200 fade-in">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-orange/15">
              <ArrowLeftRight className="h-4 w-4 text-accent-orange" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Slug Changed</h2>
              <p className="text-xs text-text-muted">Sync across connected systems</p>
            </div>
          </div>
          {results && (
            <button
              onClick={handleDone}
              className="rounded-none p-1.5 text-text-muted transition-colors hover:bg-dark-hover hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* URL change visualization */}
          <div className="space-y-2 rounded-xl bg-dark-charcoal p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">URL Change</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 font-mono break-all">
                {oldPath}
              </code>
              <ArrowRight className="mx-auto h-4 w-4 flex-shrink-0 rotate-90 text-text-muted sm:rotate-0" />
              <code className="flex-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg px-3 py-2 font-mono break-all">
                {newPath}
              </code>
            </div>
          </div>

          {/* Results state */}
          {results ? (
            <div className="space-y-2">
              {results.actions.map((a, i) => (
                <div key={`a-${i}`} className="flex items-start gap-2.5 text-sm text-green-700">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{a}</span>
                </div>
              ))}
              {results.errors.map((e, i) => (
                <div key={`e-${i}`} className="flex items-start gap-2.5 text-sm text-red-700">
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{e}</span>
                </div>
              ))}
            </div>
          ) : (
            /* Checkboxes */
            <div className="space-y-3">
              <p className="flex items-start gap-2 text-sm text-text-secondary">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-blue" />
                Choose which systems to update so visitors and search engines are not broken:
              </p>

              <label className="group flex cursor-pointer items-start gap-3 rounded-xl border border-dark-border p-3.5 transition-colors hover:border-accent-blue hover:bg-accent-blue/10">
                <input
                  type="checkbox"
                  checked={createRedirect}
                  onChange={(e) => setCreateRedirect(e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 accent-accent-blue"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4 text-accent-blue" />
                    <span className="text-sm font-semibold text-text-primary">Create 301 Redirect</span>
                    <span className="rounded bg-accent-blue/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent-blue">SEO Safe</span>
                  </div>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Old URL automatically resolves to new URL. Preserves ranking & backlinks.
                  </p>
                </div>
              </label>

              <label className="group flex cursor-pointer items-start gap-3 rounded-xl border border-dark-border p-3.5 transition-colors hover:border-accent-blue hover:bg-accent-blue/10">
                <input
                  type="checkbox"
                  checked={updateNavMenu}
                  onChange={(e) => setUpdateNavMenu(e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 accent-accent-blue"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-accent-blue" />
                    <span className="text-sm font-semibold text-text-primary">Update Navigation Menu</span>
                  </div>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Any nav items linking to the old URL will be updated automatically.
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-dark-border bg-dark-charcoal px-6 py-4">
          {results ? (
            <button
              onClick={handleDone}
              className="rounded-none bg-accent-blue px-5 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-category-news"
            >
              Done
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={isApplying}
                className="px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary disabled:opacity-50"
              >
                Skip for now
              </button>
              <button
                onClick={handleApply}
                disabled={isApplying || (!createRedirect && !updateNavMenu)}
                className="flex items-center gap-2 rounded-none bg-accent-blue px-5 py-2 text-sm font-semibold text-text-primary shadow-sm transition-colors hover:bg-category-news disabled:opacity-50"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Applying…
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Apply &amp; Sync
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SlugChangeDialog;

// MukonoTalks

