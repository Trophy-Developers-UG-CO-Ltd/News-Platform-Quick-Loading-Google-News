/**
 * Page Hero Block
 * Full-width background image with dark gradient overlay and text content.
 * Used on inner pages (About, Contact, etc.) — does NOT fetch hero slides.
 * Data fields: heading, subtitle, badge, backgroundImage,
 *              ctaText, ctaLink, secondaryCtaText, secondaryCtaLink,
 *              overlayOpacity (0-100, default 60)
 * @module features/pages/blocks/PageHeroBlock
 */

import React from 'react';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import LocalizedLink from '../../../components/i18n/LocalizedLink';

const PageHeroBlock = ({ data }) => {
  if (!data) return null;

  const {
    heading          = '',
    subtitle         = '',
    badge            = '',
    backgroundImage  = '',
    ctaText          = '',
    ctaLink          = '',
    secondaryCtaText = '',
    secondaryCtaLink = '',
    overlayOpacity   = 60,
  } = data;

  const opacity = Math.min(100, Math.max(0, Number(overlayOpacity))) / 100;

  return (
    <section className="relative bg-gray-950 text-white overflow-hidden">
      {/* Background image */}
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity }}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-950/85 to-gray-950/30" />

      {/* Content */}
      <div className="relative container mx-auto px-6 py-32 lg:py-44">
        {badge && (
          <div className="flex items-center gap-2 text-primary-400 text-sm font-semibold tracking-widest uppercase mb-6">
            <ShieldCheck className="w-4 h-4" />
            {badge}
          </div>
        )}

        {heading && (
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-3xl mb-6 whitespace-pre-line">
            {heading}
          </h1>
        )}

        {subtitle && (
          <p className="max-w-2xl text-lg text-gray-300 mb-10 leading-relaxed">
            {subtitle}
          </p>
        )}

        {(ctaText || secondaryCtaText) && (
          <div className="flex flex-wrap gap-4">
            {ctaText && ctaLink && (
              <LocalizedLink
                to={ctaLink}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                {ctaText} <ChevronRight className="w-4 h-4" />
              </LocalizedLink>
            )}
            {secondaryCtaText && secondaryCtaLink && (
              <LocalizedLink
                to={secondaryCtaLink}
                className="inline-flex items-center gap-2 border border-white/30 hover:border-white/60 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                {secondaryCtaText}
              </LocalizedLink>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default PageHeroBlock;

// MukonoTalks

