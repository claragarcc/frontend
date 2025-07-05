/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/index.css",
  ],
  theme: {
    extend: {
      fontFamily: {
        optima: ['Optima', 'sans-serif'],
        futura: ['Futura', 'sans-serif'],
      },
      colors: {
        rojo: '#E72621',
        azul: '#00728A',
        azuloscuro: '#2C2559',
        grisoscuro: '#454E55',
        negro: '#FFFFFF',
      },
    },
  },
  plugins: [mtConfig],
}
