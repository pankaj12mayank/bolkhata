/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', 'html.dark'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Midnight Ink + Warm Amber - premium cinematic (not blue)
        primary: { DEFAULT: '#0F172A', 50: '#F8FAFC', 100: '#F1F5F9', 500: '#0F172A', 600: '#0F172A', 700: '#020617', 900: '#020617' },
        accent: { DEFAULT: '#F59E0B', 50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309' },
        secondary: { DEFAULT: '#64748B', 50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 500: '#64748B', 600: '#475569', 700: '#334155', 900: '#0F172A' },
        ink: { DEFAULT: '#0F172A', dim: '#64748B' },
        surface: { DEFAULT: '#FFFFFF', 2: '#F8FAFC', soft: '#F1F5F9' },
        line: 'rgba(15,23,42,0.08)',
        maroon: '#DC2626',
        green: '#059669',
        gold: '#F59E0B',
        amber: { 50: '#FFFBEB', 100: '#FEF3C7', 500: '#F59E0B', 600: '#D97706' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(15,23,42,0.06), 0 2px 8px -2px rgba(15,23,42,0.04)',
        medium: '0 8px 32px -8px rgba(15,23,42,0.08), 0 4px 16px -4px rgba(15,23,42,0.04)',
        deep: '0 16px 48px -12px rgba(15,23,42,0.16), 0 4px 16px -4px rgba(15,23,42,0.08)',
        amber: '0 8px 24px -6px rgba(245,158,11,0.35)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: 0, transform: 'scale(0.96)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.7 } },
        progress: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } },
        wave: { '0%,100%': { height: '6px' }, '50%': { height: '24px' } },
        micPulse: { '0%,100%': { boxShadow: '0 8px 24px -6px rgba(245,158,11,0.35), 0 0 0 0 rgba(245,158,11,0.4)' }, '50%': { boxShadow: '0 8px 24px -6px rgba(245,158,11,0.35), 0 0 0 14px rgba(245,158,11,0)' } },
      },
      animation: {
        fadeUp: 'fadeUp .5s cubic-bezier(0.16,1,0.3,1)',
        scaleIn: 'scaleIn .25s ease',
        shimmer: 'shimmer 1.4s infinite',
        pulseSoft: 'pulseSoft 2s ease-in-out infinite',
        wave: 'wave .9s ease-in-out infinite',
        micPulse: 'micPulse 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
