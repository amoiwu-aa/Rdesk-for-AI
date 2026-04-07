/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{html,tsx,ts}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        surface: 'var(--color-surface)',
        'surface-light': 'var(--color-surface-light)',
        'surface-lighter': 'var(--color-surface-lighter)',
        accent: 'var(--color-accent)',
        'accent-dark': 'var(--color-accent-dark)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        danger: 'var(--color-danger)',
        warning: 'var(--color-warning)',
        info: 'var(--color-info)',
      },
      animation: {
        'fade-in': 'fade-in 0.25s var(--ease-smooth)',
        'fade-in-up': 'fade-in-up 0.35s var(--ease-out)',
        'slide-up': 'slide-up 0.35s var(--ease-out)',
        'slide-in-right': 'slide-in-right 0.3s var(--ease-out)',
        'scale-in': 'scale-in 0.25s var(--ease-out)',
        'spin': 'spin 1s linear infinite',
        'skeleton': 'skeleton-pulse 1.8s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2.5s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'toast-in': 'toast-in 0.4s var(--ease-out)',
        'gradient': 'gradient-shift 3s ease infinite',
      },
      boxShadow: {
        'glow': 'var(--shadow-glow)',
        'card': 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'glow-sm': '0 0 10px var(--color-primary-glow)',
        'glow-lg': '0 0 30px var(--color-primary-glow)',
        'accent-glow': '0 0 20px var(--color-accent-glow)',
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-accent': 'var(--gradient-accent)',
        'gradient-surface': 'var(--gradient-surface)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    }
  },
  plugins: []
}
