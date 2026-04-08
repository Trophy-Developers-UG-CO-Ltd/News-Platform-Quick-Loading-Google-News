import React from 'react';
import { FiMoon, FiSun } from 'react-icons/fi';

const ThemeToggle = ({ isDarkMode, onToggle, compactOnMobile = false }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle theme"
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex items-center rounded-full border border-white/60 bg-white/10 text-xs font-bold text-brand-white transition-colors hover:bg-white/20 ${compactOnMobile ? 'gap-0 px-2.5 py-2 sm:gap-2 sm:px-3 sm:py-1.5' : 'gap-2 px-3 py-1.5'}`}
    >
      {isDarkMode ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
      <span className={compactOnMobile ? 'hidden sm:inline' : ''}>{isDarkMode ? 'Light' : 'Dark'}</span>
    </button>
  );
};

export default ThemeToggle;
