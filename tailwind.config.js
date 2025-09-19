/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FAF8F1',
        secondary: '#FAEAB1',
        teriary: '#E5BA73',
        quaternary: '#C58940',
        "bpom-green": '#04A451',
        "bpom-blue": '#004281'
      }
    },
  },
  plugins: [require('daisyui')],
}
