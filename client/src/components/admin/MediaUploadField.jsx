/**
 * MediaUploadField — Premium CMS Image Upload Component
 * Drag-and-drop, click-to-browse, image preview with hover actions, URL fallback.
 * Uploads to Cloudflare R2 (or local) via adminService.uploadImage.
 *
 * @param {string}   value            Current image URL
 * @param {function} onChange         Called with (url: string) on change
 * @param {string}   folder           R2 storage folder (default: "uploads")
 * @param {string}   label            Field label text
 * @param {string}   hint             Small hint shown beside label
 * @param {boolean}  required
 * @param {string}   recommendedSize  e.g. "1920×1080"
 * @param {string}   className
 *
 * @module components/admin/MediaUploadField
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  CloudUpload,
  ImageIcon,
  Link,
  X,
  Loader2,
  Upload,
  CheckCircle2,
} from 'lucide-react';
import adminService from '../../features/admin/adminService';
import toast from 'react-hot-toast';

const MediaUploadField = ({
  value = '',
  onChange,
  folder = 'uploads',
  label,
  hint,
  required = false,
  recommendedSize,
  className = '',
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [showUrl, setShowUrl]     = useState(false);
  const [urlInput, setUrlInput]   = useState('');
  const inputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, WebP, GIF)');
      return;
    }
    setUploading(true);
    try {
      const result = await adminService.uploadImage(file, folder);
      if (result?.url) {
        onChange(result.url);
        setShowUrl(false);
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      const apiMessage = error?.response?.data?.message;
      const status = error?.response?.status;
      if (apiMessage) {
        toast.error(`Upload failed: ${apiMessage}`);
      } else if (status === 401 || status === 403) {
        toast.error('Upload failed: you are not authorized. Please sign in again.');
      } else if (error?.code === 'ERR_NETWORK') {
        toast.error('Upload failed: cannot reach server. Check API/server status.');
      } else {
        toast.error('Upload failed: unexpected server/storage error.');
      }
    } finally {
      setUploading(false);
    }
  }, [folder, onChange]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  }, [handleFile]);

  const applyUrl = () => {
    const trimmed = urlInput.trim();
    if (trimmed) {
      onChange(trimmed);
      setUrlInput('');
      setShowUrl(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>

      {/* Label */}
      {label && (
        <label className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary">
          <ImageIcon className="h-3.5 w-3.5 shrink-0 text-text-muted" />
          {label}
          {required && <span className="text-accent-red">*</span>}
          {hint && <span className="ml-1 text-xs font-normal text-text-muted">{hint}</span>}
        </label>
      )}

      {value ? (
        /* ── Preview state ── */
        <div className="group relative overflow-hidden rounded-xl border border-dark-border shadow-card">
          <img
            src={value}
            alt="Preview"
            className="h-48 w-full bg-dark-slate object-cover"
            onError={(e) => { e.target.style.opacity = '0.3'; }}
          />

          {/* Hover actions */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-end gap-2 p-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-lg bg-dark-slate px-3 py-1.5 text-xs font-semibold text-text-primary shadow-md transition-colors hover:bg-dark-hover"
            >
              <Upload className="w-3.5 h-3.5" />
              Replace
            </button>
            <button
              type="button"
              onClick={() => setShowUrl(true)}
              className="flex items-center gap-1.5 rounded-lg bg-dark-slate px-3 py-1.5 text-xs font-semibold text-text-primary shadow-md transition-colors hover:bg-dark-hover"
            >
              <Link className="w-3.5 h-3.5" />
              Use URL
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-accent-red px-3 py-1.5 text-xs font-semibold text-text-primary shadow-md transition-colors hover:opacity-90"
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>

          {/* Upload progress overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
              <p className="text-white text-sm font-medium">Uploading…</p>
            </div>
          )}
        </div>
      ) : (
        /* ── Drop zone ── */
        <div
          className={`relative cursor-pointer select-none rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
            dragOver
              ? 'scale-[1.01] border-accent-blue bg-accent-blue/10'
              : 'border-dark-border hover:border-accent-blue hover:bg-dark-slate'
          }`}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-12 w-12 animate-spin text-accent-blue" />
              <p className="text-sm font-semibold text-text-secondary">Uploading to R2…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${
                dragOver ? 'bg-accent-blue/15' : 'bg-dark-slate'
              }`}>
                <CloudUpload className={`h-8 w-8 transition-colors ${
                  dragOver ? 'text-accent-blue' : 'text-text-muted'
                }`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-secondary">
                  Drop an image here or{' '}
                  <span className="cursor-pointer text-accent-blue underline decoration-dashed underline-offset-2">
                    browse
                  </span>
                </p>
                {recommendedSize
                  ? <p className="mt-1 text-xs text-text-muted">{recommendedSize} recommended · PNG, JPG, WebP · max 10 MB</p>
                  : <p className="mt-1 text-xs text-text-muted">PNG, JPG, WebP, GIF · max 10 MB</p>
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* URL input toggle */}
      {showUrl ? (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyUrl()}
            placeholder="https://…"
            autoFocus
            className="flex-1 rounded-[48px] border border-dark-border bg-dark-charcoal px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue"
          />
          <button
            type="button"
            onClick={applyUrl}
            className="rounded-[48px] bg-accent-blue px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-category-news"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => { setShowUrl(false); setUrlInput(''); }}
            className="rounded-[48px] border border-dark-border px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-dark-hover hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : !value && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowUrl(true); }}
          className="flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-accent-blue"
        >
          <Link className="w-3 h-3" />
          Or paste an image URL
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={uploading}
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
      />
    </div>
  );
};

export default MediaUploadField;

// MukonoTalks

