/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#172033',
        slate: '#778198',
        canvas: '#f5f6f9',
        accent: '#526bb5'
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'Arial', 'sans-serif'],
        mono: ['DM Mono', 'monospace']
      },
      boxShadow: {
        panel: '0 8px 32px rgba(22, 32, 55, .035)'
      }
    }
  },
  plugins: []
};
