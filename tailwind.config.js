/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': '#121212',
        'surface': '#1e1e1e',
        'primary': '#bb86fc',
        'primary-variant': '#3700b3',
        'secondary': '#03dac6',
        'on-background': '#e0e0e0',
        'on-surface': '#ffffff',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
