const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        ink: '#17222d',
        paper: '#fcfaf5',
        accent: '#1f6f8b',
      },
      boxShadow: {
        soft: '0 10px 24px rgba(18, 34, 50, 0.10)',
        panel: '0 8px 20px rgba(20, 34, 50, 0.08)',
      },
    },
  },
  plugins: [],
};
