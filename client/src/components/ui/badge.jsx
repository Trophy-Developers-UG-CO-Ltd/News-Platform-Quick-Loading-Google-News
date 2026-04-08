/**
 * shadcn/ui-style Badge component
 */
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-accent-blue text-text-primary',
        secondary:   'border-transparent bg-dark-slate text-text-secondary',
        destructive: 'border-transparent bg-red-100 text-red-700',
        outline:     'border-dark-border text-text-secondary',
        success:     'border-transparent bg-green-100 text-green-700',
        warning:     'border-transparent bg-yellow-100 text-yellow-700',
        info:        'border-transparent bg-blue-100 text-blue-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export const Badge = ({ className, variant, ...props }) => (
  <div className={cn(badgeVariants({ variant }), className)} {...props} />
);
