import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark backgrounds
        'dark-bg': '#0f0f0f',      // Main background - near-black
        'dark-surface': '#1a1a1a', // Subtle surfaces
        'dark-border': '#2a2a2a',  // Subtle borders
        
        // Text
        'text-primary': '#f5f1e8',   // Warm ivory/cream
        'text-secondary': '#a89f94', // Muted warm gray
        'text-tertiary': '#6b6359',  // Dimmer gray
        
        // Accents
        'accent-lime': '#7ee22c',    // Electric lime (primary accent)
        'accent-lime-dark': '#5fa61f',
        'accent-violet': '#8b7fb8',  // Muted lavender (secondary)
        'accent-orange': '#b8855c',  // Soft orange (secondary)
        
        // Status colors
        'success': '#7ee22c',
        'error': '#e74c3c',
        'warning': '#d4a574',
        'info': '#7ee22c',
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
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['32px', { lineHeight: '40px' }],
        '4xl': ['48px', { lineHeight: '56px' }],
        '5xl': ['64px', { lineHeight: '72px' }],
      },
      fontWeight: {
        thin: '100',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      borderRadius: {
        'none': '0',
        'sm': '4px',
        'base': '6px',
        'md': '8px',
        'lg': '12px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'base': '0 2px 4px rgba(0, 0, 0, 0.4)',
        'md': '0 4px 8px rgba(0, 0, 0, 0.5)',
        'lg': '0 8px 16px rgba(0, 0, 0, 0.6)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in-delay-1': 'fadeIn 0.4s ease-out 0.1s both',
        'fade-in-delay-2': 'fadeIn 0.4s ease-out 0.2s both',
        'fade-in-delay-3': 'fadeIn 0.4s ease-out 0.3s both',
        'bar-grow': 'barGrow 0.8s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        barGrow: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
    },
  },
  plugins: [],
}
export default config

