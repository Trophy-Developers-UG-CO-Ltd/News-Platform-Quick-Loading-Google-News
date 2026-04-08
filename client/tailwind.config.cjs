/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // REQUIRED for manual toggle

  content: ['./src/**/*.{js,jsx,ts,tsx}'],

  theme: {
    extend: {

      /* ================= COLOR SYSTEM ================= */
      colors: {

        /* ⚫ DARK MODE (REFERENCE BASELINE) */
        dark: {
          black: '#0A0A0A',
          charcoal: '#121212',
          slate: '#191919',
          surface: '#252525',
          border: '#2E2E2E',
          hover: '#2A2A2A',
        },

        /* ⚪ LIGHT MODE (STRICT BLACK & WHITE) */
        light: {
          body: '#f4f4f4',      // REQUIRED (your spec)
          surface: '#FFFFFF',   // cards
          muted: '#E5E5E5',     // soft sections
          border: '#D4D4D4',    // borders
          hover: '#EAEAEA',     // hover state
        },

        /* 🔤 TEXT SYSTEM (MODE-AWARE VIA CLASSES) */
        text: {
          dark: {
            primary: '#FFFFFF',
            secondary: '#A1A1AA',
            muted: '#71717A',
            soft: '#52525B',
          },
          light: {
            primary: '#0A0A0A',   // REQUIRED (your spec)
            secondary: '#404040',
            muted: '#737373',
            soft: '#A3A3A3',
          }
        },

        /* Compatibility aliases kept monochrome */
        accent: {
          blue: '#0A0A0A',
          orange: '#262626',
          red: '#171717',
          green: '#111111',
        },

        category: {
          news: '#0A0A0A',
          entertainment: '#262626',
          local: '#171717',
          video: '#111111',
        },
      },

      /* ================= TYPOGRAPHY ================= */
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
      },

      /* ================= SPACING ================= */
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
      },

      /* ================= RADIUS ================= */
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },

      /* ================= SHADOW (MODE SAFE) ================= */
      boxShadow: {
        soft: '0 2px 10px rgba(0,0,0,0.08)',   // light mode
        card: '0 4px 20px rgba(0,0,0,0.12)',
        dark: '0 6px 30px rgba(0,0,0,0.6)',    // dark mode
      },

      /* ================= ANIMATION ================= */
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },

      animation: {
        fade: 'fadeIn 0.3s ease-out',
      },

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