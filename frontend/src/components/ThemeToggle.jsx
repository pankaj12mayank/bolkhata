import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LangContext'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const { t } = useLang()
  const isLight = theme === 'light'
  return (
    <button
      onClick={toggleTheme}
      aria-label={t('theme_toggle_label')}
      className="w-[52px] h-7 rounded-full bg-slate-200 dark:bg-slate-700 relative flex-shrink-0 p-1 transition-colors duration-200"
    >
      <div
        className={`w-5 h-5 rounded-full bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center transition-transform duration-200 ${isLight ? 'translate-x-6' : 'translate-x-0'}`}
      >
        {isLight ? <Sun size={12} className="text-amber-500" /> : <Moon size={12} className="text-slate-400" />}
      </div>
    </button>
  )
}
