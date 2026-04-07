/**
 * Admin Translation Approval Dashboard
 * Lists all CMS documents with pending/failed translations.
 * Admin can preview, edit, and approve Google-translated content before it goes live.
 *
 * Endpoints used:
 *   GET  /api/translation/pending         — list docs needing attention
 *   GET  /api/translation/document-status — per-doc detail
 *   PUT  /api/translation/approve         — mark lang as approved
 *   PUT  /api/translation/edit-field      — edit translated text
 *   POST /api/translation/document        — re-trigger translation
 *
 * @module pages/admin/AdminTranslations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Globe, CheckCircle2, XCircle, Clock, RefreshCw, Edit3, Save, X, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import adminService from '../../features/admin/adminService';
import TranslationStatusBadge from '../../components/admin/TranslationStatusBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import Spinner from '../../components/ui/Spinner';
import useDocTitle from '../../hooks/useDocTitle';
import toast from 'react-hot-toast';

const LANG_LABELS = { sw: 'Kiswahili', zh: 'Chinese Simplified' };

// ─── Status Icon ──────────────────────────────────────────────────────────────
const StatusIcon = ({ status }) => {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === 'failed')    return <XCircle      className="h-4 w-4 text-red-500" />;
  if (status === 'processing')return <RefreshCw    className="h-4 w-4 text-blue-500 animate-spin" />;
  return <Clock className="h-4 w-4 text-yellow-500" />;
};

// ─── Editable Field Row ───────────────────────────────────────────────────────
const EditableField = ({ model, docId, fieldPath, lang, currentValue, onSaved }) => {
  const [editing, setEditing]   = useState(false);
  const [text, setText]         = useState(currentValue || '');
  const [saving, setSaving]     = useState(false);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await adminService.editLocalizedField({ model, docId, fieldPath, lang, value: text });
      toast.success('Translation updated');
      setEditing(false);
      onSaved && onSaved(fieldPath, lang, text);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-2 mt-1">
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full text-sm border border-gray-300 rounded-[48px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-green-600 text-white rounded-none hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save
          </button>
          <button
            onClick={() => { setEditing(false); setText(currentValue || ''); }}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-none hover:bg-gray-200"
          >
            <X className="h-3 w-3" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 group mt-1">
      <p className="text-sm text-gray-700 flex-1">{currentValue || <span className="text-gray-400 italic">No translation yet</span>}</p>
      <button
        onClick={() => { setText(currentValue || ''); setEditing(true); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-primary-600"
        title="Edit translation"
      >
        <Edit3 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

// ─── Single Document Card ────────────────────────────────────────────────────
const DocCard = ({ item, onApprove, onRetranslate }) => {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail]     = useState(null);
  const [approving, setApproving] = useState({});
  const [localStatus, setLocalStatus] = useState(item.translationStatus || {});

  const loadDetail = useCallback(async () => {
    if (detail) return;
    try {
      const res = await adminService.getDocumentTranslationStatus({ model: item.model, docId: item._id });
      setDetail(res);
    } catch {
      toast.error('Failed to load translation detail');
    }
  }, [detail, item]);

  const toggle = () => {
    if (!expanded) loadDetail();
    setExpanded((p) => !p);
  };

  const handleApprove = async (lang) => {
    setApproving((p) => ({ ...p, [lang]: true }));
    try {
      await adminService.approveTranslation({ model: item.model, docId: item._id, lang });
      toast.success(`${LANG_LABELS[lang]} approved`);
      setLocalStatus((p) => ({ ...p, [lang]: 'completed' }));
      onApprove && onApprove(item._id, lang);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Approval failed');
    } finally {
      setApproving((p) => ({ ...p, [lang]: false }));
    }
  };

  const handleRetranslate = async (lang) => {
    try {
      await adminService.retranslateDocument({ model: item.model, docId: item._id, force: true });
      toast.success('Re-translation queued');
      onRetranslate && onRetranslate(item._id);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to queue retranslation');
    }
  };

  const isApproved = (lang) => !!(detail?.translationMeta?.approvedAt?.[lang]);
  const needsAttention = (lang) => ['pending', 'failed'].includes(localStatus[lang]);

  return (
    <Card className="overflow-hidden">
      {/* Header row */}
      <button onClick={toggle} className="w-full text-left">
        <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary">{item.model}</Badge>
              <span className="text-sm font-medium text-gray-900 truncate">{item.label}</span>
            </div>
            <div className="flex items-center gap-3">
              {['sw', 'zh'].map((lang) => (
                <div key={lang} className="flex items-center gap-1">
                  <StatusIcon status={localStatus[lang]} />
                  <span className="text-xs text-gray-500">{lang.toUpperCase()}</span>
                  {isApproved(lang) && <CheckCircle2 className="h-3 w-3 text-green-600" title="Approved by admin" />}
                </div>
              ))}
            </div>
          </div>
          <div className="shrink-0 text-gray-400">
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-6 pb-6 pt-4 space-y-6">
          {detail === null ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : (
            ['sw', 'zh'].map((lang) => {
              // Gather translated fields for this lang from the SUPPORTED_MODELS map
              // We show field paths that are available in the status detail
              const meta = detail?.translationMeta || {};
              const approved = isApproved(lang);
              const status = localStatus[lang];

              return (
                <div key={lang} className="border border-gray-200 rounded-none p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-gray-800">{LANG_LABELS[lang]}</span>
                      <StatusIcon status={status} />
                      <span className="text-xs text-gray-400 capitalize">{status}</span>
                      {approved && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          Approved {meta.approvedBy?.[lang] ? `by ${meta.approvedBy[lang]}` : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {needsAttention(lang) && (
                        <button
                          onClick={() => handleRetranslate(lang)}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-none hover:bg-blue-100"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Retranslate
                        </button>
                      )}
                      {status === 'completed' && !approved && (
                        <button
                          onClick={() => handleApprove(lang)}
                          disabled={approving[lang]}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 text-white rounded-none hover:bg-green-700 disabled:opacity-50"
                        >
                          {approving[lang]
                            ? <RefreshCw className="h-3 w-3 animate-spin" />
                            : <CheckCircle2 className="h-3 w-3" />}
                          Approve
                        </button>
                      )}
                      {approved && (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Approved
                        </span>
                      )}
                    </div>
                  </div>
                  {meta.translatedAt?.[lang] && (
                    <p className="text-xs text-gray-400 mb-3">
                      Translated {new Date(meta.translatedAt[lang]).toLocaleString()} via {meta.provider?.[lang] || 'Google'}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 italic">
                    Use the edit icon (✎) on any field below to correct the translation, then click Approve.
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}
    </Card>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdminTranslations = () => {
  useDocTitle('Translation Approval | Admin');

  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modelFilter, setModelFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getPendingTranslations();
      setItems(res?.data || []);
    } catch {
      toast.error('Failed to load translations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const models = ['', ...new Set(items.map((i) => i.model))];
  const filtered = modelFilter ? items.filter((i) => i.model === modelFilter) : items;

  const stats = {
    total: items.length,
    failed: items.filter((i) => i.translationStatus?.sw === 'failed' || i.translationStatus?.zh === 'failed').length,
    pending: items.filter((i) => i.translationStatus?.sw === 'pending' || i.translationStatus?.zh === 'pending').length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Globe className="h-7 w-7 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Translation Approval</h1>
            <p className="text-sm text-gray-500">Review Google-translated content and approve before it's served to users</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-white border border-gray-200 rounded-none hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-5 text-center">
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500 mt-1">Documents needing review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5 text-center">
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-gray-500 mt-1">Pending translation</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5 text-center">
            <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-sm text-gray-500 mt-1">Failed — retry needed</p>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-5">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">How approval works</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Google Translate automatically translates content when saved (via BullMQ queue)</li>
            <li>Expand a document below to review the SW / ZH translation</li>
            <li>Edit any field with the pencil icon if the translation needs correction</li>
            <li>Click <strong>Approve</strong> to mark the translation as reviewed</li>
            <li>Approved status is stored in <code className="font-mono text-xs">translationMeta.approvedAt</code></li>
          </ol>
        </CardContent>
      </Card>

      {/* Filter */}
      {models.length > 2 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Filter by model:</span>
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-[48px] px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All models</option>
            {models.filter(Boolean).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}

      {/* Document List */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">All translations are complete</p>
            <p className="text-sm text-gray-400 mt-1">No documents have pending or failed translations.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <DocCard
              key={`${item.model}-${item._id}`}
              item={item}
              onApprove={(id, lang) => {
                setItems((prev) =>
                  prev.map((i) =>
                    i._id === id ? { ...i, translationStatus: { ...i.translationStatus, [lang]: 'completed' } } : i
                  )
                );
              }}
              onRetranslate={(id) => {
                setItems((prev) =>
                  prev.map((i) =>
                    i._id === id
                      ? { ...i, translationStatus: { ...i.translationStatus, sw: 'processing', zh: 'processing' } }
                      : i
                  )
                );
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTranslations;

// MukonoTalks

