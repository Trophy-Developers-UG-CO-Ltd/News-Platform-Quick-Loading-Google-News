import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// ─────────────────────────────────────────────────────────────────────────────
// Workbox runtime-caching rules
// ─────────────────────────────────────────────────────────────────────────────
const runtimeCaching = [
  // API routes — NetworkFirst with 5-second timeout; fall back to cache for 7 d
  {
    urlPattern: /^\/api\/.*/i,
    handler: "NetworkFirst",
    options: {
      cacheName: "api-cache",
      networkTimeoutSeconds: 5,
      expiration: {
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },

  // Uploaded media — CacheFirst for 30 days
  {
    urlPattern: /^\/uploads\/.*/i,
    handler: "CacheFirst",
    options: {
      cacheName: "uploads-cache",
      expiration: {
        maxEntries: 150,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },

  // Google Fonts stylesheet
  {
    urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "google-fonts-stylesheets",
      expiration: {
        maxEntries: 10,
        maxAgeSeconds: 365 * 24 * 60 * 60,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },

  // Google Fonts files
  {
    urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
    handler: "CacheFirst",
    options: {
      cacheName: "google-fonts-webfonts",
      expiration: {
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },

  // External images
  {
    urlPattern: /\.(?:png|jpg|jpeg|webp|gif|avif|svg|ico)$/i,
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "image-cache",
      expiration: {
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
];

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  const isProduction = mode === "production";
  const pwaEnv = process.env.VITE_ENABLE_PWA;
  const enablePwa = pwaEnv ? pwaEnv === "true" : isProduction;
  const hmrHost = process.env.VITE_HMR_HOST;
  const hmrProtocol = process.env.VITE_HMR_PROTOCOL;
  const hmrClientPort = process.env.VITE_HMR_CLIENT_PORT
    ? Number(process.env.VITE_HMR_CLIENT_PORT)
    : undefined;
  const hmrConfig = hmrHost || hmrProtocol || hmrClientPort
    ? {
        ...(hmrHost ? { host: hmrHost } : {}),
        ...(hmrProtocol ? { protocol: hmrProtocol } : {}),
        ...(hmrClientPort ? { clientPort: hmrClientPort } : {}),
      }
    : undefined;

  return {
    base: "/",

    plugins: [
      react(),

      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        includeAssets: ["favicon.png", "**/*.png", "**/*.svg"],

        manifest: {
          name: "MukonoTalks",
          short_name: "MukonoTalks",
          description: "B2B Industrial Chemicals E-Commerce Platform",
          theme_color: "#1a56db",
          background_color: "#ffffff",
          display: "standalone",
          scope: "/",
          start_url: "/",
          orientation: "portrait-primary",
          categories: ["business", "shopping"],
          icons: [
            {
              src: "/MUKONOTALKS.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/MUKONOTALKS.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
          shortcuts: [
            {
              name: "Products",
              url: "/products",
              icons: [{ src: "/MUKONOTALKS.png", sizes: "96x96" }],
            },
            {
              name: "Get a Quote",
              url: "/get-quote",
              icons: [{ src: "/MUKONOTALKS.png", sizes: "96x96" }],
            },
          ],
        },

        workbox: {
          globPatterns: [
            "**/*.{js,css,html,ico,png,svg,webp,woff,woff2}"
          ],

          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api/, /^\/uploads/, /^\/__/],

          runtimeCaching,

          skipWaiting: true,
          clientsClaim: true,

          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        },

        devOptions: {
          enabled: false,
          type: "module",
        },

        disable: !enablePwa,
      }),
    ],

    server: {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true,

      ...(hmrConfig ? { hmr: hmrConfig } : {}),

      watch: {
        usePolling: true,
      },

      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        "/uploads": {
          target: "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
      },
    },

    preview: {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true,
    },

    build: {
      outDir: "build",

      rollupOptions: {
        output: {
          manualChunks: {
            // ── Core React stack ──────────────────────────────────────────
            "vendor-react": [
              "react",
              "react-dom",
              "react-router-dom",
            ],

            // ── State management ──────────────────────────────────────────
            "vendor-redux": [
              "@reduxjs/toolkit",
              "react-redux",
              "redux-persist",
            ],

            // ── Internationalisation ──────────────────────────────────────
            "vendor-i18n": [
              "i18next",
              "react-i18next",
              "i18next-browser-languagedetector",
              "i18next-http-backend",
            ],

            // ── Icon libraries  (~554 KB without splitting) ───────────────
            "vendor-icons": [
              "lucide-react",
              "react-icons",
            ],

            // ── Rich-text editor (tiptap + ProseMirror) ───────────────────
            "vendor-editor": [
              "@tiptap/react",
              "@tiptap/starter-kit",
              "@tiptap/extension-color",
              "@tiptap/extension-link",
              "@tiptap/extension-placeholder",
              "@tiptap/extension-text-align",
              "@tiptap/extension-text-style",
            ],

            // ── Charting / analytics ──────────────────────────────────────
            "vendor-charts": [
              "recharts",
            ],

            // ── Animation ─────────────────────────────────────────────────
            "vendor-motion": [
              "framer-motion",
            ],

            // ── Data-fetching ─────────────────────────────────────────────
            "vendor-query": [
              "@tanstack/react-query",
              "@tanstack/react-query-persist-client",
              "@tanstack/query-async-storage-persister",
            ],

            // ── UI utilities ──────────────────────────────────────────────
            "vendor-ui": [
              "clsx",
              "tailwind-merge",
              "class-variance-authority",
              "dompurify",
            ],
          },
        },
      },

      chunkSizeWarningLimit: 600,
      cssCodeSplit: true,
      minify: "terser",
      sourcemap: false,

      terserOptions: {
        compress: {
          drop_console: !isDev,
          drop_debugger: !isDev,
        },
      },
    },
  };
});
//  Designed by Trophy Developers Uganda : https://www.trophydevelopers.com/uganda-web-designers/