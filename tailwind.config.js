/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0052CC',
          light: '#4A90D9',
          dark: '#003D99',
        },
        'bg-header': '#172B4D',
        'bg-sidebar': '#091E42',
        'bg-light': '#F4F5F7',
        'text-primary': '#172B4D',
        'text-secondary': '#5E6C84',
        'text-muted': '#8993A4',
        'border-color': '#DFE1E6',
        success: '#36B37E',
        warning: '#D97706',
        danger: '#E53935',
      },
    },
  },
  plugins: [],
}
