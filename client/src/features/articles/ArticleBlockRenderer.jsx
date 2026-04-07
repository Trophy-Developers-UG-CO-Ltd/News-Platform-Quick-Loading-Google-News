/**
 * Article Block Renderer
 * Maps article content blocks to React components
 * Structured rendering — no dangerouslySetInnerHTML
 * @module features/articles/ArticleBlockRenderer
 */

import React from 'react';
import ArticleTextBlock from './blocks/ArticleTextBlock';
import ArticleImageBlock from './blocks/ArticleImageBlock';
import ArticleQuoteBlock from './blocks/ArticleQuoteBlock';
import ArticleCodeBlock from './blocks/ArticleCodeBlock';
import ArticleListBlock from './blocks/ArticleListBlock';
import ArticleVideoBlock from './blocks/ArticleVideoBlock';

const BLOCK_COMPONENTS = {
  text: ArticleTextBlock,
  image: ArticleImageBlock,
  quote: ArticleQuoteBlock,
  code: ArticleCodeBlock,
  list: ArticleListBlock,
  video: ArticleVideoBlock,
};

const ArticleBlockRenderer = ({ blocks }) => {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="article-blocks space-y-8">
      {sortedBlocks.map((block) => {
        const Component = BLOCK_COMPONENTS[block.type];
        if (!Component) return null;
        return <Component key={block._id || block.order} data={block.data} />;
      })}
    </div>
  );
};

export default ArticleBlockRenderer;

// MukonoTalks

