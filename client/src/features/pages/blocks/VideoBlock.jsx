/**
 * Video Block
 * Embedded video section with heading and description
 * Supports YouTube, Vimeo, and direct video URLs
 * @module features/pages/blocks/VideoBlock
 */

import React from 'react';

/**
 * Convert standard YouTube/Vimeo URLs to embed format
 */
const getEmbedUrl = (url) => {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  // Already embed or direct
  return url;
};

const VideoBlock = ({ data }) => {
  if (!data || !data.url) return null;

  const embedUrl = getEmbedUrl(data.url);

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {data.heading && (
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center">
            {data.heading}
          </h2>
        )}
        {data.description && (
          <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
            {data.description}
          </p>
        )}
        <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg shadow-lg">
          {data.isEmbed !== false ? (
            <iframe
              src={embedUrl}
              title={data.heading || 'Video'}
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
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
              Your browser does not support the video element.
            </video>
          )}
        </div>
      </div>
    </section>
  );
};

export default VideoBlock;

// MukonoTalks

