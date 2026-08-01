import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'neutral': {
          900: '#0f0f0f',
          800: '#1a1a1a',
          700: '#2a2a2a',
          400: '#a89f94',
          300: '#6b6359',
        },
        'lime': '#7ee22c',
        'lime-dark': '#5fa61f',
        'orange': '#b8855c',
        'violet': '#8b7fb8',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '40px',
        '4xl': '48px',
        '5xl': '64px',
        '6xl': '80px',
      },
    },
  },
  plugins: [],
}
export default config

