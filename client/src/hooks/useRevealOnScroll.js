/**
 * useRevealOnScroll — production-ready scroll-triggered visibility hook
 * Respects prefers-reduced-motion for accessibility.
 * @module hooks/useRevealOnScroll
 */

import { useEffect, useRef, useState } from 'react';

export default function useRevealOnScroll({
  threshold = 0.15,
  rootMargin = '0px 0px -80px 0px',
  once = true,
} = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    // Respect reduced motion (accessibility)
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, visible };
}

// MukonoTalks

