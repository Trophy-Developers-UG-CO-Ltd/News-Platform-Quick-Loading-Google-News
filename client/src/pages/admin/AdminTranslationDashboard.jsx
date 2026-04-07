/**
 * Premium Translation Dashboard
 * ==============================
 * Full-featured admin dashboard for managing CMS translations,
 * batch operations, BullMQ queue monitoring, and language detection.
 *
 * Endpoints used:
 *   GET  /api/translation/status           — system health
 *   GET  /api/translation/queue/stats      — queue counts
 *   GET  /api/translation/queue/jobs       — list jobs by status
 *   GET  /api/translation/queue/jobs/:id   — single job detail
 *   POST /api/translation/batch            — batch translate (missing / force / dry-run)
 *   POST /api/translation/request          — single translation request
 *   POST /api/translation/detect-language  — language detection
 *   POST /api/translation/queue/jobs/:id/retry   — retry failed job
 *   POST /api/translation/queue/jobs/:id/promote — promote delayed job
 *   DELETE /api/translation/queue/jobs/:id        — remove job
 *
 * @module pages/admin/AdminTranslationDashboard
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Globe,
  Languages,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Play,
  Sparkles,
  ShieldCheck,
  BarChart3,
  FileText,
  Package,
  Layers,
  Search,
  Eye,
  RotateCcw,
  Trash2,
  ArrowUpCircle,
  Zap,
  Target,
  FlaskConical,
  Settings2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Edit3,
  Save,
  X,
  XCircle,
  ClipboardCheck,
} from 'lucide-react';
import adminService from '../../features/admin/adminService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import Spinner from '../../components/ui/Spinner';
import useDocTitle from '../../hooks/useDocTitle';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const SUPPORTED_MODELS = ['Product', 'Category', 'Article', 'Page', 'Hero', 'HomepageSection', 'NavItem', 'FooterSettings'];

const LANG_LABELS = { en: 'English', sw: 'Kiswahili', zh: 'Chinese', auto: 'Auto Detect' };

const QUEUE_STATUSES = ['waiting', 'active', 'delayed', 'completed', 'failed'];

const STAT_ICONS = {
  waiting: Clock,
  active: RefreshCw,
  delayed: Clock,
  completed: CheckCircle2,
  failed: AlertTriangle,
};

const STAT_COLORS = {
  waiting: 'text-blue-600 bg-blue-50',
  active: 'text-indigo-600 bg-indigo-50',
  delayed: 'text-amber-600 bg-amber-50',
  completed: 'text-emerald-600 bg-emerald-50',
  failed: 'text-red-600 bg-red-50',
};

const BADGE_VARIANTS = {
  waiting: 'info',
  active: 'default',
  delayed: 'warning',
  completed: 'success',
  failed: 'destructive',
};

const TAB_ITEMS = [
  { id: 'overview',  label: 'Overview',           icon: BarChart3 },
  { id: 'approval',  label: 'Approval',           icon: ClipboardCheck },
  { id: 'batch',     label: 'Batch Commands',     icon: Zap },
  { id: 'queue',     label: 'Queue Monitor',      icon: Layers },
  { id: 'request',   label: 'Single Request',     icon: FileText },
  { id: 'settings',  label: 'Settings & CLI Map', icon: Settings2 },
];

// ─── Queue Stats Hook ─────────────────────────────────────────────────────────

function useQueueStats(refreshKey) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState(null);
  const didLoad = useRef(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getQueueStats();
      setStats(res.counts || {});
      setNote(res.note || null);
    } catch {
      // Stats unavailable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (didLoad.current && refreshKey === 0) return;
    didLoad.current = true;
    load();
  }, [load, refreshKey]);
  return { stats, loading, note, reload: load };
}

// ─── Queue Jobs Hook ──────────────────────────────────────────────────────────

function useQueueJobs(status, refreshKey) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const didLoad = useRef(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getQueueTranslationJobs({ status, start: 0, end: 49 });
      setJobs(res.jobs || []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (didLoad.current && refreshKey === 0) return;
    didLoad.current = true;
    load();
  }, [load, refreshKey]);
  return { jobs, loading, reload: load };
}

// ─── Auto Refresh Hook ───────────────────────────────────────────────────────

function useAutoRefresh(enabled = true, intervalMs = 12000) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setTick((n) => n + 1), intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs]);

  return tick;
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

const TabButton = ({ active, icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-none transition whitespace-nowrap ${
      active
        ? 'bg-primary-600 text-white shadow-sm'
        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
    }`}
  >
    <Icon className="h-4 w-4" />
    {label}
  </button>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, colorClass }) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 capitalize">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value ?? '—'}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function AdminTranslationDashboard() {
  useDocTitle('Translation Dashboard');

  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshTick = useAutoRefresh(autoRefresh, 12000);
  const [manualRefreshKey, setManualRefreshKey] = useState(0);
  const refreshKey = refreshTick + manualRefreshKey;

  const { stats, loading: statsLoading, note: queueNote, reload: reloadStats } = useQueueStats(refreshKey);

  const refreshAll = () => {
    setManualRefreshKey((n) => n + 1);
    reloadStats();
  };

  const counts = useMemo(() => ({
    waiting: stats?.waiting || 0,
    active: stats?.active || 0,
    delayed: stats?.delayed || 0,
    completed: stats?.completed || 0,
    failed: stats?.failed || 0,
  }), [stats]);

  // ─── System status ──────────────────────────────────────────────────
  const [systemStatus, setSystemStatus] = useState(null);
  const didLoadStatus = useRef(false);

  useEffect(() => {
    if (didLoadStatus.current) return;
    didLoadStatus.current = true;
    adminService.getTranslationStatus()
      .then((res) => setSystemStatus(res.translation))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Globe className="h-7 w-7 text-primary-600" />
            Translation Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage CMS translations, batch operations, and BullMQ queue activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded-[48px]"
            />
            Auto-refresh
          </label>
          <button
            onClick={refreshAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-none hover:bg-primary-700 transition"
          >
            <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* System Status Banner */}
      {systemStatus && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="font-medium text-gray-700">Provider:</span>
            <Badge variant={(systemStatus.googleConfigured || systemStatus.aiConfigured) ? 'success' : 'destructive'}>
              {systemStatus.activeProvider === 'ai' ? 'AI (LLM)' : 'Google Translate'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-gray-700">Queue:</span>
            <Badge variant={systemStatus.queue?.backend === 'bullmq-redis' ? 'success' : 'warning'}>
              {systemStatus.queue?.backend || 'in-process'}
            </Badge>
          </div>
          {systemStatus.cache && (
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-gray-700">Cache:</span>
              <span className="text-gray-600">{systemStatus.cache.size ?? 0} entries</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-orange-600" />
            <span className="font-medium text-gray-700">Targets:</span>
            <span className="text-gray-600">
              {systemStatus.supportedTargetLanguages?.join(', ') || 'sw, zh'}
            </span>
          </div>
        </div>
      )}

      {/* Redis unavailable warning */}
      {queueNote && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{queueNote} — queue stats will show zero until Redis is available.</span>
        </div>
      )}

      {/* Queue Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {QUEUE_STATUSES.map((s) => {
          const Icon = STAT_ICONS[s];
          return (
            <StatCard
              key={s}
              label={s}
              value={statsLoading ? '…' : counts[s]}
              icon={Icon}
              colorClass={STAT_COLORS[s]}
            />
          );
        })}
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {TAB_ITEMS.map((tab) => (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id}
            icon={tab.icon}
            label={tab.label}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab counts={counts} refreshAll={refreshAll} />}
      {activeTab === 'approval' && <ApprovalTab />}
      {activeTab === 'batch' && <BatchTab refreshAll={refreshAll} />}
      {activeTab === 'queue' && <QueueTab refreshKey={refreshKey} refreshAll={refreshAll} />}
      {activeTab === 'request' && <RequestTab refreshAll={refreshAll} />}
      {activeTab === 'settings' && <SettingsTab />}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═════════════════════════════════════════════════════════════════════════════

function OverviewTab({ counts, refreshAll }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const didLoad = useRef(false);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    setLoading(true);
    adminService.getPendingTranslations()
      .then((res) => setPending(res.data || []))
      .catch(() => setPending([]))
      .finally(() => setLoading(false));
  }, []);

  const modelSummary = useMemo(() => {
    const map = {};
    pending.forEach((doc) => {
      if (!map[doc.model]) map[doc.model] = { total: 0, failed: 0, pending: 0, processing: 0 };
      map[doc.model].total++;
      const sw = doc.translationStatus?.sw;
      const zh = doc.translationStatus?.zh;
      [sw, zh].forEach((s) => {
        if (s === 'failed') map[doc.model].failed++;
        if (s === 'pending') map[doc.model].pending++;
        if (s === 'processing') map[doc.model].processing++;
      });
    });
    return Object.entries(map);
  }, [pending]);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Quick Actions
          </CardTitle>
          <CardDescription>One-click batch operations for all models</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickActionButton
              label="Translate All Missing"
              desc="Queue all untranslated content"
              icon={Target}
              onClick={async () => {
                try {
                  const res = await adminService.runBatchTranslation({});
                  toast.success(`Translated ${res.totalFieldsTranslated} fields across ${res.summary?.length} models`);
                  refreshAll();
                } catch (err) {
                  toast.error(err?.response?.data?.message || 'Batch failed');
                }
              }}
            />
            <QuickActionButton
              label="Dry Run Preview"
              desc="See what would be translated"
              icon={FlaskConical}
              variant="outline"
              onClick={async () => {
                try {
                  const res = await adminService.runBatchTranslation({ dryRun: true });
                  const count = res.summary?.reduce((n, s) => n + s.docsScanned, 0) || 0;
                  toast.success(`Dry run: ${count} docs would be affected`);
                } catch (err) {
                  toast.error(err?.response?.data?.message || 'Dry run failed');
                }
              }}
            />
            <QuickActionButton
              label="Force Re-translate All"
              desc="Override existing translations"
              icon={RotateCcw}
              variant="outline"
              onClick={async () => {
                try {
                  const res = await adminService.runBatchTranslation({ force: true });
                  toast.success(`Force-translated ${res.totalFieldsTranslated} fields`);
                  refreshAll();
                } catch (err) {
                  toast.error(err?.response?.data?.message || 'Force batch failed');
                }
              }}
            />
            <QuickActionButton
              label="Clear Cache"
              desc="Reset translation memory"
              icon={Trash2}
              variant="outline"
              onClick={async () => {
                try {
                  await adminService.clearCache();
                  toast.success('Translation cache cleared');
                } catch (err) {
                  toast.error('Failed to clear cache');
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pending Translations by Model */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Pending Translations by Model
          </CardTitle>
          <CardDescription>
            Documents with missing or failed translations ({pending.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : modelSummary.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <CheckCircle2 className="h-12 w-12 mb-2" />
              <p className="text-sm font-medium">All translations up to date</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 pr-4 font-medium">Model</th>
                    <th className="pb-3 pr-4 font-medium">Total Docs</th>
                    <th className="pb-3 pr-4 font-medium">Pending</th>
                    <th className="pb-3 pr-4 font-medium">Processing</th>
                    <th className="pb-3 pr-4 font-medium">Failed</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {modelSummary.map(([model, data]) => (
                    <tr key={model} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium text-gray-900">{model}</td>
                      <td className="py-3 pr-4">{data.total}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="warning">{data.pending}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="info">{data.processing}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="destructive">{data.failed}</Badge>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={async () => {
                            try {
                              const res = await adminService.runBatchTranslation({ model });
                              toast.success(`${model}: ${res.totalFieldsTranslated} fields translated`);
                              refreshAll();
                            } catch (err) {
                              toast.error(err?.response?.data?.message || `${model} batch failed`);
                            }
                          }}
                          className="px-3 py-1 text-xs font-medium bg-primary-600 text-white rounded-none hover:bg-primary-700 transition"
                        >
                          Translate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────

function QuickActionButton({ label, desc, icon: Icon, variant, onClick }) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      await onClick();
    } finally {
      setBusy(false);
    }
  };

  const isOutline = variant === 'outline';

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={`flex items-start gap-3 rounded-none border p-4 text-left transition disabled:opacity-50 ${
        isOutline
          ? 'border-gray-200 bg-white hover:bg-gray-50 text-gray-900'
          : 'border-primary-600 bg-primary-600 hover:bg-primary-700 text-white'
      }`}
    >
      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
        isOutline ? 'bg-gray-100 text-gray-600' : 'bg-white/20 text-white'
      }`}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      </div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className={`mt-0.5 text-xs ${isOutline ? 'text-gray-500' : 'text-white/75'}`}>{desc}</p>
      </div>
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// APPROVAL TAB
// ═════════════════════════════════════════════════════════════════════════════

const APPROVAL_LANG_LABELS = { sw: 'Kiswahili', zh: 'Chinese Simplified' };

const ApprovalStatusIcon = ({ status }) => {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === 'failed')    return <XCircle      className="h-4 w-4 text-red-500" />;
  if (status === 'processing')return <RefreshCw    className="h-4 w-4 text-blue-500 animate-spin" />;
  return <Clock className="h-4 w-4 text-yellow-500" />;
};

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

const ApprovalDocCard = ({ item, onApprove, onRetranslate }) => {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail]     = useState(null);
  const [approving, setApproving] = useState({});
  const [localStatus, setLocalStatus] = useState(item.translationStatus || {});
  const [localFields, setLocalFields] = useState({});

  const loadDetail = useCallback(async () => {
    if (detail) return;
    try {
      const res = await adminService.getDocumentTranslationStatus({ model: item.model, docId: item._id });
      setDetail(res);
      if (res.translatedFields) setLocalFields(res.translatedFields);
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
      toast.success(`${APPROVAL_LANG_LABELS[lang]} approved`);
      setLocalStatus((p) => ({ ...p, [lang]: 'completed' }));
      // Refresh detail so approved badge shows
      const res = await adminService.getDocumentTranslationStatus({ model: item.model, docId: item._id });
      setDetail(res);
      onApprove && onApprove(item._id, lang);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Approval failed');
    } finally {
      setApproving((p) => ({ ...p, [lang]: false }));
    }
  };

  const handleRetranslate = async () => {
    try {
      await adminService.retranslateDocument({ model: item.model, docId: item._id, force: true });
      toast.success('Re-translation queued');
      onRetranslate && onRetranslate(item._id);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to queue retranslation');
    }
  };

  const handleFieldSaved = (fieldPath, lang, newValue) => {
    setLocalFields((prev) => ({
      ...prev,
      [fieldPath]: { ...prev[fieldPath], [lang]: newValue },
    }));
  };

  const isApproved = (lang) => !!(detail?.translationMeta?.approvedAt?.[lang]);
  const needsAttention = (lang) => ['pending', 'failed'].includes(localStatus[lang]);

  const fieldPaths = Object.keys(localFields);

  return (
    <Card className="overflow-hidden">
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
                  <ApprovalStatusIcon status={localStatus[lang]} />
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

      {expanded && (
        <div className="border-t border-gray-100 px-6 pb-6 pt-4 space-y-6">
          {detail === null ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : (
            ['sw', 'zh'].map((lang) => {
              const meta = detail?.translationMeta || {};
              const approved = isApproved(lang);
              const status = localStatus[lang];

              return (
                <div key={lang} className="border border-gray-200 rounded-none p-4 space-y-4">
                  {/* Lang header + action buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-gray-800">{APPROVAL_LANG_LABELS[lang]}</span>
                      <ApprovalStatusIcon status={status} />
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
                          onClick={() => handleRetranslate()}
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
                    <p className="text-xs text-gray-400">
                      Translated {new Date(meta.translatedAt[lang]).toLocaleString()} via {meta.provider?.[lang] || 'Google'}
                    </p>
                  )}

                  {/* Translated field values — editable */}
                  {fieldPaths.length > 0 ? (
                    <div className="space-y-3">
                      {fieldPaths.map((fieldPath) => {
                        const enVal  = localFields[fieldPath]?.en || '';
                        const langVal = localFields[fieldPath]?.[lang] || '';
                        const shortName = fieldPath.replace(/^localized/, '').replace(/^heading\.localized/, 'Heading ');

                        return (
                          <div key={fieldPath} className="rounded-none border border-gray-100 bg-gray-50 p-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">{shortName}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">English (source)</p>
                                <p className="text-sm text-gray-700">{enVal || <span className="text-gray-400 italic">—</span>}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">{APPROVAL_LANG_LABELS[lang]}</p>
                                <EditableField
                                  model={item.model}
                                  docId={item._id}
                                  fieldPath={fieldPath}
                                  lang={lang}
                                  currentValue={langVal}
                                  onSaved={handleFieldSaved}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No translatable fields found for this document.</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </Card>
  );
};

function ApprovalTab() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modelFilter, setModelFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getPendingTranslations({ includeUnapproved: true });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Translation Approval</h2>
          <p className="text-sm text-gray-500">Review Google-translated content and approve before it's served to users</p>
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
            <ApprovalDocCard
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
}

// ═════════════════════════════════════════════════════════════════════════════
// BATCH COMMANDS TAB
// ═════════════════════════════════════════════════════════════════════════════

function BatchTab({ refreshAll }) {
  const [model, setModel] = useState('');
  const [limit, setLimit] = useState('200');
  const [force, setForce] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState(null);

  const handleBatch = async (overrides = {}) => {
    const actionName = overrides.actionName || 'custom';
    setBusy(actionName);
    setResult(null);
    try {
      const payload = {
        ...(model ? { model } : {}),
        limit: Number(limit) || 200,
        force: overrides.force ?? force,
        dryRun: overrides.dryRun ?? dryRun,
      };
      const res = await adminService.runBatchTranslation(payload);
      setResult(res);
      if (res.dryRun) {
        toast.success(`Dry run complete — ${res.summary?.reduce((n, s) => n + s.docsScanned, 0) || 0} docs scanned`);
      } else {
        toast.success(`Batch complete — ${res.totalFieldsTranslated} fields translated`);
        refreshAll();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Batch operation failed');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Pre-built Commands */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Batch Command Center
          </CardTitle>
          <CardDescription>
            Pre-configured batch operations mapped to CLI equivalents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => handleBatch({ force: false, dryRun: false, actionName: 'missing' })}
              disabled={!!busy}
              className="flex flex-col items-start gap-1 rounded-none border border-primary-600 bg-primary-600 p-5 text-left text-white hover:bg-primary-700 transition disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                <span className="font-semibold">Translate Missing Only</span>
              </div>
              <span className="text-xs text-white/70">
                {busy === 'missing' ? 'Running…' : 'Equivalent to npm run translate:batch'}
              </span>
            </button>

            <button
              onClick={() => handleBatch({ force: false, dryRun: true, actionName: 'dry' })}
              disabled={!!busy}
              className="flex flex-col items-start gap-1 rounded-none border border-gray-200 bg-white p-5 text-left text-gray-900 hover:bg-gray-50 transition disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-purple-600" />
                <span className="font-semibold">Dry Run Preview</span>
              </div>
              <span className="text-xs text-gray-500">
                {busy === 'dry' ? 'Running…' : 'Equivalent to npm run translate:batch:dry'}
              </span>
            </button>

            <button
              onClick={() => handleBatch({ force: true, dryRun: false, actionName: 'force' })}
              disabled={!!busy}
              className="flex flex-col items-start gap-1 rounded-none border border-gray-200 bg-white p-5 text-left text-gray-900 hover:bg-gray-50 transition disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-orange-600" />
                <span className="font-semibold">Force Re-translate All</span>
              </div>
              <span className="text-xs text-gray-500">
                {busy === 'force' ? 'Running…' : 'Equivalent to npm run translate:batch:force'}
              </span>
            </button>

            <button
              onClick={() => handleBatch({ actionName: 'custom' })}
              disabled={!!busy}
              className="flex flex-col items-start gap-1 rounded-none border border-gray-200 bg-white p-5 text-left text-gray-900 hover:bg-gray-50 transition disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-gray-600" />
                <span className="font-semibold">Custom Batch</span>
              </div>
              <span className="text-xs text-gray-500">
                {busy === 'custom' ? 'Running…' : 'Uses form settings below'}
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Batch Runner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-gray-500" />
            Custom Batch Runner
          </CardTitle>
          <CardDescription>
            Equivalent to: <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">node scripts/translateBatch.js --model=Product --limit=100</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full border border-gray-300 rounded-[48px] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Models</option>
                {SUPPORTED_MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Limit</label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full border border-gray-300 rounded-[48px] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="1"
                max="1000"
              />
            </div>

            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="rounded-[48px]"
                />
                Dry run
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={force}
                  onChange={(e) => setForce(e.target.checked)}
                  className="rounded-[48px]"
                />
                Force
              </label>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={() => handleBatch({ actionName: 'custom' })}
              disabled={!!busy}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary-600 text-white rounded-none hover:bg-primary-700 transition disabled:opacity-50"
            >
              {busy === 'custom' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run Custom Batch
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Last Result */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              {result.dryRun ? 'Dry Run Result' : 'Batch Result'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <Badge variant={result.dryRun ? 'warning' : 'success'}>
                  {result.dryRun ? 'Preview' : 'Completed'}
                </Badge>
                <span className="text-sm text-gray-600">
                  {result.totalFieldsTranslated} fields translated
                </span>
              </div>
              {result.summary?.map((s, i) => (
                <div key={i} className="flex items-center gap-4 border-t border-gray-200 py-2 text-sm">
                  <span className="font-medium text-gray-800 w-32">{s.model}</span>
                  <span className="text-gray-600">{s.docsScanned} docs scanned</span>
                  <span className="text-emerald-600">{s.fieldsTranslated} translated</span>
                  <span className="text-gray-400">{s.fieldsSkipped} skipped</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE MONITOR TAB
// ═════════════════════════════════════════════════════════════════════════════

function QueueTab({ refreshKey, refreshAll }) {
  const [queueStatus, setQueueStatus] = useState('waiting');
  const { jobs, loading: jobsLoading, reload: reloadJobs } = useQueueJobs(queueStatus, refreshKey);
  const [actionBusy, setActionBusy] = useState('');

  const handleRetry = async (jobId) => {
    setActionBusy(`retry-${jobId}`);
    try {
      await adminService.retryQueueTranslationJob(jobId);
      toast.success(`Job ${jobId} queued for retry`);
      reloadJobs();
      refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Retry failed');
    } finally {
      setActionBusy('');
    }
  };

  const handlePromote = async (jobId) => {
    setActionBusy(`promote-${jobId}`);
    try {
      await adminService.promoteQueueTranslationJob(jobId);
      toast.success(`Job ${jobId} promoted`);
      reloadJobs();
      refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Promote failed');
    } finally {
      setActionBusy('');
    }
  };

  const handleRemove = async (jobId) => {
    setActionBusy(`remove-${jobId}`);
    try {
      await adminService.removeQueueTranslationJob(jobId);
      toast.success(`Job ${jobId} removed`);
      reloadJobs();
      refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Remove failed');
    } finally {
      setActionBusy('');
    }
  };

  const [viewingJob, setViewingJob] = useState(null);

  const handleView = async (jobId) => {
    setActionBusy(`view-${jobId}`);
    try {
      const res = await adminService.getQueueTranslationJob(jobId);
      setViewingJob(res.job || res);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load job');
    } finally {
      setActionBusy('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-500" />
            BullMQ Queue Monitor
          </CardTitle>
          <CardDescription>Real-time view of translation queue jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {QUEUE_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setQueueStatus(s)}
                className={`px-4 py-2 text-sm font-medium rounded-none transition capitalize ${
                  queueStatus === s
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
            <button
              onClick={() => { reloadJobs(); refreshAll(); }}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
            >
              <RefreshCw className={`h-4 w-4 ${jobsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Jobs Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Job ID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium">Attempts</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobsLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <Spinner />
                    </td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      No {queueStatus} jobs found.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{job.id}</td>
                      <td className="px-4 py-3">{job.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600">
                          {job.data?.modelName || job.data?.entityType || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full transition-all"
                              style={{ width: `${job.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{job.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{job.attemptsMade || 0}</td>
                      <td className="px-4 py-3">
                        <Badge variant={BADGE_VARIANTS[queueStatus] || 'secondary'} className="capitalize">
                          {queueStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => handleView(job.id)}
                            disabled={actionBusy === `view-${job.id}`}
                            className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-none hover:bg-gray-200 transition disabled:opacity-50"
                          >
                            <Eye className="h-3 w-3 inline mr-1" />
                            View
                          </button>
                          {queueStatus === 'failed' && (
                            <button
                              onClick={() => handleRetry(job.id)}
                              disabled={actionBusy === `retry-${job.id}`}
                              className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-none hover:bg-blue-100 transition disabled:opacity-50"
                            >
                              <RotateCcw className="h-3 w-3 inline mr-1" />
                              Retry
                            </button>
                          )}
                          {queueStatus === 'delayed' && (
                            <button
                              onClick={() => handlePromote(job.id)}
                              disabled={actionBusy === `promote-${job.id}`}
                              className="px-2 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-none hover:bg-amber-100 transition disabled:opacity-50"
                            >
                              <ArrowUpCircle className="h-3 w-3 inline mr-1" />
                              Promote
                            </button>
                          )}
                          <button
                            onClick={() => handleRemove(job.id)}
                            disabled={actionBusy === `remove-${job.id}`}
                            className="px-2 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-none hover:bg-red-100 transition disabled:opacity-50"
                          >
                            <Trash2 className="h-3 w-3 inline mr-1" />
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Job Detail Modal */}
      {viewingJob && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                Job Detail: {viewingJob.id}
              </CardTitle>
              <button
                onClick={() => setViewingJob(null)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕ Close
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="rounded-xl bg-gray-900 p-4 text-xs text-gray-100 overflow-x-auto max-h-80">
              {JSON.stringify(viewingJob, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SINGLE REQUEST TAB
// ═════════════════════════════════════════════════════════════════════════════

function RequestTab({ refreshAll }) {
  const [entityType, setEntityType] = useState('Product');
  const [entityId, setEntityId] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [sampleText, setSampleText] = useState('');
  const [busy, setBusy] = useState('');

  const handleDetect = async () => {
    setBusy('detect');
    try {
      const res = await adminService.detectLanguage(sampleText);
      setSourceLanguage(res.language || 'en');
      toast.success(`Detected: ${LANG_LABELS[res.language] || res.language}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Detection failed');
    } finally {
      setBusy('');
    }
  };

  const handleSubmit = async () => {
    if (!entityId.trim()) {
      toast.error('Entity ID is required');
      return;
    }
    setBusy('submit');
    try {
      await adminService.requestTranslationJob({
        model: entityType,
        docId: entityId.trim(),
        force: false,
      });
      toast.success(`Translation job queued for ${entityType} ${entityId}`);
      refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Request failed');
    } finally {
      setBusy('');
    }
  };

  const handleRetranslate = async () => {
    if (!entityId.trim()) {
      toast.error('Entity ID is required');
      return;
    }
    setBusy('retranslate');
    try {
      await adminService.retranslateDocument({
        model: entityType,
        docId: entityId.trim(),
        force: true,
      });
      toast.success(`Force re-translation queued for ${entityType} ${entityId}`);
      refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Retranslation failed');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Translation Request */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-500" />
            Request Translation
          </CardTitle>
          <CardDescription>
            Queue a translation job for a specific CMS document
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Entity Type</label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="w-full border border-gray-300 rounded-[48px] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {SUPPORTED_MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Entity ID</label>
              <input
                type="text"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="MongoDB ObjectId (e.g. 69b9ce8f7ac8559d...)"
                className="w-full border border-gray-300 rounded-[48px] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSubmit}
              disabled={!entityId.trim() || !!busy}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary-600 text-white rounded-none hover:bg-primary-700 transition disabled:opacity-50"
            >
              {busy === 'submit' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Submit Translation Job
            </button>
            <button
              onClick={handleRetranslate}
              disabled={!entityId.trim() || !!busy}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-gray-200 bg-white text-gray-700 rounded-none hover:bg-gray-50 transition disabled:opacity-50"
            >
              {busy === 'retranslate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Force Re-translate
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Language Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-purple-500" />
            Language Detection
          </CardTitle>
          <CardDescription>
            Auto-detect the source language of any text sample
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sample Text</label>
            <textarea
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              placeholder="Paste text here to auto-detect source language…"
              rows={4}
              className="w-full border border-gray-300 rounded-[48px] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleDetect}
              disabled={!sampleText.trim() || !!busy}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-gray-200 bg-white text-gray-700 rounded-none hover:bg-gray-50 transition disabled:opacity-50"
            >
              {busy === 'detect' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Detect Language
            </button>

            {sourceLanguage && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="info">{LANG_LABELS[sourceLanguage] || sourceLanguage}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SETTINGS & CLI MAP TAB
// ═════════════════════════════════════════════════════════════════════════════

function SettingsTab() {
  const cliMapping = [
    { cli: 'npm run translate:batch',                 api: 'POST /api/translation/batch',         desc: 'Translate all missing sw/zh' },
    { cli: 'npm run translate:batch:dry',             api: 'POST /api/translation/batch',         desc: 'Preview without writing (dryRun: true)' },
    { cli: 'npm run translate:batch:force',           api: 'POST /api/translation/batch',         desc: 'Re-translate all (force: true)' },
    { cli: 'node scripts/translateBatch.js --model=X', api: 'POST /api/translation/batch',        desc: 'Target a specific model' },
    { cli: 'POST /api/translation/detect-language',   api: 'POST /api/translation/detect-language', desc: 'Detect source language of text' },
    { cli: 'POST /api/translation/request',           api: 'POST /api/translation/request',       desc: 'Queue single doc translation' },
    { cli: 'GET /api/translation/queue/stats',        api: 'GET /api/translation/queue/stats',    desc: 'BullMQ queue counts' },
    { cli: 'GET /api/translation/queue/jobs',         api: 'GET /api/translation/queue/jobs',     desc: 'List jobs by status' },
  ];

  return (
    <div className="space-y-6">
      {/* CLI to API Mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-gray-500" />
            CLI → API Mapping
          </CardTitle>
          <CardDescription>
            How CLI commands map to dashboard API endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">CLI Command</th>
                  <th className="px-4 py-3 font-medium">API Endpoint</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {cliMapping.map((row, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{row.cli}</code>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">{row.api}</code>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            Environment Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
              <code className="text-xs font-mono font-semibold text-gray-800">TRANSLATION_PROVIDER</code>
              <span className="text-gray-500">— <code className="text-xs">"google"</code> (default) or <code className="text-xs">"ai"</code> (LLM-based)</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
              <code className="text-xs font-mono font-semibold text-gray-800">GOOGLE_TRANSLATE_API_KEY</code>
              <span className="text-gray-500">— Google Cloud Translation v2 API key</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
              <code className="text-xs font-mono font-semibold text-gray-800">AI_TRANSLATION_API_KEY</code>
              <span className="text-gray-500">— OpenAI-compatible API key for AI provider</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
              <code className="text-xs font-mono font-semibold text-gray-800">AI_TRANSLATION_MODEL</code>
              <span className="text-gray-500">— LLM model name (default: <code className="text-xs">gpt-4o-mini</code>)</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
              <code className="text-xs font-mono font-semibold text-gray-800">AI_TRANSLATION_BASE_URL</code>
              <span className="text-gray-500">— Custom base URL (default: <code className="text-xs">https://api.openai.com/v1</code>)</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
              <code className="text-xs font-mono font-semibold text-gray-800">REDIS_URL</code>
              <span className="text-gray-500">— BullMQ queue backend (optional, falls back to in-process)</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
              <code className="text-xs font-mono font-semibold text-gray-800">VITE_API_BASE_URL</code>
              <span className="text-gray-500">— Frontend API base URL (leave empty for same-origin proxy)</span>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm font-medium text-amber-800">Production Notes</p>
            <ul className="mt-2 space-y-1 text-xs text-amber-700">
              <li>• Never translate at request time — always queue via BullMQ</li>
              <li>• Content is auto-translated on save, then served from cache</li>
              <li>• Set <strong>TRANSLATION_PROVIDER=ai</strong> to use LLM-based translation (OpenAI-compatible)</li>
              <li>• AI provider sends all fields in one prompt for better context and coherence</li>
              <li>• If AI provider fails, it automatically falls back to Google Translate</li>
              <li>• For technical/chemical content, review machine translations before publishing</li>
              <li>• Use the <strong>Approval</strong> tab above to review and approve translations</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Glossary Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Industry Glossary (Reference)
          </CardTitle>
          <CardDescription>
            Key terms with locked translations for consistency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">English Term</th>
                  <th className="px-4 py-3 font-medium">Kiswahili</th>
                  <th className="px-4 py-3 font-medium">Chinese</th>
                  <th className="px-4 py-3 font-medium">Domain</th>
                  <th className="px-4 py-3 font-medium">Locked</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { term: 'Ion Exchange Resin', sw: 'Resini ya Kubadilishana Ioni', zh: '离子交换树脂', domain: 'Water Treatment', lock: true },
                  { term: 'Polyester Resin', sw: 'Resini ya Polyester', zh: '聚酯树脂', domain: 'Composites', lock: true },
                  { term: 'Pigment', sw: 'Rangi ya Chembe', zh: '颜料', domain: 'Coatings', lock: false },
                  { term: 'SDS', sw: 'Karatasi ya Data ya Usalama', zh: '安全数据表', domain: 'Compliance', lock: true },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.term}</td>
                    <td className="px-4 py-3 text-gray-600">{row.sw}</td>
                    <td className="px-4 py-3 text-gray-600">{row.zh}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{row.domain}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {row.lock ? (
                        <Badge variant="success">Locked</Badge>
                      ) : (
                        <Badge variant="outline">Editable</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// MukonoTalks

