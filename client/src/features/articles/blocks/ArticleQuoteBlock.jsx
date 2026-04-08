/**
 * Article Quote Block
 * Styled blockquote with optional attribution
 * @module features/articles/blocks/ArticleQuoteBlock
 */

import React from 'react';

const ArticleQuoteBlock = ({ data }) => {
  if (!data || !data.quote) return null;

  return (
    <blockquote className="article-quote-block border-l-4 border-accent-500 pl-6 py-4 my-6 bg-gray-50 rounded-r-lg">
      <div
        className="prose prose-lg max-w-none text-xl italic text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: data.quote }}
      />
      {data.attribution && (
        <footer className="mt-3 text-sm text-gray-500 font-medium">
          — {data.attribution}
          {data.role && <span className="text-gray-400">, {data.role}</span>}
        </footer>
      )}
    </blockquote>
  );
};

export default ArticleQuoteBlock;

// MukonoTalks

