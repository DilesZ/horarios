/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#050D9E',
          cyan: '#00C1DE',
          dark: '#333333',
          gray: '#f5f7fa'
        },
        slate: {
          850: "#1e293b",
          900: "#0f172a",
        },
      },
    },
  },
  plugins: [],
};
