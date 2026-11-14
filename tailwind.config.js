/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "-apple-system", "Segoe UI", "Arial", "sans-serif"],
        display: ["var(--font-display)", "Arial Narrow", "sans-serif"],
      },
      // "Island noticeboard" palette (Nov 2026). Token names are historical:
      // amber is the action colour (sea blue), navy is the colour on top of it
      // and the header/nav background, teal is the "good" green.
      colors: {
        bg: "#F3EEE4",
        navy: "#FFFFFF",
        surface: "#FFFFFF",
        surface2: "#ECE5D8",
        amber: { DEFAULT: "#0D5A87", 600: "#0A4A70", 700: "#083A58" },
        teal: { DEFAULT: "#1E7246" },
        ink: "#1C1A17",
        slate2: "#47423B",
        muted: "#766E62",
        ok: "#1E7246",
        warn: "#8A5A00",
        err: "#B3261E",
        info: "#0D5A87",
        flag: "#C8102E",
      },
      maxWidth: { xl: "36rem" },
      boxShadow: {
        card: "none",
        pop: "0 6px 18px rgba(28,26,23,.18)",
      },
    },
  },
  plugins: [],
};
