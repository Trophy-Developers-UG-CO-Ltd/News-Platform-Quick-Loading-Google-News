/**
 * Accordion Block
 * Expandable FAQ / information sections
 * @module features/pages/blocks/AccordionBlock
 */

import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

const AccordionBlock = ({ data }) => {
  const [openIndex, setOpenIndex] = useState(null);

  if (!data || !data.items || data.items.length === 0) return null;

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        {data.heading && (
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">
            {data.heading}
          </h2>
        )}
        <div className="space-y-3">
          {data.items.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
                aria-expanded={openIndex === i}
              >
                <span className="font-semibold text-gray-800">{item.question || item.title}</span>
                {openIndex === i ? (
                  <FiChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <FiChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                )}
              </button>
              {openIndex === i && (
                <div className="px-6 pb-4 bg-white">
                  <p className="text-gray-600 leading-relaxed">
                    {item.answer || item.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AccordionBlock;

// MukonoTalks

