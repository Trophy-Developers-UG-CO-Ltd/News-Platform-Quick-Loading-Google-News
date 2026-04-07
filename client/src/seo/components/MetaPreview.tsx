/**
 * MetaPreview
 * Renders a live SERP (Google) and social media preview of SEO metadata.
 * Used inside the admin SEO Metadata Manager.
 *
 * @module components/seo/MetaPreview
 */

import React from 'react';

interface MetaPreviewProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  mode?: 'serp' | 'og' | 'twitter';
  siteName?: string;
}

// ─── SERP Preview ─────────────────────────────────────────────
const SerpPreview: React.FC<{ title: string; description: string; url: string }> = ({
  title, description, url,
}) => {
  const displayUrl = url.replace(/^https?:\/\//, '');

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white max-w-xl font-sans">
      <p className="text-xs text-green-700 truncate">{displayUrl}</p>
      <h3 className="text-blue-700 text-lg font-medium leading-snug mt-1 truncate hover:underline cursor-pointer">
        {title || 'No title set'}
      </h3>
      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
        {description || 'No meta description set.'}
      </p>
      <div className="flex items-center gap-1 mt-1">
        {title.length > 0 && (
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            title.length < 30 ? 'bg-red-100 text-red-700' :
            title.length > 60 ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>
            Title: {title.length}/60
          </span>
        )}
        {description.length > 0 && (
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            description.length < 120 ? 'bg-red-100 text-red-700' :
            description.length > 160 ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>
            Desc: {description.length}/160
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Open Graph Preview ───────────────────────────────────────
const OgPreview: React.FC<{ title: string; description: string; image?: string; siteName?: string }> = ({
  title, description, image, siteName,
}) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden max-w-sm font-sans bg-white">
    {image && (
      <img src={image} alt="OG Preview" className="w-full h-40 object-cover" />
    )}
    {!image && (
      <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
        No OG image
      </div>
    )}
    <div className="p-3">
      {siteName && <p className="text-xs text-gray-400 uppercase tracking-wide">{siteName}</p>}
      <p className="font-semibold text-sm text-gray-900 mt-1 line-clamp-2">{title || 'No OG title'}</p>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{description || 'No OG description'}</p>
    </div>
  </div>
);

// ─── Twitter Preview ──────────────────────────────────────────
const TwitterPreview: React.FC<{ title: string; description: string; image?: string; url: string }> = ({
  title, description, image, url,
}) => (
  <div className="border border-gray-200 rounded-2xl overflow-hidden max-w-sm font-sans bg-white">
    {image && (
      <img src={image} alt="Twitter Preview" className="w-full h-48 object-cover" />
    )}
    {!image && (
      <div className="w-full h-32 bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
        No Twitter image
      </div>
    )}
    <div className="p-3">
      <p className="font-bold text-sm text-gray-900 line-clamp-1">{title || 'No Twitter title'}</p>
      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{description || 'No description'}</p>
      <p className="text-xs text-gray-400 mt-1 truncate">{url}</p>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────
const MetaPreview: React.FC<MetaPreviewProps> = ({
  title = '',
  description = '',
  url = '',
  image,
  siteName = 'MukonoTalks',
  mode = 'serp',
}) => {
  return (
    <div className="space-y-4">
      {mode === 'serp' && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Google SERP Preview</p>
          <SerpPreview title={title} description={description} url={url} />
        </div>
      )}
      {mode === 'og' && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Open Graph / Facebook Preview</p>
          <OgPreview title={title} description={description} image={image} siteName={siteName} />
        </div>
      )}
      {mode === 'twitter' && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Twitter Card Preview</p>
          <TwitterPreview title={title} description={description} image={image} url={url} />
        </div>
      )}
    </div>
  );
};

export default MetaPreview;

// MukonoTalks

