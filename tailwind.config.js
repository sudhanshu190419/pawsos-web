/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        xs: '480px',
      },
      fontFamily: {
        display: ['Newsreader', 'serif'],
        sans: ['Manrope', 'sans-serif'],
      },
      colors: {
        primary: '#9c3e23',
        'on-primary': '#ffffff',
        'primary-container': '#bc5639',
        'on-primary-container': '#fffbff',
        secondary: '#446464',
        'on-secondary': '#ffffff',
        'secondary-container': '#c6e9e9',
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        surface: '#f0f0ef',
        'on-surface': '#1a1c1c',
        'on-surface-variant': '#56423d',
        'surface-container': '#e6e6e5',
        'surface-container-high': '#dcdcdb',
      }
    },
  },
  plugins: [],
}