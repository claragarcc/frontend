/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // fontFamily: {
      //   optima: ['Optima', 'sans-serif'],
      //   futura: ['Futura', 'sans-serif'],
      fontFamily: {
    sans: ["Futura", "Arial", "Helvetica", "Verdana", "system-ui", "sans-serif"],
    optima: ["Optima", "sans-serif"],
      },
      colors: {
        rojo: '#E72621',
        azul: '#00728A',
        azuloscuro: '#2C2559',
        grisoscuro: '#454E55',
        negro: '#00000',
      },
    },
  },
  plugins: [mtConfig],
}
