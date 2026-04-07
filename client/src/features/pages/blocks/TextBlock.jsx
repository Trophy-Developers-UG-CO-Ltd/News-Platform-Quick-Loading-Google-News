/**
 * Text Block
 * Rich text section with heading, body paragraphs, and optional highlight
 * No dangerouslySetInnerHTML — structured content only
 * @module features/pages/blocks/TextBlock
 */

import React from 'react';

const TextBlock = ({ data }) => {
  if (!data) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {data.heading && (
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
            {data.heading}
          </h2>
        )}
        {data.body && (
          <div className="prose prose-lg text-gray-600 max-w-none space-y-4">
            {Array.isArray(data.body)
              ? data.body.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))
              : <p>{data.body}</p>
            }
          </div>
        )}
        {data.highlight && (
          <div className="mt-6 p-6 bg-primary-50 border-l-4 border-primary-500 rounded-r-lg">
            <p className="text-primary-800 font-medium">{data.highlight}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default TextBlock;

// MukonoTalks

