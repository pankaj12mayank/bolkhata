import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isLight = theme === 'light'
  return (
    <button
      onClick={toggleTheme}
      aria-label="Theme badlein"
      className="w-14 h-[30px] rounded-full bg-surface-2 border border-line relative flex-shrink-0"
    >
      <div
        className="absolute top-[3px] left-[3px] w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] transition-transform duration-500"
        style={{
          background: 'linear-gradient(145deg,var(--gold),var(--gold-deep))',
          transform: isLight ? 'translateX(26px)' : 'translateX(0)',
          boxShadow: '0 3px 8px rgba(0,0,0,.35)',
        }}
      >
        {isLight ? '☀' : '🌙'}
      </div>
    </button>
  )
}
