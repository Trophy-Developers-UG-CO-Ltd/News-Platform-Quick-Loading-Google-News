/**
 * getLucideIcon
 * Resolves a Lucide icon name string to the actual React component.
 * Falls back to the Circle icon if the name is unknown.
 *
 * Usage:
 *   const Icon = getLucideIcon('PaintBucket');
 *   <Icon size={24} />
 */
import * as LucideIcons from 'lucide-react';

export const getLucideIcon = (iconName, fallback = 'Circle') => {
  if (iconName && LucideIcons[iconName]) return LucideIcons[iconName];
  return LucideIcons[fallback] || LucideIcons.Circle;
};

/**
 * Curated icon set available in the admin icon picker.
 * Grouped by category for easy browsing.
 */
export const ICON_GROUPS = [
  {
    label: 'Industry',
    icons: ['Factory', 'Building2', 'Warehouse', 'Hammer', 'HardHat', 'Cog', 'Settings', 'Wrench'],
  },
  {
    label: 'Products',
    icons: ['Package', 'Layers', 'Palette', 'Droplets', 'Beaker', 'FlaskConical', 'TestTube', 'Zap'],
  },
  {
    label: 'Science',
    icons: ['Microscope', 'Atom', 'Dna', 'Thermometer', 'Wind', 'Waves', 'Flame', 'Leaf'],
  },
  {
    label: 'Services',
    icons: ['Headphones', 'MessageSquare', 'Globe', 'Truck', 'FileText', 'ClipboardList', 'Mail', 'Phone'],
  },
  {
    label: 'Quality',
    icons: ['ShieldCheck', 'Star', 'Award', 'CheckCircle', 'BadgeCheck', 'Lock', 'Medal', 'Trophy'],
  },
  {
    label: 'Business',
    icons: ['BarChart2', 'TrendingUp', 'DollarSign', 'Users', 'Briefcase', 'LineChart', 'PieChart', 'Target'],
  },
  {
    label: 'Actions & UI',
    icons: ['ArrowRight', 'Download', 'Upload', 'Search', 'Plus', 'Minus', 'ChevronRight', 'ExternalLink'],
  },
  {
    label: 'Decorative',
    icons: ['Sparkles', 'Sun', 'Moon', 'Cloud', 'MapPin', 'Heart', 'BookOpen', 'Lightbulb'],
  },
];

export const ALL_ICONS = ICON_GROUPS.flatMap((g) => g.icons);
