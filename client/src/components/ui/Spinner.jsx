/**
 * Spinner component
 * Reusable loading indicator
 * @module components/ui/Spinner
 */

import React from 'react';

const sizeMap = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const Spinner = ({ size = 'md', className = '' }) => {
  return (
    <div
      className={`animate-spin rounded-full border-4 border-gray-200 border-t-primary-600 ${sizeMap[size] || sizeMap.md} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;

// MukonoTalks

