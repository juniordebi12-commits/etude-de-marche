// tailwind.config.js
export default {
  darkMode: 'class', // <- IMPORTANT
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'sana-blue': '#2563eb',       // blue signature (adjust if tu veux)
        'sana-blue-700': '#1e40af',
      },
    },
  },
  plugins: [],
}
