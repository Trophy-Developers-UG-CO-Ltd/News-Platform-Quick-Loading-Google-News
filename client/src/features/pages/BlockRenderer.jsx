/**
 * Block Renderer
 * Maps structured content blocks to React components
 * No dangerouslySetInnerHTML — only structured component rendering
 * @module features/pages/BlockRenderer
 */

import React from 'react';
import HeroBlock from './blocks/HeroBlock';
import PageHeroBlock from './blocks/PageHeroBlock';
import TextBlock from './blocks/TextBlock';
import ImageBlock from './blocks/ImageBlock';
import CTABlock from './blocks/CTABlock';
import GridBlock from './blocks/GridBlock';
import VideoBlock from './blocks/VideoBlock';
import AccordionBlock from './blocks/AccordionBlock';

/**
 * Block type → component mapping
 */
const BLOCK_COMPONENTS = {
  hero: HeroBlock,
  'page-hero': PageHeroBlock,
  text: TextBlock,
  image: ImageBlock,
  cta: CTABlock,
  grid: GridBlock,
  video: VideoBlock,
  accordion: AccordionBlock,
};

/**
 * Renders an array of content blocks in order
 * @param {Object} props
 * @param {Array} props.blocks - Content blocks array (already localized from API)
 * @returns {JSX.Element}
 */
const BlockRenderer = ({ blocks }) => {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  // Sort by order to ensure correct rendering sequence
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="block-renderer">
      {sortedBlocks.map((block) => {
        const Component = BLOCK_COMPONENTS[block.type];
        if (!Component) {
          return null; // Unknown block type — skip silently
        }
        return <Component key={block._id || block.order} data={block.data} />;
      })}
    </div>
  );
};

export default BlockRenderer;

// MukonoTalks

