/**
 * CTA Block
 * Call-to-action section with heading, text, and button
 * @module features/pages/blocks/CTABlock
 */

import React from 'react';
import { Link } from 'react-router-dom';

const CTABlock = ({ data }) => {
  if (!data) return null;

  const bgClass = data.variant === 'dark'
    ? 'bg-primary-800 text-white'
    : data.variant === 'accent'
      ? 'bg-accent-500 text-white'
      : 'bg-gray-100 text-gray-800';

  return (
    <section className={`py-16 md:py-20 ${bgClass}`}>
      <div className="container mx-auto px-4 text-center max-w-3xl">
        {data.heading && (
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {data.heading}
          </h2>
        )}
        {data.text && (
          <p className="text-lg mb-8 opacity-90">
            {data.text}
          </p>
        )}
        {data.buttonText && data.buttonLink && (
          <Link
            to={data.buttonLink}
            className={`inline-block px-8 py-3 rounded-lg font-semibold text-lg transition-all ${
              data.variant === 'dark' || data.variant === 'accent'
                ? 'bg-white text-primary-800 hover:bg-gray-100'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {data.buttonText}
          </Link>
        )}
      </div>
    </section>
  );
};

export default CTABlock;

// MukonoTalks

