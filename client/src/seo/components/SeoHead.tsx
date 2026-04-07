/**
 * SeoHead
 * Comprehensive SEO head component.
 * Injects title, meta description, canonical, Open Graph, Twitter Card,
 * robots directives, and hreflang via react-helmet-async.
 *
 * @module components/seo/SeoHead
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SeoHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: {
    index?: boolean;
    follow?: boolean;
    nosnippet?: boolean;
    noarchive?: boolean;
    noimageindex?: boolean;
  };
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    imageAlt?: string;
    type?: string;
    url?: string;
  };
  twitter?: {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player';
    title?: string;
    description?: string;
    image?: string;
    imageAlt?: string;
    site?: string;
    creator?: string;
  };
  hreflang?: Record<string, string>;
  customHeadTags?: string;
  siteName?: string;
}

const SeoHead: React.FC<SeoHeadProps> = ({
  title,
  description,
  canonical,
  robots = {},
  openGraph = {},
  twitter = {},
  hreflang = {},
  siteName = 'MukonoTalks',
}) => {
  // Build robots string
  const robotsParts: string[] = [];
  robotsParts.push(robots.index  === false ? 'noindex'  : 'index');
  robotsParts.push(robots.follow === false ? 'nofollow' : 'follow');
  if (robots.nosnippet)   robotsParts.push('nosnippet');
  if (robots.noarchive)   robotsParts.push('noarchive');
  if (robots.noimageindex) robotsParts.push('noimageindex');
  const robotsString = robotsParts.join(', ');

  const ogTitle       = openGraph.title       || title       || '';
  const ogDescription = openGraph.description || description || '';
  const twitterTitle  = twitter.title         || title       || '';
  const twitterDesc   = twitter.description   || description || '';

  return (
    <Helmet>
      {/* Primary Meta */}
      {title       && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      {canonical   && <link rel="canonical" href={canonical} />}
      <meta name="robots" content={robotsString} />

      {/* Open Graph */}
      {ogTitle       && <meta property="og:title"       content={ogTitle} />}
      {ogDescription && <meta property="og:description" content={ogDescription} />}
      {openGraph.image && <meta property="og:image"     content={openGraph.image} />}
      {openGraph.imageAlt && <meta property="og:image:alt" content={openGraph.imageAlt} />}
      {openGraph.type  && <meta property="og:type"      content={openGraph.type} />}
      {(openGraph.url || canonical) && <meta property="og:url" content={openGraph.url || canonical} />}
      {siteName && <meta property="og:site_name" content={siteName} />}

      {/* Twitter Card */}
      <meta name="twitter:card"        content={twitter.card || 'summary_large_image'} />
      {twitterTitle && <meta name="twitter:title"       content={twitterTitle} />}
      {twitterDesc  && <meta name="twitter:description" content={twitterDesc} />}
      {twitter.image    && <meta name="twitter:image"   content={twitter.image} />}
      {twitter.imageAlt && <meta name="twitter:image:alt" content={twitter.imageAlt} />}
      {twitter.site     && <meta name="twitter:site"    content={twitter.site} />}
      {twitter.creator  && <meta name="twitter:creator" content={twitter.creator} />}

      {/* Hreflang */}
      {Object.entries(hreflang).map(([lang, href]) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={href} />
      ))}
    </Helmet>
  );
};

export default SeoHead;

// MukonoTalks

