/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      display: ["Roboto", "sans-serif"],
    },
    extend: {
      gridTemplateRows: {
        "min-content": "min-content",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
