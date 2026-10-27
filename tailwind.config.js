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
          700: "#23504B",
          800: "#1C403C",
          900: "#15302D",
        },
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
      },
      boxShadow: {
        card: "0 1px 2px rgba(22,26,25,.04), 0 1px 1px rgba(22,26,25,.02)",
        pop: "0 8px 28px rgba(22,26,25,.12), 0 2px 6px rgba(22,26,25,.06)",
      },
    },
  },
  plugins: [],
};
