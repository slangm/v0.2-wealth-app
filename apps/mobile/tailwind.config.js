/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#05070d",
        surface: "#0d111c",
        primary: "#4C7BFF",
        success: "#22c55e",
        warning: "#fbbf24",
        danger: "#f87171",
      },
    },
  },
  plugins: [],
}

