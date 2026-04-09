import React, { useRef, useState } from 'react';
import { CheckCircle2, Film, Link, Loader2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../../features/admin/adminService';

const VideoUploadField = ({
  value = '',
  onChange,
  folder = 'videos',
  label,
  hint,
  required = false,
  className = '',
}) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showUrl, setShowUrl] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const result = await adminService.uploadVideo(file, folder, setProgress);
      if (result?.url) {
        onChange(result.url);
        setShowUrl(false);
        toast.success('Video uploaded successfully');
      }
    } catch (error) {
      const apiMessage = error?.response?.data?.message;
      toast.error(apiMessage || error.message || 'Video upload failed');
    } finally {
      setUploading(false);
    }
  };

  const applyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    onChange(trimmed);
    setUrlInput('');
    setShowUrl(false);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary">
          <Film className="h-3.5 w-3.5 shrink-0 text-text-muted" />
          {label}
          {required && <span className="text-accent-red">*</span>}
          {hint && <span className="ml-1 text-xs font-normal text-text-muted">{hint}</span>}
        </label>
      )}

      {value ? (
        <div className="space-y-2 rounded-xl border border-dark-border bg-dark-slate p-4">
          <video
            src={value}
            controls
            className="h-48 w-full rounded-lg bg-black object-cover"
          >
            Your browser does not support video playback.
          </video>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-lg bg-dark-charcoal px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-dark-hover"
            >
              Replace Video
            </button>
            <button
              type="button"
              onClick={() => setShowUrl(true)}
              className="rounded-lg bg-dark-charcoal px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-dark-hover"
            >
              Use URL
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="rounded-lg bg-accent-red px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:opacity-90"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className="cursor-pointer rounded-xl border-2 border-dashed border-dark-border p-6 text-center transition-colors hover:border-accent-blue hover:bg-dark-slate"
          onClick={() => !uploading && inputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
              <p className="text-sm font-medium text-text-secondary">
                Uploading video{progress > 0 ? `... ${progress}%` : '...'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Film className="h-8 w-8 text-text-muted" />
              <p className="text-sm font-semibold text-text-secondary">
                Click to upload a direct video file
              </p>
              <p className="text-xs text-text-muted">
                MP4, WebM, MOV supported
              </p>
            </div>
          )}
        </div>
      )}

      {showUrl ? (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyUrl()}
            placeholder="https://..."
            className="flex-1 rounded-[48px] border border-dark-border bg-dark-charcoal px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue"
          />
          <button
            type="button"
            onClick={applyUrl}
            className="rounded-[48px] bg-accent-blue px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-category-news"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setShowUrl(false);
              setUrlInput('');
            }}
            className="rounded-[48px] border border-dark-border px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-dark-hover hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowUrl(true)}
          className="flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-accent-blue"
        >
          <Link className="h-3 w-3" />
          Or paste a hosted video URL
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default VideoUploadField;
