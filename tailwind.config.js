/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0C1526",
        navy: "#0A1120",
        surface: "#16233A",
        surface2: "#1C2B45",
        amber: { DEFAULT: "#DD9048", 600: "#C57A33", 700: "#A9631F" },
        teal: { DEFAULT: "#3AA6B0" },
        ink: "#EEF2F8",
        slate2: "#AAB6C8",
        muted: "#7C8AA0",
        ok: "#43B67D",
        warn: "#E3B84A",
        err: "#E76A5E",
        info: "#4F9BE0",
      },
      maxWidth: { xl: "36rem" },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.30), 0 1px 3px rgba(0,0,0,.24)",
        pop: "0 8px 24px rgba(0,0,0,.35)",
      },
    },
  },
  plugins: [],
};
