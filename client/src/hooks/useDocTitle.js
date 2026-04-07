/**
 * useDocTitle hook
 * Sets document title with brand prefix
 * @module hooks/useDocTitle
 */

import { useEffect } from 'react';

const useDocTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | MukonoTalks` : 'MukonoTalks';
    return () => {
      document.title = 'MukonoTalks';
    };
  }, [title]);
};

export default useDocTitle;

// MukonoTalks

