/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fc',
          400: '#38aef9',
          500: '#0e93eb',
          600: '#0275ca',
          700: '#035da3',
          800: '#075087',
          900: '#0c436f',
          950: '#082b49',
        },
        gov: {
          blue: '#0F2C59',
          orange: '#FF9933',
          gold: '#C5A880',
          green: '#138808',
          ash: '#EBF4F6'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
