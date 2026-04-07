/**
 * Article List Block
 * Ordered or unordered list with optional title
 * @module features/articles/blocks/ArticleListBlock
 */

import React from 'react';

const ArticleListBlock = ({ data }) => {
  if (!data || !data.items || data.items.length === 0) return null;

  const isOrdered = data.listType === 'ordered';
  const ListTag = isOrdered ? 'ol' : 'ul';
  const listClass = isOrdered
    ? 'list-decimal list-inside space-y-2'
    : 'list-disc list-inside space-y-2';

  return (
    <div className="article-list-block">
      {data.title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-3">{data.title}</h3>
      )}
      <ListTag className={`${listClass} text-gray-700 leading-relaxed`}>
        {data.items.map((item, i) => (
          <li key={i} className="pl-1">{item}</li>
        ))}
      </ListTag>
    </div>
  );
};

export default ArticleListBlock;

// MukonoTalks

