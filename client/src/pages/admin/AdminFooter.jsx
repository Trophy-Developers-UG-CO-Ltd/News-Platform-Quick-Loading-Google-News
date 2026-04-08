/**
 * Admin Footer Editor
 * Edit tagline, quick links, service links, contact info, and copyright name.
 * @module pages/admin/AdminFooter
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Save, RotateCcw, Plus, Trash2, ArrowLeft,
  Mail, Phone, MapPin, Link2, AlignLeft, Copyright,
  ExternalLink, GripVertical,
} from 'lucide-react';
import { fetchFooter, saveFooter } from '../../features/footer/footerSlice';
import useDocTitle from '../../hooks/useDocTitle';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

/* ── helpers ──────────────────────────────────────────────────── */
const emptyLink = () => ({ label: '', href: '', openInNewTab: false });

const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ── Link List Editor ─────────────────────────────────────────── */
const LinkListEditor = ({ links, onChange }) => {
  const update = (idx, field, value) =>
    onChange(links.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));

  const add    = () => onChange([...links, emptyLink()]);
  const remove = (idx) => onChange(links.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      {links.map((link, idx) => (
        <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
          <input
            className="input flex-1 min-w-0"
            placeholder="Label"
            value={link.label}
            onChange={(e) => update(idx, 'label', e.target.value)}
          />
          <input
            className="input flex-1 min-w-0"
            placeholder="/path or https://…"
            value={link.href}
            onChange={(e) => update(idx, 'href', e.target.value)}
          />
          <label className="flex items-center gap-1 text-xs text-gray-500 shrink-0 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={link.openInNewTab || false}
              onChange={(e) => update(idx, 'openInNewTab', e.target.checked)}
              className="rounded"
            />
            <ExternalLink className="w-3.5 h-3.5" />
          </label>
          <button
            type="button"
            onClick={() => remove(idx)}
            className="text-red-400 hover:text-red-600 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium mt-1"
      >
        <Plus className="w-4 h-4" /> Add link
      </button>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════ */
const AdminFooter = () => {
  useDocTitle('Footer Settings | Admin');
  const dispatch = useDispatch();
  const { settings, isLoading, isSaving } = useSelector((s) => s.footer);

  const [form, setForm] = useState(null);
  const dirty = form && !deepEqual(form, settings);

  /* Load */
  useEffect(() => {
    dispatch(fetchFooter());
  }, [dispatch]);

  /* Sync form when settings arrive */
  useEffect(() => {
    if (settings) setForm(JSON.parse(JSON.stringify(settings)));
  }, [settings]);

  const patch = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    const result = await dispatch(saveFooter(form));
    if (saveFooter.fulfilled.match(result)) {
      toast.success('Footer saved!');
    } else {
      toast.error(result.payload || 'Failed to save footer');
    }
  };

  const handleReset = () => setForm(JSON.parse(JSON.stringify(settings)));

  if (isLoading || !form) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Footer Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Edit tagline, links, contact info and copyright</p>
        </div>
        {dirty && (
          <span className="ml-auto text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
            Unsaved changes
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">

        {/* ── Tagline ───────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-base">
            <AlignLeft className="w-4 h-4 text-gray-400" /> Tagline
          </h2>
          <textarea
            className="input w-full resize-none"
            rows={3}
            value={form.tagline || ''}
            onChange={(e) => patch('tagline', e.target.value)}
            placeholder="Short brand description shown under the logo…"
          />
        </section>

        {/* ── Quick Links ───────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-base">
            <Link2 className="w-4 h-4 text-gray-400" /> Quick Links
          </h2>
          <p className="text-xs text-gray-500">Shown in the first link column. Use internal paths (e.g. <code>/products</code>) or full URLs.</p>
          <LinkListEditor
            links={form.quickLinks || []}
            onChange={(v) => patch('quickLinks', v)}
          />
        </section>

        {/* ── Service Links ─────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-base">
            <Link2 className="w-4 h-4 text-gray-400" /> Customer Service Links
          </h2>
          <p className="text-xs text-gray-500">Shown in the second link column.</p>
          <LinkListEditor
            links={form.serviceLinks || []}
            onChange={(v) => patch('serviceLinks', v)}
          />
        </section>

        {/* ── Contact Info ──────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-base">
            <Mail className="w-4 h-4 text-gray-400" /> Contact Information
          </h2>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Email
            </label>
            <input
              className="input w-full"
              type="email"
              value={form.contactEmail || ''}
              onChange={(e) => patch('contactEmail', e.target.value)}
              placeholder="info@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Phone
            </label>
            <input
              className="input w-full"
              value={form.contactPhone || ''}
              onChange={(e) => patch('contactPhone', e.target.value)}
              placeholder="+256755303076"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Address / Locations
            </label>
            <input
              className="input w-full"
              value={form.contactAddress || ''}
              onChange={(e) => patch('contactAddress', e.target.value)}
              placeholder="Uganda, Kenya, Tanzania"
            />
          </div>
        </section>

        {/* ── Copyright ─────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-base">
            <Copyright className="w-4 h-4 text-gray-400" /> Copyright Name
          </h2>
          <input
            className="input w-full"
            value={form.copyrightName || ''}
            onChange={(e) => patch('copyrightName', e.target.value)}
            placeholder="MukonoTalks"
          />
          <p className="text-xs text-gray-400">
            Renders as: © {new Date().getFullYear()} <strong>{form.copyrightName || 'MukonoTalks'}</strong>. All rights reserved.
          </p>
        </section>

        {/* ── Actions ───────────────────────────────────── */}
        <div className="flex items-center gap-3 pb-8">
          <button
            type="submit"
            disabled={isSaving || !dirty}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white px-6 py-2.5 rounded-none font-semibold text-sm transition-colors"
          >
            {isSaving ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!dirty}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 disabled:text-gray-300 px-4 py-2.5 rounded-none font-semibold text-sm border border-gray-200 hover:bg-gray-50 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Discard Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminFooter;

// MukonoTalks

