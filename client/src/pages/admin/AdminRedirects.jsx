/**
 * Admin Redirect Manager — Premium Edition
 * Full lifecycle management for URL redirects:
 *   - Auto-generated (on slug change) + manually created
 *   - Pending → Approved → Live on site
 *   - Click tracking per redirect
 * @module pages/admin/AdminRedirects
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Pencil,
  Trash2,
  Plus,
  RefreshCw,
  MousePointerClick,
  Clock,
  ShieldCheck,
  Ban,
  Search,
  ExternalLink,
  Info,
  Zap,
  Globe,
  FileText,
  Package,
} from 'lucide-react';
import {
  fetchAllRedirects,
  fetchRedirectStats,
  createRedirect,
  updateRedirect,
  approveRedirect,
  rejectRedirect,
  deleteRedirect,
  clearRedirectError,
} from '../../features/redirects/redirectSlice';
import Spinner from '../../components/ui/Spinner';
import useDocTitle from '../../hooks/useDocTitle';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  bg: 'bg-amber-100',  text: 'text-amber-700',  Icon: Clock },
  approved: { label: 'Approved', bg: 'bg-green-100',  text: 'text-green-700',  Icon: ShieldCheck },
  rejected: { label: 'Rejected', bg: 'bg-red-100',    text: 'text-red-700',    Icon: Ban },
};

const SOURCE_CONFIG = {
  auto:   { label: 'Auto',   bg: 'bg-blue-100',   text: 'text-blue-700' },
  manual: { label: 'Manual', bg: 'bg-purple-100', text: 'text-purple-700' },
};

const RESOURCE_ICONS = {
  product: Package,
  page:    FileText,
  article: Globe,
  custom:  Zap,
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
};

const TABS = [
  { key: 'all',      label: 'All',      statsKey: 'total' },
  { key: 'pending',  label: 'Pending',  statsKey: 'pending' },
  { key: 'approved', label: 'Approved', statsKey: 'approved' },
  { key: 'rejected', label: 'Rejected', statsKey: 'rejected' },
];

// ── Redirect Form Modal ───────────────────────────────────────────────────────

const RedirectModal = ({ initial, onSave, onClose, isSaving }) => {
  const isNew = !initial?._id;
  const [form, setForm] = useState({
    fromPath:   initial?.fromPath   || '',
    toPath:     initial?.toPath     || '',
    statusCode: initial?.statusCode || 301,
    note:       initial?.note       || '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.fromPath.trim()) e.fromPath = 'Required';
    else if (!form.fromPath.startsWith('/')) e.fromPath = 'Must start with /';
    if (!form.toPath.trim()) e.toPath = 'Required';
    else if (!form.toPath.startsWith('/')) e.toPath = 'Must start with /';
    if (form.fromPath.trim() === form.toPath.trim()) e.toPath = 'From and To paths must be different';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  const field = (key, label, placeholder, help) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={form[key]}
        onChange={(e) => { setForm((p) => ({ ...p, [key]: e.target.value })); setErrors((p) => ({ ...p, [key]: undefined })); }}
        placeholder={placeholder}
        className={`w-full border rounded-[48px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors[key] ? 'border-red-400' : 'border-gray-300'}`}
      />
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
      {help && !errors[key] && <p className="text-xs text-gray-400 mt-1">{help}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            {isNew ? 'Create Redirect' : 'Edit Redirect'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {field('fromPath', 'From Path (old URL)', '/en/news/old-article-slug', 'Exact path visitors try to reach')}
          {field('toPath', 'To Path (new URL)', '/en/news/new-article-slug', 'Destination path they should be redirected to')}

          {/* Status code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Redirect Type</label>
            <div className="flex gap-3">
              {[301, 302].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, statusCode: code }))}
                  className={`flex-1 py-2 px-4 rounded-none text-sm font-medium border-2 transition-colors ${
                    form.statusCode === code
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {code} {code === 301 ? '— Permanent' : '— Temporary'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">301 is recommended for SEO (slug renames). Use 302 for temporary campaigns.</p>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="Reason for this redirect…"
              rows={2}
              className="w-full border border-gray-300 rounded-[48px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>This redirect will be created as <strong>Pending</strong> and must be approved before going live.</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" disabled={isSaving} className="flex-1 btn-primary flex items-center justify-center gap-2">
              {isSaving ? <Spinner size="sm" /> : <Check className="w-4 h-4" />}
              {isNew ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const AdminRedirects = () => {
  useDocTitle('Redirects — MukonoTalks Admin');
  const dispatch = useDispatch();
  const { redirects, stats, isLoading, isSaving } = useSelector((s) => s.redirects);

  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(null);   // null | { mode: 'new' | 'edit', data? }

  const load = useCallback(() => {
    dispatch(fetchAllRedirects(filter !== 'all' ? { status: filter, search } : { search }));
    dispatch(fetchRedirectStats());
  }, [dispatch, filter, search]);

  useEffect(() => { load(); }, [load]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleApprove = async (id) => {
    const result = await dispatch(approveRedirect(id));
    if (approveRedirect.fulfilled.match(result)) {
      toast.success('Redirect approved — now live');
      dispatch(fetchRedirectStats());
    } else {
      toast.error(result.payload || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    const result = await dispatch(rejectRedirect(id));
    if (rejectRedirect.fulfilled.match(result)) {
      toast.success('Redirect rejected');
      dispatch(fetchRedirectStats());
    } else {
      toast.error(result.payload || 'Rejection failed');
    }
  };

  const handleDelete = async (redirect) => {
    if (!window.confirm(`Delete redirect?\n${redirect.fromPath} → ${redirect.toPath}`)) return;
    const result = await dispatch(deleteRedirect(redirect._id));
    if (deleteRedirect.fulfilled.match(result)) {
      toast.success('Redirect deleted');
      dispatch(fetchRedirectStats());
    } else {
      toast.error(result.payload || 'Delete failed');
    }
  };

  const handleSave = async (formData) => {
    if (modal?.mode === 'new') {
      const result = await dispatch(createRedirect(formData));
      if (createRedirect.fulfilled.match(result)) {
        toast.success('Redirect created — pending approval');
        setModal(null);
        dispatch(fetchRedirectStats());
      } else {
        toast.error(result.payload || 'Create failed');
      }
    } else if (modal?.mode === 'edit') {
      const result = await dispatch(updateRedirect({ id: modal.data._id, data: formData }));
      if (updateRedirect.fulfilled.match(result)) {
        toast.success('Redirect updated');
        setModal(null);
        dispatch(fetchRedirectStats());
      } else {
        toast.error(result.payload || 'Update failed');
      }
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ArrowRight className="h-6 w-6 text-primary-600" />
              URL Redirects
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage URL redirects — auto-generated on slug changes, or manually created.
              Approve to make live. Clicks are tracked automatically.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={load}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-none transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setModal({ mode: 'new' })}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Redirect
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total',         value: stats.total,        color: 'text-gray-800',   bg: 'bg-gray-50'    },
          { label: 'Pending',       value: stats.pending,      color: 'text-amber-700',  bg: 'bg-amber-50'   },
          { label: 'Approved',      value: stats.approved,     color: 'text-green-700',  bg: 'bg-green-50'   },
          { label: 'Rejected',      value: stats.rejected,     color: 'text-red-700',    bg: 'bg-red-50'     },
          { label: 'Total Clicks',  value: stats.totalClicks,  color: 'text-blue-700',   bg: 'bg-blue-50'    },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4 border border-gray-100`}>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold ${color} mt-1`}>{value ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          {TABS.map(({ key, label, statsKey }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-none text-sm font-medium transition-all ${
                filter === key
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
              {stats[statsKey] > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  filter === key ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {stats[statsKey]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search paths…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-[48px] focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
          />
        </div>
      </div>

      {/* Pending banner */}
      {stats.pending > 0 && filter !== 'rejected' && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            <strong>{stats.pending} redirect{stats.pending !== 1 ? 's' : ''}</strong> awaiting your approval.
            Review and click <strong>Approve</strong> to make them live.
          </p>
          {filter !== 'pending' && (
            <button
              onClick={() => setFilter('pending')}
              className="text-xs font-medium text-amber-700 underline hover:no-underline"
            >
              View pending
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : redirects.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ArrowRight className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No redirects found</p>
          <p className="text-sm mt-1">
            {filter !== 'all'
              ? 'Try switching to "All" tab'
              : 'Redirects are auto-created when slugs change, or create one manually.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">From → To</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clicks</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {redirects.map((r) => {
                  const statusCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                  const sourceCfg = SOURCE_CONFIG[r.source] || SOURCE_CONFIG.manual;
                  const ResourceIcon = RESOURCE_ICONS[r.resourceType] || Zap;

                  return (
                    <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                      {/* From → To */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="flex items-center gap-1 text-gray-500 text-xs font-mono mb-0.5">
                          <ResourceIcon className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate text-gray-700" title={r.fromPath}>{r.fromPath}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-mono">
                          <ArrowRight className="w-3 h-3 text-primary-400 flex-shrink-0" />
                          <span className="truncate text-primary-600" title={r.toPath}>{r.toPath}</span>
                        </div>
                        {r.note && (
                          <p className="text-xs text-gray-400 mt-1 italic truncate" title={r.note}>{r.note}</p>
                        )}
                      </td>

                      {/* Status code */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          r.statusCode === 301
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-teal-100 text-teal-700'
                        }`}>
                          {r.statusCode}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sourceCfg.bg} ${sourceCfg.text}`}>
                          {r.source === 'auto' ? <Zap className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                          {sourceCfg.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                          <statusCfg.Icon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                        {r.approvedBy && (
                          <p className="text-xs text-gray-400 mt-0.5">by {r.approvedBy.name || r.approvedBy.email}</p>
                        )}
                      </td>

                      {/* Clicks */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-gray-600">
                          <MousePointerClick className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-semibold">{r.clickCount || 0}</span>
                        </div>
                        {r.lastClickedAt && (
                          <p className="text-xs text-gray-400 mt-0.5">{fmtDate(r.lastClickedAt)}</p>
                        )}
                      </td>

                      {/* Created */}
                      <td className="px-4 py-4 text-xs text-gray-500">
                        <p>{fmtDate(r.createdAt)}</p>
                        {r.createdBy && (
                          <p className="text-gray-400 mt-0.5">{r.createdBy.name || r.createdBy.email}</p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* Approve / Reject — only for pending */}
                          {r.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(r._id)}
                                title="Approve — make live"
                                className="p-1.5 rounded-none text-green-600 hover:bg-green-50 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(r._id)}
                                title="Reject"
                                className="p-1.5 rounded-none text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Re-approve rejected */}
                          {r.status === 'rejected' && (
                            <button
                              onClick={() => handleApprove(r._id)}
                              title="Approve now"
                              className="p-1.5 rounded-none text-green-600 hover:bg-green-50 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => setModal({ mode: 'edit', data: r })}
                            title="Edit"
                            className="p-1.5 rounded-none text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Test link (approved only) */}
                          {r.status === 'approved' && (
                            <a
                              href={r.fromPath}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Test redirect"
                              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(r)}
                            title="Delete"
                            className="p-1.5 rounded-none text-red-400 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* How it works info card */}
      <div className="mt-8 bg-gray-50 rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-gray-400" /> How Redirects Work
        </h3>
        <div className="grid sm:grid-cols-3 gap-4 text-xs text-gray-500">
          <div className="flex gap-2">
            <Zap className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-600">Auto-generated</p>
              <p>When a page or article slug is edited, a redirect request is automatically raised.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Clock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-600">Approval required</p>
              <p>All redirects start as <em>Pending</em>. Approve them here to activate. This prevents accidental redirects.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <MousePointerClick className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-600">Click tracking</p>
              <p>Every time a visitor is redirected, the click count increments — useful for diagnosing traffic patterns.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <RedirectModal
          initial={modal.data || null}
          onSave={handleSave}
          onClose={() => { setModal(null); dispatch(clearRedirectError()); }}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

export default AdminRedirects;

// MukonoTalks

