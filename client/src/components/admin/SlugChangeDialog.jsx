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
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Slug Changed</h2>
              <p className="text-xs text-gray-500">Sync across connected systems</p>
            </div>
          </div>
          {results && (
            <button
              onClick={handleDone}
              className="p-1.5 rounded-none hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* URL change visualization */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">URL Change</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <code className="flex-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 font-mono break-all">
                {oldPath}
              </code>
              <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 rotate-90 sm:rotate-0 mx-auto" />
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
              <p className="text-sm text-gray-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                Choose which systems to update so visitors and search engines are not broken:
              </p>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50/40 cursor-pointer transition-colors group">
                <input
                  type="checkbox"
                  checked={createRedirect}
                  onChange={(e) => setCreateRedirect(e.target.checked)}
                  className="mt-0.5 accent-primary-600 w-4 h-4 flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-primary-600" />
                    <span className="font-semibold text-gray-800 text-sm">Create 301 Redirect</span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">SEO Safe</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Old URL automatically resolves to new URL. Preserves ranking & backlinks.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50/40 cursor-pointer transition-colors group">
                <input
                  type="checkbox"
                  checked={updateNavMenu}
                  onChange={(e) => setUpdateNavMenu(e.target.checked)}
                  className="mt-0.5 accent-primary-600 w-4 h-4 flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-primary-600" />
                    <span className="font-semibold text-gray-800 text-sm">Update Navigation Menu</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Any nav items linking to the old URL will be updated automatically.
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          {results ? (
            <button
              onClick={handleDone}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-none transition-colors"
            >
              Done
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={isApplying}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
              >
                Skip for now
              </button>
              <button
                onClick={handleApply}
                disabled={isApplying || (!createRedirect && !updateNavMenu)}
                className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold rounded-none transition-colors shadow-sm"
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

