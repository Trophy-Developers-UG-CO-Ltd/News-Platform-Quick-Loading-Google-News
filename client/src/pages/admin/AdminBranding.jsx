/**
 * AdminBranding — White-label / Branding Configuration
 * Accessible to developer role only.
 * Allows customising the platform name, tagline, colors, and logo shown
 * throughout the admin panel.
 * @module pages/admin/AdminBranding
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBranding, saveBranding } from '../../features/branding/brandingSlice';
import { Palette, Save, RefreshCw, Globe, Mail, Type, Image } from 'lucide-react';
import MediaUploadField from '../../components/admin/MediaUploadField';
import SafeImage from '../../components/common/SafeImage';
import toast from 'react-hot-toast';

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
    {children}
  </div>
);

const AdminBranding = () => {
  const dispatch = useDispatch();
  const { settings, isLoading, isSaving, saveError } = useSelector((state) => state.branding);

  const [form, setForm] = useState({
    platformName: '',
    platformTagline: '',
    primaryColor: '#4f46e5',
    logoUrl: '',
    faviconUrl: '',
    supportEmail: '',
  });

  const [dirty, setDirty] = useState(false);

  // Populate form when settings load
  useEffect(() => {
    if (settings) {
      setForm({
        platformName:    settings.platformName    || 'MukonoTalks',
        platformTagline: settings.platformTagline || 'Admin Panel',
        primaryColor:    settings.primaryColor    || '#4f46e5',
        logoUrl:         settings.logoUrl         || '',
        faviconUrl:      settings.faviconUrl      || '',
        supportEmail:    settings.supportEmail    || '',
      });
      setDirty(false);
    }
  }, [settings]);

  useEffect(() => {
    dispatch(fetchBranding());
  }, [dispatch]);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setDirty(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(saveBranding(form));
    if (saveBranding.fulfilled.match(result)) {
      toast.success('Branding settings saved');
      setDirty(false);
    } else {
      toast.error(result.payload || 'Failed to save branding');
    }
  };

  const handleReset = () => {
    dispatch(fetchBranding());
    setDirty(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <Palette className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branding & White Label</h1>
          <p className="text-sm text-gray-500">Customise the platform name and appearance in the admin panel.</p>
        </div>
      </div>

      {/* Live preview */}
      <div className="bg-slate-900 rounded-xl p-4 mb-8 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: form.primaryColor }}
        >
          {form.logoUrl ? (
            <SafeImage src={form.logoUrl} alt="logo" className="w-6 h-6 object-contain" />
          ) : (
            <span className="text-white font-bold text-sm">{(form.platformName || 'T')[0].toUpperCase()}</span>
          )}
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">{form.platformName || 'MukonoTalks'}</p>
          <p className="text-slate-400 text-xs">{form.platformTagline || 'Admin Panel'}</p>
        </div>
        <span className="ml-auto text-slate-500 text-xs italic">Sidebar preview</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Type className="w-4 h-4" /> Identity
          </h2>

          <Field label="Platform Name" hint="Shown in the admin sidebar and browser tab.">
            <input
              type="text"
              value={form.platformName}
              onChange={handleChange('platformName')}
              maxLength={100}
              required
              className="input-field w-full"
              placeholder="MukonoTalks"
            />
          </Field>

          <Field label="Tagline" hint="Displayed below the platform name in the sidebar.">
            <input
              type="text"
              value={form.platformTagline}
              onChange={handleChange('platformTagline')}
              maxLength={100}
              className="input-field w-full"
              placeholder="Admin Panel"
            />
          </Field>
        </div>

        {/* Appearance */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Palette className="w-4 h-4" /> Appearance
          </h2>

          <Field label="Primary Accent Color" hint="Used for the logo background and active nav items.">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primaryColor}
                onChange={handleChange('primaryColor')}
                className="h-9 w-14 rounded-[48px] border border-gray-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={form.primaryColor}
                onChange={handleChange('primaryColor')}
                pattern="^#[0-9A-Fa-f]{3,6}$"
                className="input-field w-32"
                placeholder="#4f46e5"
              />
            </div>
          </Field>

          <Field label="Logo" hint="Optional. Shown in the admin panel header instead of the initial letter.">
            <MediaUploadField
              folder="branding"
              value={form.logoUrl}
              onChange={(url) => handleChange('logoUrl')({ target: { value: url } })}
              recommendedSize="200×60 or square"
            />
          </Field>

          <Field label="Favicon" hint="Optional. PNG shown in the browser tab (32×32 or 64×64 recommended).">
            <MediaUploadField
              folder="branding"
              value={form.faviconUrl}
              onChange={(url) => handleChange('faviconUrl')({ target: { value: url } })}
              recommendedSize="64×64 PNG"
            />
          </Field>
        </div>

        {/* Contact */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Mail className="w-4 h-4" /> Support
          </h2>

          <Field label="Support Email" hint="Shown in the admin panel footer for platform support.">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="email"
                value={form.supportEmail}
                onChange={handleChange('supportEmail')}
                className="input-field flex-1"
                placeholder="support@mukonotalks.ug"
              />
            </div>
          </Field>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving || !dirty}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving…' : 'Save Branding'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!dirty}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Discard Changes
          </button>
        </div>

        {saveError && (
          <p className="text-sm text-red-500">{saveError}</p>
        )}
      </form>
    </div>
  );
};

export default AdminBranding;

// MukonoTalks
