/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'larsen-blue': '#28327B',
        'larsen-red': '#D81E2A',
        'larsen-pink': '#D3AFC4',
        'larsen-dark-red': '#B7444C',
        'larsen-white': '#FFFFFF',
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  },
}
