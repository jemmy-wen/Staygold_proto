/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF6F5",
          100: "#D5EAE7",
          200: "#ABD4CF",
          300: "#7DB9B2",
          400: "#4F9A92",
          500: "#32716A",
          600: "#2A615B",
          700: "#1C514B",
          800: "#1C403C",
          900: "#15302D",
        },
        // 語意色：藍 3984BD、黃 E0A93D、紅 BA3E44；文字用 600 以上才夠對比
        blue: { 50: "#EDF5FB", 100: "#D6E7F4", 200: "#B3D2EA", 300: "#8AB9DD", 400: "#629FCF", 500: "#3984BD", 600: "#2F71A4", 700: "#265B85", 800: "#1E4867", 900: "#16354C" },
        amber: { 50: "#FCF6E8", 100: "#F8E9C6", 200: "#F3DA9F", 300: "#EFCF8C", 400: "#E8BC63", 500: "#E0A93D", 600: "#8F6A14", 700: "#7A5A10", 800: "#5F460C", 900: "#463309" },
        rose: { 50: "#FBEFEF", 100: "#F5D9DA", 200: "#ECBABC", 300: "#E09497", 400: "#CE6A6F", 500: "#BA3E44", 600: "#A5353B", 700: "#8F2C31", 800: "#732428", 900: "#581B1E" },
        ink: {
          25: "#FAFBFB",
          50: "#F4F6F6",
          100: "#ECEFEF",
          200: "#E0E5E4",
          300: "#C8CFCE",
          400: "#9CA5A3",
          500: "#6F7977",
          600: "#535C5A",
          700: "#3C4442",
          800: "#272D2C",
          900: "#161A19",
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans TC"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        num: ['"Barlow"', '"Inter"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(22,26,25,.04), 0 1px 1px rgba(22,26,25,.02)",
        pop: "0 8px 28px rgba(22,26,25,.12), 0 2px 6px rgba(22,26,25,.06)",
      },
    },
  },
  plugins: [],
};
