/**
 * BreadcrumbSchema
 * Renders BreadcrumbList JSON-LD schema + optional visible breadcrumb UI.
 *
 * @module components/seo/BreadcrumbSchema
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
  siteUrl?: string;
  showBreadcrumb?: boolean;
  separator?: React.ReactNode;
}

const BreadcrumbSchema: React.FC<BreadcrumbSchemaProps> = ({
  items,
  siteUrl = '',
  showBreadcrumb = true,
  separator = '/',
}) => {
  const schema = {
    '@context':        'https://schema.org',
    '@type':           'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type':  'ListItem',
      position: i + 1,
      name:     item.name,
      item:     item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      {showBreadcrumb && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-gray-500">
          {items.map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="mx-1 text-gray-400">{separator}</span>}
              {i < items.length - 1 ? (
                <a href={item.url} className="hover:text-blue-600 transition-colors">
                  {item.name}
                </a>
              ) : (
                <span className="text-gray-700 font-medium" aria-current="page">
                  {item.name}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
    </>
  );
};

export default BreadcrumbSchema;

// MukonoTalks

