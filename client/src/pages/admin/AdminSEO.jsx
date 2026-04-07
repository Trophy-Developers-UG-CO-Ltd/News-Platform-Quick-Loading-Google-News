/**
 * Admin SEO Schema Manager — Premium Edition
 * Full structured-data editor for all schema.org JSON-LD schemas:
 *   Organization, WebSite, CollectionPage, and custom schemas.
 * Changes here are served at /api/seo and injected into the live site.
 * @module pages/admin/AdminSEO
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  Globe,
  ArrowLeft,
  Code2,
  ShieldCheck,
  Search,
  LayoutList,
  BookOpen,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Info,
  Pencil,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import {
  fetchAllSchemas,
  upsertSchema,
  deleteSchema,
  clearSeoError,
} from '../../features/seo/seoSlice';
import Spinner from '../../components/ui/Spinner';
import useDocTitle from '../../hooks/useDocTitle';

// ─── Schema type icon map ────────────────────────────────────────────────────
const TYPE_ICONS = {
  Organization:   Globe,
  WebSite:        Search,
  CollectionPage: LayoutList,
  FAQPage:        BookOpen,
  Product:        ShieldCheck,
  Article:        BookOpen,
  BlogPosting:    BookOpen,
};

const getSchemaIcon = (schemaData) => {
  const type = schemaData?.['@type'] || '';
  return TYPE_ICONS[type] || Code2;
};

const SCHEMA_BADGES = {
  Organization:   { label: 'Organization',    color: 'bg-blue-100 text-blue-700' },
  WebSite:        { label: 'WebSite',          color: 'bg-violet-100 text-violet-700' },
  CollectionPage: { label: 'CollectionPage',   color: 'bg-emerald-100 text-emerald-700' },
  FAQPage:        { label: 'FAQPage',          color: 'bg-amber-100 text-amber-700' },
  Product:        { label: 'Product',          color: 'bg-rose-100 text-rose-700' },
  DefinedTerm:    { label: 'DefinedTerm',      color: 'bg-orange-100 text-orange-700' },
};

const getBadge = (schemaData) => {
  const type = schemaData?.['@type'] || 'Custom';
  return SCHEMA_BADGES[type] || { label: type || 'Custom', color: 'bg-gray-100 text-gray-600' };
};

// ─── Validation helper ───────────────────────────────────────────────────────
const validateJsonLd = (str) => {
  try {
    const obj = JSON.parse(str);
    if (typeof obj !== 'object' || Array.isArray(obj)) return { ok: false, msg: 'Must be a JSON object { … }' };
    if (!obj['@context']) return { ok: false, msg: 'Missing required "@context": "https://schema.org"' };
    if (!obj['@type'])    return { ok: false, msg: 'Missing required "@type" field' };
    return { ok: true, msg: 'Valid JSON-LD ✓' };
  } catch (e) {
    return { ok: false, msg: `JSON parse error: ${e.message}` };
  }
};

// ─── Schema card (collapsed view) ────────────────────────────────────────────
const SchemaCard = ({ schema, onEdit, onToggle, onDelete }) => {
  const Icon  = getSchemaIcon(schema.schemaData);
  const badge = getBadge(schema.schemaData);

  return (
    <div className={`bg-white border rounded-2xl shadow-sm transition-all ${schema.isActive ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-60'}`}>
      <div className="flex items-center gap-4 px-5 py-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${schema.isActive ? 'bg-primary-50' : 'bg-gray-100'}`}>
          <Icon className={`h-5 w-5 ${schema.isActive ? 'text-primary-600' : 'text-gray-400'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-800 text-sm truncate">{schema.label || schema.schemaKey}</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
            {schema.isGlobal && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                Global
              </span>
            )}
            {!schema.isActive && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                Disabled
              </span>
            )}
          </div>
          {schema.description && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{schema.description}</p>
          )}
          <p className="text-xs text-gray-300 mt-0.5 font-mono">key: {schema.schemaKey}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onToggle(schema)}
            title={schema.isActive ? 'Disable' : 'Enable'}
            className={`p-2 rounded-none transition-colors ${schema.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            {schema.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button
            onClick={() => onEdit(schema)}
            className="p-2 rounded-none text-primary-600 hover:bg-primary-50 transition-colors"
            title="Edit schema"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(schema)}
            className="p-2 rounded-none text-red-400 hover:bg-red-50 transition-colors"
            title="Delete schema"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Schema editor modal ──────────────────────────────────────────────────────
const SchemaEditor = ({ schema, onSave, onClose, isSaving }) => {
  const isNew = !schema.schemaKey || schema._new;
  const [form, setForm] = useState({
    schemaKey:   schema.schemaKey  || '',
    label:       schema.label      || '',
    description: schema.description|| '',
    isGlobal:    schema.isGlobal   ?? false,
    isActive:    schema.isActive   ?? true,
    jsonStr:     schema.schemaData ? JSON.stringify(schema.schemaData, null, 2) : '{\n  "@context": "https://schema.org",\n  "@type": "Organization"\n}',
  });

  const validation = validateJsonLd(form.jsonStr);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = () => {
    if (!form.schemaKey.trim()) { toast.error('Schema key is required'); return; }
    if (!validation.ok) { toast.error(validation.msg); return; }
    let parsed;
    try { parsed = JSON.parse(form.jsonStr); } catch { return; }
    onSave({
      schemaKey:   form.schemaKey.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      label:       form.label,
      description: form.description,
      isGlobal:    form.isGlobal,
      isActive:    form.isActive,
      schemaData:  parsed,
    });
  };

  // ── Pretty-print JSON ─────────────────────────────────────────────────────
  const prettyPrint = () => {
    try {
      const obj = JSON.parse(form.jsonStr);
      setForm((f) => ({ ...f, jsonStr: JSON.stringify(obj, null, 2) }));
    } catch { toast.error('Cannot pretty-print invalid JSON'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 pt-16">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
            <Code2 className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">{isNew ? 'New Schema' : `Edit: ${schema.label || schema.schemaKey}`}</h2>
            <p className="text-xs text-gray-400">Changes are live immediately after saving</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 hover:bg-gray-100 rounded-none text-gray-400 hover:text-gray-600 transition-colors">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Meta fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schema Key <span className="text-red-500">*</span>
                <span className="ml-1 text-xs text-gray-400 font-normal">(lowercase, hyphens only)</span>
              </label>
              <input
                name="schemaKey"
                value={form.schemaKey}
                onChange={handle}
                disabled={!isNew}
                className="input-field text-sm font-mono disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="organization"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
              <input
                name="label"
                value={form.label}
                onChange={handle}
                className="input-field text-sm"
                placeholder="Organization"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-xs text-gray-400">(shown in this UI only)</span></label>
            <input
              name="description"
              value={form.description}
              onChange={handle}
              className="input-field text-sm"
              placeholder="Describe when and where this schema is injected…"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" name="isGlobal" checked={form.isGlobal} onChange={handle} className="rounded border-gray-300 text-primary-600" />
              <span className="font-medium text-gray-700">Global</span>
              <span className="text-xs text-gray-400">(inject on every page)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handle} className="rounded border-gray-300 text-primary-600" />
              <span className="font-medium text-gray-700">Active</span>
              <span className="text-xs text-gray-400">(inject on site)</span>
            </label>
          </div>

          {/* JSON-LD editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                JSON-LD Schema <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={prettyPrint}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" /> Format JSON
              </button>
            </div>
            <textarea
              name="jsonStr"
              value={form.jsonStr}
              onChange={handle}
              rows={16}
              className="input-field font-mono text-xs leading-relaxed"
              spellCheck={false}
            />
            {/* Validation feedback */}
            <div className={`mt-1.5 flex items-center gap-1.5 text-xs ${validation.ok ? 'text-green-600' : 'text-red-500'}`}>
              {validation.ok
                ? <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                : <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />}
              {validation.msg}
            </div>
          </div>

          {/* Rich Results Test hint */}
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-0.5">Validate with Google's Rich Results Test</p>
              <a
                href="https://search.google.com/test/rich-results"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline hover:text-blue-900"
              >
                search.google.com/test/rich-results <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="btn-secondary px-5">Cancel</button>
          <button
            onClick={handleSave}
            disabled={isSaving || !validation.ok}
            className="btn-primary flex items-center gap-2 px-6 disabled:opacity-60"
          >
            {isSaving ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
            {isNew ? 'Create Schema' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main AdminSEO component ──────────────────────────────────────────────────
const AdminSEO = () => {
  useDocTitle('SEO Schemas — MukonoTalks Admin');
  const dispatch = useDispatch();
  const { schemas, isLoading, isSaving } = useSelector((s) => s.seo);

  const [editTarget, setEditTarget]   = useState(null);  // schema obj or { _new: true }
  const [showEditor, setShowEditor]   = useState(false);
  const [filter, setFilter]           = useState('all'); // 'all' | 'global' | 'inactive'

  useEffect(() => { dispatch(fetchAllSchemas()); }, [dispatch]);

  const openNew = () => {
    setEditTarget({ _new: true, isActive: true, isGlobal: false });
    setShowEditor(true);
  };

  const openEdit = (schema) => {
    setEditTarget(schema);
    setShowEditor(true);
  };

  const closeEditor = () => { setShowEditor(false); setEditTarget(null); };

  const handleSave = async (payload) => {
    const result = await dispatch(upsertSchema({ key: payload.schemaKey, payload }));
    if (upsertSchema.fulfilled.match(result)) {
      toast.success('Schema saved successfully');
      closeEditor();
    } else {
      toast.error(result.payload || 'Save failed');
    }
  };

  const handleToggle = async (schema) => {
    const result = await dispatch(upsertSchema({
      key: schema.schemaKey,
      payload: { ...schema, schemaData: schema.schemaData, isActive: !schema.isActive },
    }));
    if (upsertSchema.fulfilled.match(result)) {
      toast.success(schema.isActive ? 'Schema disabled' : 'Schema enabled');
    }
  };

  const handleDelete = async (schema) => {
    if (!window.confirm(`Delete schema "${schema.label || schema.schemaKey}"?\n\nDefault schemas cannot be deleted.`)) return;
    const result = await dispatch(deleteSchema(schema.schemaKey));
    if (deleteSchema.fulfilled.match(result)) toast.success('Schema deleted');
    else toast.error(result.payload || 'Could not delete');
  };

  const filtered = schemas.filter((s) => {
    if (filter === 'global')   return s.isGlobal;
    if (filter === 'inactive') return !s.isActive;
    return true;
  });

  const activeCount   = schemas.filter((s) => s.isActive).length;
  const globalCount   = schemas.filter((s) => s.isGlobal).length;
  const inactiveCount = schemas.filter((s) => !s.isActive).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary-600" />
              SEO Schemas
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage all structured-data JSON-LD schemas injected into the website.
              Changes are served to Google and other crawlers immediately.
            </p>
          </div>
          <button
            onClick={openNew}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" /> New Schema
          </button>
        </div>

        {/* Stats bar */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: 'Total Schemas',   value: schemas.length, icon: Code2,        color: 'text-gray-600 bg-gray-50' },
            { label: 'Active & Live',   value: activeCount,    icon: CheckCircle,  color: 'text-green-600 bg-green-50' },
            { label: 'Global (all pages)', value: globalCount, icon: Globe,        color: 'text-indigo-600 bg-indigo-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`rounded-xl p-4 flex items-center gap-3 ${color}`}>
              <Icon className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="text-2xl font-bold leading-none">{value}</p>
                <p className="text-xs font-medium mt-0.5 opacity-70">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Info banner ────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
        <Info className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700">
          <strong>Global schemas</strong> are injected on every page of the website.
          Page-specific schemas (Products, Articles, etc.) are generated automatically from content data.
          After saving, validate with{' '}
          <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer" className="underline font-medium">
            Google's Rich Results Test
          </a>.
        </p>
      </div>

      {/* ── Filter tabs ────────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all',      label: `All (${schemas.length})` },
          { key: 'global',   label: `Global (${globalCount})` },
          { key: 'inactive', label: `Inactive (${inactiveCount})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 text-sm rounded-none font-medium transition-colors ${
              filter === key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => dispatch(fetchAllSchemas())}
          className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-none transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Schema list ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Code2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No schemas found</p>
          <button onClick={openNew} className="mt-4 btn-primary text-sm">
            <Plus className="h-4 w-4 inline mr-1" /> Create your first schema
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((schema) => (
            <SchemaCard
              key={schema.schemaKey}
              schema={schema}
              onEdit={openEdit}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Schema editor modal ─────────────────────────────────────────────── */}
      {showEditor && editTarget && (
        <SchemaEditor
          schema={editTarget}
          onSave={handleSave}
          onClose={closeEditor}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

export default AdminSEO;

// MukonoTalks

