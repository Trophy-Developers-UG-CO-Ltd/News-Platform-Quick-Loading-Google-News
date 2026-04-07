/**
 * AdminTemplateEditor
 * Content Template management for auto-generated application description pages
 * Route: /admin/content-templates/application-description
 * @module pages/admin/AdminTemplateEditor
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  FiSave, FiEye, FiCode, FiClock, FiRotateCcw, FiAlertTriangle,
  FiCheckCircle, FiChevronDown, FiChevronUp, FiX, FiPackage,
  FiTag, FiPlus, FiInfo,
} from 'react-icons/fi';
import { MdAutoAwesome } from 'react-icons/md';
import Spinner from '../../components/ui/Spinner';
import adminService from '../../features/admin/adminService';

// ─── Defaults ─────────────────────────────────────────────────
const TEMPLATE_TYPE = 'application_description';
const TEMPLATE_NAME = 'Application Description Template';

const DEFAULT_HTML = `<h1>{product_name} for {application_name}</h1>

<p>
  {product_name} is engineered for industrial coating systems used in
  {application_name}. The resin delivers reliable durability,
  excellent surface appearance, and strong mechanical performance.
</p>

<h2>Key Performance Advantages</h2>

<ul>
{benefits}
</ul>

<h2>Typical Applications</h2>

<ul>
{applications}
</ul>

<h2>Processing Conditions</h2>

<p>{curing_condition}</p>

<h2>Industries Served</h2>

<ul>
{industries}
</ul>`;

// ─── Supported placeholders ───────────────────────────────────
const PLACEHOLDERS = [
  { key: '{product_name}',        label: 'Product Name',        color: 'bg-blue-100 text-blue-800' },
  { key: '{application_name}',    label: 'Application Name',    color: 'bg-green-100 text-green-800' },
  { key: '{product_description}', label: 'Product Description', color: 'bg-purple-100 text-purple-800' },
  { key: '{benefits}',            label: 'Benefits List',       color: 'bg-yellow-100 text-yellow-800' },
  { key: '{applications}',        label: 'Applications List',   color: 'bg-orange-100 text-orange-800' },
  { key: '{curing_condition}',    label: 'Curing Condition',    color: 'bg-rose-100 text-rose-800' },
  { key: '{industries}',          label: 'Industries',          color: 'bg-teal-100 text-teal-800' },
];

// ─── Allowed tags ──────────────────────────────────────────────
const ALLOWED_TAGS = ['h1', 'h2', 'p', 'ul', 'li', 'strong'];

function validateHtml(html) {
  const errors = [];
  if (/style\s*=/i.test(html)) errors.push('Inline styles are not allowed.');
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
  let match;
  const seen = new Set();
  while ((match = tagPattern.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    if (!ALLOWED_TAGS.includes(tag) && !seen.has(tag)) {
      seen.add(tag);
      errors.push(`<${tag}> is not allowed.`);
    }
  }
  return errors;
}

// ─── Preview HTML renderer: replaces placeholders with demo values ─────────
const DEMO_VARS = {
  '{product_name}':        '<strong>4398C Polyester Resin</strong>',
  '{application_name}':    '<strong>Metal Furniture</strong>',
  '{product_description}': 'A premium polyester resin designed for powder coating.',
  '{benefits}': `<li>Excellent leveling properties</li>
<li>High gloss finish</li>
<li>Strong mechanical properties</li>`,
  '{applications}': `<li>Metal furniture and fixtures</li>
<li>General industrial powder coatings</li>`,
  '{curing_condition}': '180 °C for 15–20 minutes.',
  '{industries}': `<li>Furniture Manufacturing</li>
<li>General Industry</li>`,
};

function renderPreviewLocally(html) {
  return html.replace(/\{[\w_]+\}/g, (match) => DEMO_VARS[match] || `<mark>${match}</mark>`);
}

// ─── Version History Item ──────────────────────────────────────
const RevisionItem = ({ revision, index, onRestore }) => {
  const [expanded, setExpanded] = useState(false);
  const d = new Date(revision.createdAt);
  const dateStr = d.toLocaleString();

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="font-medium text-gray-700">
          Version from {dateStr}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {revision.note || 'No note'}
          </span>
          {expanded ? <FiChevronUp className="w-4 h-4 text-gray-400" /> : <FiChevronDown className="w-4 h-4 text-gray-400" />}
        </span>
      </button>
      {expanded && (
        <div className="p-4 space-y-3 bg-white">
          <pre className="text-xs text-gray-600 bg-gray-50 rounded p-3 overflow-auto max-h-48 whitespace-pre-wrap font-mono">
            {revision.htmlContent}
          </pre>
          <button
            type="button"
            onClick={() => onRestore(index)}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <FiRotateCcw className="w-3.5 h-3.5" />
            Restore this version
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────
export default function AdminTemplateEditor() {
  const textareaRef = useRef(null);

  const [template, setTemplate] = useState(null);
  const [html, setHtml]         = useState(DEFAULT_HTML);
  const [note, setNote]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview' | 'history'
  const [validationErrors, setValidationErrors] = useState([]);
  const [showValidation, setShowValidation] = useState(false);

  // Preview with real data
  const [products, setProducts]     = useState([]);
  const [applications, setApplications] = useState([]);
  const [previewProductId, setPreviewProductId] = useState('');
  const [previewAppId, setPreviewAppId]     = useState('');
  const [previewHtml, setPreviewHtml]       = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  // ── Load template on mount ──────────────────────────────────
  useEffect(() => {
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    setLoading(true);
    try {
      const res = await adminService.getTemplateByType(TEMPLATE_TYPE);
      if (res.template) {
        setTemplate(res.template);
        setHtml(res.template.htmlContent);
      }
    } catch (err) {
      if (err?.response?.status !== 404) {
        toast.error('Failed to load template');
      }
      // 404 = not created yet, that's OK — use default
    } finally {
      setLoading(false);
    }
  };

  // ── Load products + applications for preview dropdown ───────
  useEffect(() => {
    adminService.getProducts({ limit: 50, page: 1 })
      .then((r) => setProducts(r.products || []))
      .catch(() => {});
    adminService.getApplications({ limit: 50 })
      .then((r) => setApplications(r.applications || []))
      .catch(() => {});
  }, []);

  // ── Validate on HTML change ──────────────────────────────────
  useEffect(() => {
    setValidationErrors(validateHtml(html));
  }, [html]);

  // ── Insert placeholder at cursor ─────────────────────────────
  const insertPlaceholder = useCallback((key) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const newVal = html.substring(0, start) + key + html.substring(end);
    setHtml(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + key.length, start + key.length);
    }, 0);
  }, [html]);

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (validationErrors.length > 0) {
      setShowValidation(true);
      toast.error('Fix HTML validation errors before saving');
      return;
    }
    setSaving(true);
    try {
      let res;
      if (template?._id) {
        res = await adminService.updateTemplate(template._id, { htmlContent: html, note });
      } else {
        res = await adminService.createTemplate({
          templateName: TEMPLATE_NAME,
          templateType: TEMPLATE_TYPE,
          htmlContent: html,
        });
      }
      setTemplate(res.template);
      setHtml(res.template.htmlContent);
      setNote('');
      toast.success('Template saved successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Restore a revision ────────────────────────────────────────
  const handleRestore = async (revisionIndex) => {
    if (!template?._id) return;
    if (!window.confirm('Restore this version? Current content will be saved to history.')) return;
    setSaving(true);
    try {
      const res = await adminService.restoreTemplateRevision(template._id, revisionIndex);
      setTemplate(res.template);
      setHtml(res.template.htmlContent);
      toast.success('Version restored');
    } catch (err) {
      toast.error('Restore failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Live preview (backend) ────────────────────────────────────
  const handleLivePreview = async () => {
    if (!previewProductId && !previewAppId) {
      setPreviewHtml(renderPreviewLocally(html));
      return;
    }
    setLoadingPreview(true);
    try {
      const params = {};
      if (previewProductId) params.productId = previewProductId;
      if (previewAppId)     params.applicationId = previewAppId;
      const res = await adminService.renderTemplatePreview(TEMPLATE_TYPE, params);
      setPreviewHtml(res.html);
    } catch {
      // Fallback to local demo preview
      setPreviewHtml(renderPreviewLocally(html));
    } finally {
      setLoadingPreview(false);
    }
  };

  // Auto-update local preview when tab switches to preview
  useEffect(() => {
    if (activeTab === 'preview') {
      setPreviewHtml(renderPreviewLocally(html));
    }
  }, [activeTab, html]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const isNew = !template?._id;
  const revisions = template?.revisions || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>Content Templates</span>
            <span>/</span>
            <span className="text-gray-800 font-medium">Application Description</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MdAutoAwesome className="text-indigo-500" />
            Application Description Template
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            This template auto-generates content for all{' '}
            <code className="bg-gray-100 px-1 rounded text-xs">/products/&#123;slug&#125;/application/&#123;appSlug&#125;</code>{' '}
            pages. Supports {PLACEHOLDERS.length} dynamic placeholders.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {isNew && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
              <FiInfo className="w-3 h-3" /> Not yet saved
            </span>
          )}
          {validationErrors.length > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
              <FiAlertTriangle className="w-3 h-3" />
              {validationErrors.length} HTML error{validationErrors.length > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
              <FiCheckCircle className="w-3 h-3" /> Valid HTML
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-none text-sm font-medium transition-colors"
          >
            {saving ? <Spinner size="sm" /> : <FiSave className="w-4 h-4" />}
            {isNew ? 'Create Template' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ── Validation errors banner ─────────────────────────────── */}
      {showValidation && validationErrors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex gap-3">
          <FiAlertTriangle className="text-red-500 w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-700 text-sm mb-1">HTML Structure Errors</p>
            <ul className="space-y-0.5">
              {validationErrors.map((e, i) => (
                <li key={i} className="text-red-600 text-xs">• {e}</li>
              ))}
            </ul>
            <p className="text-xs text-red-500 mt-2">
              Allowed tags: {ALLOWED_TAGS.map((t) => `<${t}>`).join(', ')}
            </p>
          </div>
          <button onClick={() => setShowValidation(false)} className="text-red-400 hover:text-red-600">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* ── Left panel: Placeholder buttons ───────────────────── */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <FiTag className="w-4 h-4 text-indigo-500" />
              Insert Placeholder
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Click a button to insert at the cursor position in the editor.
            </p>
            <div className="space-y-2">
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => { setActiveTab('editor'); insertPlaceholder(p.key); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-none text-xs font-medium transition-colors hover:opacity-80 ${p.color}`}
                >
                  <span>{p.label}</span>
                  <FiPlus className="w-3.5 h-3.5 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* ── Save note ────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Save Note (optional)</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Added industries section"
              maxLength={200}
              rows={2}
              className="w-full text-xs border border-gray-200 rounded-[48px] px-3 py-2 resize-none focus:ring-2 focus:ring-indigo-300 focus:outline-none"
            />
          </div>

          {/* ── Allowed tags ─────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Allowed HTML Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {ALLOWED_TAGS.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                  &lt;{t}&gt;
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">No inline styles permitted.</p>
          </div>
        </div>

        {/* ── Main panel ────────────────────────────────────────── */}
        <div className="xl:col-span-3 space-y-4">
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-gray-200">
            {[
              { id: 'editor',  icon: FiCode,  label: 'HTML Editor' },
              { id: 'preview', icon: FiEye,   label: 'Preview' },
              { id: 'history', icon: FiClock, label: `History (${revisions.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700',
                ].join(' ')}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Editor tab ─────────────────────────────────────── */}
          {activeTab === 'editor' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                <span className="text-xs text-gray-500 font-mono">template.html</span>
                <span className="text-xs text-gray-400">{html.length} chars</span>
              </div>
              <textarea
                ref={textareaRef}
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                spellCheck={false}
                rows={28}
                className="w-full px-4 py-4 font-mono text-sm text-gray-800 resize-none focus:outline-none leading-relaxed"
                placeholder="Enter HTML template…"
              />
            </div>
          )}

          {/* ── Preview tab ─────────────────────────────────────── */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Product + application selector for live preview */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <FiPackage className="w-4 h-4 text-indigo-500" />
                  Live Preview — Select Data Source
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Product</label>
                    <select
                      value={previewProductId}
                      onChange={(e) => setPreviewProductId(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-[48px] px-3 py-2 focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                    >
                      <option value="">Demo data</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Application</label>
                    <select
                      value={previewAppId}
                      onChange={(e) => setPreviewAppId(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-[48px] px-3 py-2 focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                    >
                      <option value="">Demo data</option>
                      {applications.map((a) => (
                        <option key={a._id} value={a._id}>{a.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleLivePreview}
                      disabled={loadingPreview}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-none text-sm font-medium transition-colors disabled:opacity-60"
                    >
                      {loadingPreview ? <Spinner size="sm" /> : <FiEye className="w-4 h-4" />}
                      Render Preview
                    </button>
                  </div>
                </div>
              </div>

              {/* Rendered output */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs text-gray-500">Rendered Output</span>
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <FiInfo className="w-3 h-3" />
                    {previewProductId || previewAppId ? 'Live data' : 'Demo values'}
                  </span>
                </div>
                <div
                  className="px-8 py-6 prose prose-sm max-w-none min-h-[300px]"
                  /* DOMPurify is handled server-side; this is admin-only preview */
                  dangerouslySetInnerHTML={{ __html: previewHtml || renderPreviewLocally(html) }}
                />
              </div>
            </div>
          )}

          {/* ── History tab ─────────────────────────────────────── */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <FiClock className="w-4 h-4 text-indigo-500" />
                Version History
                <span className="text-xs text-gray-400 font-normal ml-1">
                  ({revisions.length} / 20 stored)
                </span>
              </h3>
              {revisions.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <FiClock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No previous versions yet.</p>
                  <p className="text-xs mt-1">Save the template to start tracking versions.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {revisions.map((rev, idx) => (
                    <RevisionItem
                      key={idx}
                      revision={rev}
                      index={idx}
                      onRestore={handleRestore}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// MukonoTalks

