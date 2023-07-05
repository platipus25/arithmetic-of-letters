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
      gridTemplateColumns: {
        "min-content": "min-content 1fr",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
