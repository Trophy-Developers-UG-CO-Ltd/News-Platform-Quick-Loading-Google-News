/**
 * Article Text Block
 * Renders heading + body paragraphs for articles
 * @module features/articles/blocks/ArticleTextBlock
 */

import React from 'react';

const ArticleTextBlock = ({ data }) => {
  if (!data) return null;

  return (
    <div className="article-text-block">
      {data.heading && (
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{data.heading}</h2>
      )}
      {data.subheading && (
        <h3 className="text-lg font-semibold text-gray-600 mb-3">{data.subheading}</h3>
      )}
      {data.body && (
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-4">
          {Array.isArray(data.body) ? (
            data.body.map((paragraph, i) => <p key={i}>{paragraph}</p>)
          ) : (
            <p>{data.body}</p>
          )}
        </div>
      )}
      {data.highlight && (
        <div className="mt-4 p-4 bg-blue-50 border-l-4 border-primary-500 text-primary-800 rounded-r-lg">
          {data.highlight}
        </div>
      )}
    </div>
  );
};

export default ArticleTextBlock;

// MukonoTalks

