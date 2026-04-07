/**
 * Article Code Block
 * Formatted code snippet with language label and copy support
 * @module features/articles/blocks/ArticleCodeBlock
 */

import React, { useState } from 'react';

const ArticleCodeBlock = ({ data }) => {
  const [copied, setCopied] = useState(false);

  if (!data || !data.code) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(data.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="article-code-block rounded-lg overflow-hidden shadow-md">
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
        <span className="text-xs text-gray-400 font-mono uppercase">
          {data.language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {data.title && (
        <div className="bg-gray-700 px-4 py-1">
          <span className="text-sm text-gray-300">{data.title}</span>
        </div>
      )}
      <pre className="bg-gray-900 text-green-400 p-4 overflow-x-auto text-sm leading-relaxed">
        <code>{data.code}</code>
      </pre>
    </div>
  );
};

export default ArticleCodeBlock;

// MukonoTalks

