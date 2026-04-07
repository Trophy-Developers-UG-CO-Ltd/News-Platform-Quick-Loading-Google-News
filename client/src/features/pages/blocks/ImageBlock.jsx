/**
 * Image Block
 * Responsive image with caption and optional link
 * @module features/pages/blocks/ImageBlock
 */

import React from 'react';
import { Link } from 'react-router-dom';

const ImageBlock = ({ data }) => {
  if (!data || !data.src) return null;

  const imageElement = (
    <figure className="overflow-hidden rounded-lg shadow-md">
      <img
        src={data.src}
        alt={data.alt || ''}
        className="w-full h-auto object-cover"
        loading="lazy"
      />
      {data.caption && (
        <figcaption className="text-sm text-gray-500 mt-3 text-center px-4 pb-4">
          {data.caption}
        </figcaption>
      )}
    </figure>
  );

  return (
    <section className="py-12 md:py-16">
      <div className={`container mx-auto px-4 ${data.fullWidth ? '' : 'max-w-4xl'}`}>
        {data.link ? (
          <Link to={data.link}>{imageElement}</Link>
        ) : (
          imageElement
        )}
      </div>
    </section>
  );
};

export default ImageBlock;

// MukonoTalks

