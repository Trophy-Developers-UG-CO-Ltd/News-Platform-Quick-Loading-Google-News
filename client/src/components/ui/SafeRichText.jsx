import React from 'react';
import DOMPurify from 'dompurify';

const SafeRichText = ({ html = '', className = '' }) => {
  const safeHtml = DOMPurify.sanitize(html || '', {
    USE_PROFILES: { html: true },
  });

  if (!safeHtml) return null;

  return <div className={className} dangerouslySetInnerHTML={{ __html: safeHtml }} />;
};

export default SafeRichText;
