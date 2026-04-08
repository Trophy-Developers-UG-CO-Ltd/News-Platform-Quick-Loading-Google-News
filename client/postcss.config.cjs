// Suppress the PostCSS "No `from` option specified" warning that fires when
// the vite-plugin-pwa / Workbox CSS pipeline calls PostCSS without a source
// path. Setting `from: undefined` explicitly tells PostCSS the absence is
// intentional and suppresses the warning without changing any output.
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: { overrideBrowserslist: undefined },
  },
};

// Monkey-patch postcss warn to drop the noisy `from` advisory at build time.
// This does NOT affect any CSS output — it only silences the console line.
const origWarn = console.warn.bind(console);
console.warn = (...args) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("No `from` option specified")
  ) {
    return;
  }
  origWarn(...args);
};

// MukonoTalks

