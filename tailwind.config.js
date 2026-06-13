/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sidebar: '#1a1d23',
        orange: { DEFAULT: '#F97316', hover: '#e86a00' },
        page: '#f0f2f5',
        card: '#ffffff',
      },
    },
  },
  plugins: [],
}
