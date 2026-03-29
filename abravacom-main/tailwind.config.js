/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './App.tsx',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './crm/**/*.{tsx,ts}',
    './src/**/*.{js,ts,jsx,tsx}',
    '!./node_modules/**/*',
    '!./**/*.{test,spec}.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
