const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    'extension/**/*.svelte',
    'extension/**/*.html',
  ],
  theme: {
    colors: {
      'elevation-0': 'rgb(var(--elevation-0) / <alpha-value>)',
      'elevation-1': 'rgb(var(--elevation-1) / <alpha-value>)',
      'elevation-2': 'rgb(var(--elevation-2) / <alpha-value>)',
      'elevation-3': 'rgb(var(--elevation-3) / <alpha-value>)',
      'highlight-1': 'rgb(var(--highlight-1) / <alpha-value>)',
      'hover-1': 'rgb(var(--hover-1) / <alpha-value>)',
      'hover-strong': 'rgb(var(--hover-strong) / <alpha-value>)',
      'border-1': 'rgb(var(--border-1) / <alpha-value>)',
      ...colors
    },
    extend: {},
  },
  plugins: [],
}
