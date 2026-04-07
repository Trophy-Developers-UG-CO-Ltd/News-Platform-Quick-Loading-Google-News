/**
 * Article Video Block
 * YouTube/Vimeo embed or direct video with caption
 * @module features/articles/blocks/ArticleVideoBlock
 */

import React from 'react';

/**
 * Convert video URL to embeddable format
 */
const getEmbedUrl = (url) => {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return url;
};

const ArticleVideoBlock = ({ data }) => {
  if (!data || !data.url) return null;

  const embedUrl = getEmbedUrl(data.url);
  const isEmbed = embedUrl !== data.url;

  return (
    <div className="article-video-block">
      {data.title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-3">{data.title}</h3>
      )}
      <div className="relative w-full overflow-hidden rounded-lg shadow-md" style={{ paddingBottom: '56.25%' }}>
        {isEmbed ? (
          <iframe
            src={embedUrl}
            title={data.title || 'Video'}
            className="absolute top-0 left-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={data.url}
            controls
            className="absolute top-0 left-0 w-full h-full object-cover"
            poster={data.poster || undefined}
          >
            Your browser does not support video playback.
          </video>
        )}
      </div>
      {data.caption && (
        <p className="mt-2 text-sm text-gray-500 text-center">{data.caption}</p>
      )}
    </div>
  );
};

export default ArticleVideoBlock;

// MukonoTalks

