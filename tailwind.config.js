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

  plugins: [require("daisyui")],

  // Tambahkan ini supaya DaisyUI tidak ke-purge di production
  safelist: [
    { pattern: /btn.*/ },
    { pattern: /card.*/ },
    { pattern: /alert.*/ },
    { pattern: /badge.*/ },
    { pattern: /input.*/ },
    { pattern: /textarea.*/ },
    { pattern: /select.*/ },
    { pattern: /modal.*/ },
    { pattern: /bg-.*/ },
    { pattern: /text-.*/ },
  ],

  daisyui: {
    themes: ["light"], // atau bisa custom tema
  },
}
