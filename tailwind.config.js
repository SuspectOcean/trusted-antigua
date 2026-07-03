/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1B3A5B",
        teal: "#12808A",
        gold: "#C8922A",
        sand: "#F6F3EC",
        ink: "#20303c",
      },
      maxWidth: { xl: "36rem" },
    },
  },
  plugins: [],
};
