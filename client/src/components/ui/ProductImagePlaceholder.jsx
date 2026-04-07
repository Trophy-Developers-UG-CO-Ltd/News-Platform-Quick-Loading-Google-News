/**
 * ProductImagePlaceholder
 * Shown when a product has no image.
 * Renders the product name (up to 20 chars) on a background color
 * drawn from the project's Tailwind palette (primary, accent, and
 * Tailwind's built-in vivid shades). Same title → same colour.
 */

// Sourced from tailwind.config.cjs custom colors + Tailwind default palette vivid 500/600 shades
const PALETTE = [
  // primary (blue)
  '#3b82f6', // primary-500
  '#2563eb', // primary-600
  '#1d4ed8', // primary-700
  // accent (orange)
  '#f97316', // accent-500
  '#ea580c', // accent-600
  '#c2410c', // accent-700
  // Tailwind red
  '#ef4444', // red-500
  '#dc2626', // red-600
  // Tailwind rose
  '#f43f5e', // rose-500
  '#e11d48', // rose-600
  // Tailwind pink
  '#ec4899', // pink-500
  '#db2777', // pink-600
  // Tailwind fuchsia
  '#d946ef', // fuchsia-500
  '#c026d3', // fuchsia-600
  // Tailwind violet
  '#8b5cf6', // violet-500
  '#7c3aed', // violet-600
  // Tailwind purple
  '#a855f7', // purple-500
  '#9333ea', // purple-600
  // Tailwind indigo
  '#6366f1', // indigo-500
  '#4f46e5', // indigo-600
  // Tailwind cyan
  '#06b6d4', // cyan-500
  '#0891b2', // cyan-600
  // Tailwind teal
  '#14b8a6', // teal-500
  '#0d9488', // teal-600
  // Tailwind emerald
  '#10b981', // emerald-500
  '#059669', // emerald-600
  // Tailwind green
  '#22c55e', // green-500
  '#16a34a', // green-600
  // Tailwind lime
  '#84cc16', // lime-500
  '#65a30d', // lime-600
  // Tailwind yellow
  '#eab308', // yellow-500
  '#ca8a04', // yellow-600
  // Tailwind amber
  '#f59e0b', // amber-500
  '#d97706', // amber-600
];

/** Stable color picker – same title always gets the same colour. */
const getProductColor = (title = '') => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) & 0xffff;
  }
  return PALETTE[hash % PALETTE.length];
};

/**
 * @param {{ title?: string, className?: string }} props
 * `className` is applied to the outer wrapper so callers can control size.
 */
const ProductImagePlaceholder = ({ title = '', className = '' }) => {
  const label = title.slice(0, 20);
  const bg = getProductColor(title);

  return (
    <div
      className={`flex items-center justify-center w-full h-full ${className}`}
      style={{ backgroundColor: bg }}
    >
      <span
        className="font-bold text-white text-center leading-tight px-2 select-none"
        style={{
          opacity: 0.8,
          fontSize: 'clamp(0.65rem, 2.5cqi, 1.1rem)',
          wordBreak: 'break-word',
          maxWidth: '90%',
        }}
      >
        {label}
      </span>
    </div>
  );
};

export default ProductImagePlaceholder;

// MukonoTalks

