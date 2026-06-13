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
        brand: {
          orange: '#F97316',
          'orange-hover': '#EA6A00',
          dark:   '#111111',
          mid:    '#1C1C1C',
          surface:'#242424',
          border: '#2A2A2A',
        },
      },
    },
  },
  plugins: [],
}
