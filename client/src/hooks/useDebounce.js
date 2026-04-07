/**
 * useDebounce hook
 * Debounces a value change to prevent excessive API calls
 * Essential for search performance at scale
 * @module hooks/useDebounce
 */

import { useState, useEffect } from 'react';

const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;

// MukonoTalks

