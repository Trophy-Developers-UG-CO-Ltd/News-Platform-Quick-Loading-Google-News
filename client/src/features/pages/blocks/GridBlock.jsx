/**
 * Grid Block
 * Responsive card grid for features, services, or stats
 * @module features/pages/blocks/GridBlock
 */

import React from 'react';
import { Link } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';

const GridBlock = ({ data }) => {
  if (!data || !data.items || data.items.length === 0) return null;

  const columns = data.columns || 3;
  const gridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        {data.heading && (
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-10">
            {data.heading}
          </h2>
        )}
        <div className={`grid grid-cols-1 ${gridCols[columns] || gridCols[3]} gap-6`}>
          {data.items.map((item, i) => (
            <div key={i} className="card p-6 text-center hover:shadow-md transition-shadow">
              {item.icon && (() => {
                const LucideIcon = LucideIcons[item.icon];
                return LucideIcon
                  ? <div className="flex justify-center mb-4"><LucideIcon className="w-8 h-8 text-primary-600" /></div>
                  : <div className="text-4xl mb-4">{item.icon}</div>;
              })()}
              {item.image && (
                <img
                  src={item.image}
                  alt={item.title || ''}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  loading="lazy"
                />
              )}
              {item.title && (
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
              )}
              {item.description && (
                <p className="text-gray-600 text-sm">{item.description}</p>
              )}
              {item.link && item.linkText && (
                <Link to={item.link} className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-3 inline-block">
                  {item.linkText} →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GridBlock;

// MukonoTalks

