/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // A MÁGICA ACONTECE AQUI:
  darkMode: 'class', 
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'), // Adiciona suporte para a classe 'prose'
  ],
}