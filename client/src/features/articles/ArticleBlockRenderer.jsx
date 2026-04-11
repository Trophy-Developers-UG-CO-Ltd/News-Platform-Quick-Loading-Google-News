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
import MonetizedAdSlot from '../../components/ads/MonetizedAdSlot';

const BLOCK_COMPONENTS = {
  text: ArticleTextBlock,
  image: ArticleImageBlock,
  quote: ArticleQuoteBlock,
  code: ArticleCodeBlock,
  list: ArticleListBlock,
  video: ArticleVideoBlock,
};

const ArticleBlockRenderer = ({ blocks, injectMidArticleAd = false }) => {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
  const adInsertIndex = injectMidArticleAd && sortedBlocks.length > 4
    ? Math.ceil(sortedBlocks.length / 2) - 1
    : -1;

  return (
    <div className="article-blocks space-y-8">
      {sortedBlocks.map((block, index) => {
        const Component = BLOCK_COMPONENTS[block.type];
        if (!Component) return null;
        return (
          <React.Fragment key={block._id || block.order}>
            <Component data={block.data} />
            {index === adInsertIndex ? (
              <MonetizedAdSlot slotKey="articleInline" className="my-10" />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ArticleBlockRenderer;

// MukonoTalks

