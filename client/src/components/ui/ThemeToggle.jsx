import React from 'react';
import { FiMoon, FiSun } from 'react-icons/fi';

const ThemeToggle = ({ isDarkMode, onToggle }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle theme"
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/10 px-3 py-1.5 text-xs font-bold text-brand-white transition-colors hover:bg-white/20"
    >
      {isDarkMode ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
      <span>{isDarkMode ? 'Light' : 'Dark'}</span>
    </button>
  );
};

export default ThemeToggle;
