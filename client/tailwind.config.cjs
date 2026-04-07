/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],

  theme: {
    extend: {

      /* ================= COLORS ================= */
      colors: {

        /* 🎯 BRAND DARK SYSTEM */
        dark: {
          black: '#0A0A0A',     // Rich Black (deep base)
          charcoal: '#121212',  // Main background
          slate: '#191919',     // Elevated surfaces
          surface: '#252525',   // Cards / containers
          border: '#2E2E2E',    // Subtle borders
          hover: '#2A2A2A',     // Hover states
        },

        /* ⚪ TEXT HIERARCHY */
        text: {
          primary: '#FFFFFF',
          secondary: '#A1A1AA',
          muted: '#71717A',
          soft: '#52525B',
        },

        /* 🎨 ACCENTS (MEDIA PLATFORM READY) */
        accent: {
          green: '#22c55e',   // Opportunities / positive
          orange: '#f97316',  // Engagement / CTA
          red: '#ef4444',     // Breaking / alerts
          blue: '#3b82f6',    // News / links
          purple: '#a855f7',  // Entertainment
        },

        /* 🌈 CATEGORY COLORS */
        category: {
          news: '#3b82f6',
          entertainment: '#a855f7',
          politics: '#ef4444',
          lifestyle: '#f97316',
          opportunities: '#22c55e',
        },
      },

      /* ================= TYPOGRAPHY ================= */
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
      },

      /* ================= SPACING SCALE ================= */
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
      },

      /* ================= BORDER RADIUS ================= */
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },

      /* ================= SHADOW SYSTEM ================= */
      boxShadow: {
        soft: '0 4px 20px rgba(0,0,0,0.4)',
        card: '0 6px 30px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(255,255,255,0.05)',
      },

      /* ================= TRANSITIONS ================= */
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      /* ================= ANIMATIONS ================= */
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },

        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },

      animation: {
        fade: 'fadeIn 0.4s ease-out',
        shimmer: 'shimmer 2s linear infinite',
      },

      /* ================= BACKDROP ================= */
      backdropBlur: {
        xs: '2px',
      },
    },
  },

  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};