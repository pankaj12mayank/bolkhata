/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', 'html.dark'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Yatra One"', 'cursive'],
        body: ['Manrope', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        hand: ['Kalam', 'cursive'],
      },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(14px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        floatBook: { '0%,100%': { transform: 'rotateY(-18deg) rotateX(6deg) translateY(0px)' }, '50%': { transform: 'rotateY(-14deg) rotateX(3deg) translateY(-14px)' } },
        orbBreathe: { '0%,100%': { transform: 'translateZ(60px) scale(1)' }, '50%': { transform: 'translateZ(70px) scale(1.05)' } },
        pulseRing: { '0%': { transform: 'scale(.8)', opacity: .55 }, '100%': { transform: 'scale(2.1)', opacity: 0 } },
        micPulse: { '0%,100%': { boxShadow: '0 14px 34px -10px rgba(232,169,59,.5), 0 0 0 0 rgba(232,169,59,.5)' }, '50%': { boxShadow: '0 14px 34px -10px rgba(232,169,59,.5), 0 0 0 18px rgba(232,169,59,0)' } },
        wave: { '0%,100%': { height: '6px' }, '50%': { height: '30px' } },
        blink: { '50%': { opacity: 0 } },
      },
      animation: {
        fadeUp: 'fadeUp .5s ease',
        floatBook: 'floatBook 7s ease-in-out infinite',
        orbBreathe: 'orbBreathe 3.2s ease-in-out infinite',
        pulseRing: 'pulseRing 3s ease-out infinite',
        micPulse: 'micPulse 1s ease-in-out infinite',
        wave: 'wave .9s ease-in-out infinite',
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
}
