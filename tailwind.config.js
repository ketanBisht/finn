/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fffdf0",
          100: "#fff9cf",
          200: "#fff29f",
          300: "#ffe866",
          400: "#ffd933",
          500: "#FFC83B", // Warm Golden Amber
          600: "#e6b025",
          700: "#ba8914",
          800: "#8e650d",
          900: "#634407",
        },
        gold: {
          light: "#FFF4D2",
          DEFAULT: "#FFC83B",
          card: "#F6CB68",
          dark: "#DDA21B",
        },
        charcoal: {
          50: "#f6f6f6",
          100: "#e7e7e7",
          200: "#d1d1d2",
          300: "#b0b0b2",
          400: "#88888c",
          500: "#6d6d71",
          600: "#57575b",
          700: "#454548",
          800: "#27272a",
          900: "#18181b",
          950: "#121214", // Deep rich black pill
        },
        surface: {
          light: "#F7F7F5", // Warm Sand Light
          dark: "#0E0E10",
          cardLight: "#ffffff",
          cardDark: "#161618",
          cardGold: "#F6CB68",
          borderLight: "#EAEAE5",
          borderDark: "#27272a",
        },
      },
    },
  },
  plugins: [],
};


