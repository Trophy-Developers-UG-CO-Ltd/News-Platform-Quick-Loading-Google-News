import { useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'mukonotalks-theme';
const THEME_DARK = 'dark';
const THEME_LIGHT = 'light';

const applyThemeClass = (theme) => {
  const root = document.documentElement;
  const isDark = theme === THEME_DARK;

  root.classList.toggle(THEME_DARK, isDark);
  root.style.colorScheme = isDark ? THEME_DARK : THEME_LIGHT;
};

const readStoredTheme = () => {
  if (typeof window === 'undefined') {
    return THEME_LIGHT;
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === THEME_DARK ? THEME_DARK : THEME_LIGHT;
};

const useThemeMode = () => {
  const [theme, setTheme] = useState(() => readStoredTheme());

  useEffect(() => {
    applyThemeClass(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useMemo(
    () => () => setTheme((current) => (current === THEME_DARK ? THEME_LIGHT : THEME_DARK)),
    [],
  );

  return {
    theme,
    isDarkMode: theme === THEME_DARK,
    toggleTheme,
  };
};

export default useThemeMode;
