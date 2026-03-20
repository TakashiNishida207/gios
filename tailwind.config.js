/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/ui/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'gios-bg': '#0c0c0b', 'gios-bg2': '#131312', 'gios-bg3': '#1a1a18',
        'gios-teal': '#6eb5a0', 'gios-amber': '#c4975a', 'gios-purple': '#8b82c0',
        'gios-accent': '#c8b89a', 'gios-green': '#7aaa80', 'gios-red': '#b56e6e',
        'gios-text': '#e8e6e0', 'gios-secondary': '#7a7870', 'gios-tertiary': '#4a4844',
      },
      fontFamily: {
        mono: ['DM Mono', 'monospace'],
        serif: ['Instrument Serif', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
