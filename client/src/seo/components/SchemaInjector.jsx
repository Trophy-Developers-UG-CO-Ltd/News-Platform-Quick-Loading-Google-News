/**
 * SchemaInjector
 * Renders one or more valid schema.org JSON-LD objects via react-helmet-async.
 * Filters out null/undefined/empty entries automatically.
 *
 * Usage:
 *   <SchemaInjector schemas={[productSchema, breadcrumbSchema, faqSchema]} />
 *
 * @module components/seo/SchemaInjector
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * @param {{ schemas: object | object[] }} props
 */
const SchemaInjector = ({ schemas }) => {
  const list = (Array.isArray(schemas) ? schemas : [schemas]).filter(
    (s) => s && typeof s === 'object' && Object.keys(s).length > 0
  );

  if (list.length === 0) return null;

  return (
    <Helmet>
      {list.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SchemaInjector;

// MukonoTalks

