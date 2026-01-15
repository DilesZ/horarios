/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        slate: {
          850: "#1e293b",
          900: "#0f172a",
        },
      },
    },
  },
  plugins: [],
};
