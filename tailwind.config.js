/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#F6F6FD",
        ink: "#131A2E",
        pill: "#ECEEFA",
        brand: { DEFAULT: "#22C55E", dark: "#15803D", soft: "#DCFCE7" },
        protein: "#1D5FD1",
        carbs: "#F9903C",
        fat: "#C0261F",
      },
    },
  },
  plugins: [],
};
