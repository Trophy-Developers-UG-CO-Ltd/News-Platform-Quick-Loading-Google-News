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
        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <ImageIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          {label}
          {required && <span className="text-red-500">*</span>}
          {hint && <span className="ml-1 font-normal text-xs text-gray-400">{hint}</span>}
        </label>
      )}

      {value ? (
        /* ── Preview state ── */
        <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
          <img
            src={value}
            alt="Preview"
            className="w-full h-48 object-cover bg-gray-100"
            onError={(e) => { e.target.style.opacity = '0.3'; }}
          />

          {/* Hover actions */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-end gap-2 p-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-800 rounded-lg text-xs font-semibold shadow-md hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Replace
            </button>
            <button
              type="button"
              onClick={() => setShowUrl(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-800 rounded-lg text-xs font-semibold shadow-md hover:bg-gray-50 transition-colors"
            >
              <Link className="w-3.5 h-3.5" />
              Use URL
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold shadow-md hover:bg-red-600 transition-colors ml-auto"
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
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer select-none transition-all duration-200 ${
            dragOver
              ? 'border-primary-400 bg-primary-50 scale-[1.01]'
              : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/40'
          }`}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
              <p className="text-sm font-semibold text-gray-600">Uploading to R2…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                dragOver ? 'bg-primary-100' : 'bg-gray-100'
              }`}>
                <CloudUpload className={`w-8 h-8 transition-colors ${
                  dragOver ? 'text-primary-500' : 'text-gray-400'
                }`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Drop an image here or{' '}
                  <span className="text-primary-600 underline underline-offset-2 decoration-dashed cursor-pointer">
                    browse
                  </span>
                </p>
                {recommendedSize
                  ? <p className="text-xs text-gray-400 mt-1">{recommendedSize} recommended · PNG, JPG, WebP · max 10 MB</p>
                  : <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP, GIF · max 10 MB</p>
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
            className="flex-1 px-3 py-2 border border-gray-300 rounded-[48px] text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
          <button
            type="button"
            onClick={applyUrl}
            className="px-4 py-2 bg-primary-600 text-white rounded-[48px] text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => { setShowUrl(false); setUrlInput(''); }}
            className="px-3 py-2 border border-gray-200 rounded-[48px] text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : !value && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowUrl(true); }}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary-600 transition-colors"
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

