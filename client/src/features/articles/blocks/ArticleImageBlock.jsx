/**
 * Article Image Block
 * Responsive image with caption and optional credit
 * @module features/articles/blocks/ArticleImageBlock
 */

import React from 'react';

const ArticleImageBlock = ({ data }) => {
  if (!data || !data.src) return null;

  return (
    <figure className={`article-image-block ${data.fullWidth ? 'w-full' : 'max-w-3xl mx-auto'}`}>
      <img
        src={data.src}
        alt={data.alt || ''}
        className="w-full rounded-lg shadow-md object-cover"
        loading="lazy"
      />
      {(data.caption || data.credit) && (
        <figcaption className="mt-2 text-sm text-gray-500 text-center">
          {data.caption && <span>{data.caption}</span>}
          {data.credit && (
            <span className="italic ml-1">— {data.credit}</span>
          )}
        </figcaption>
      )}
    </figure>
  );
};

export default ArticleImageBlock;

// MukonoTalks

