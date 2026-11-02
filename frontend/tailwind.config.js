/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Core clinic palette — calm teal for trust, warm accent for CTAs.
        clinic: {
          50: "#eefbf8",
          100: "#d5f3ec",
          200: "#ade7db",
          300: "#7ad5c4",
          400: "#48bba8",
          500: "#289e8d",
          600: "#1c7f72",
          700: "#1a655c",
          800: "#19514a",
          900: "#18433e",
        },
        accent: {
          400: "#f4a462",
          500: "#ee8b3a",
          600: "#dd722a",
        },
        slate: {
          50: "#f8fafc",
          900: "#0f172a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
