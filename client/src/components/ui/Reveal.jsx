/**
 * Reveal — scroll-triggered animation wrapper
 * Supports: fade-up, fade-down, fade-left, fade-right, zoom
 * Reusable across the entire design system.
 *
 * StaggerReveal — wraps an array of children with staggered Reveal delays.
 * Ideal for product grids, feature lists, and card rows.
 *
 * @module components/ui/Reveal
 */

import React from 'react';
import useRevealOnScroll from '../../hooks/useRevealOnScroll';

const animations = {
  'fade-up': {
    hidden: 'opacity-0 translate-y-6',
    visible: 'opacity-100 translate-y-0',
  },
  'fade-down': {
    hidden: 'opacity-0 -translate-y-6',
    visible: 'opacity-100 translate-y-0',
  },
  'fade-left': {
    hidden: 'opacity-0 translate-x-6',
    visible: 'opacity-100 translate-x-0',
  },
  'fade-right': {
    hidden: 'opacity-0 -translate-x-6',
    visible: 'opacity-100 translate-x-0',
  },
  zoom: {
    hidden: 'opacity-0 scale-95',
    visible: 'opacity-100 scale-100',
  },
};

export default function Reveal({
  children,
  delay = 0,
  duration = 500,
  variant = 'fade-up',
  once = true,
  className = '',
}) {
  const { ref, visible } = useRevealOnScroll({ once });
  const animation = animations[variant] || animations['fade-up'];

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
      }}
      className={`transition-all ease-out will-change-transform ${
        visible ? animation.visible : animation.hidden
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function StaggerReveal({ children, stagger = 100, variant = 'fade-up', duration = 500 }) {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <Reveal key={index} delay={index * stagger} variant={variant} duration={duration}>
          {child}
        </Reveal>
      ))}
    </>
  );
}

// MukonoTalks

