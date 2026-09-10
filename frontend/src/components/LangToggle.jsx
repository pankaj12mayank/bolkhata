import { useLang } from '../context/LangContext'

export default function LangToggle({ variant = "pill" }) {
  const { lang, toggleLang } = useLang()
  if (variant === "pill") {
    return (
      <button onClick={toggleLang} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
        <span className="text-[11px]">{lang === 'hi' ? 'हिं' : 'EN'}</span>
        <span className="w-px h-3 bg-slate-200 dark:bg-slate-600" />
        <span className={lang==='hi' ? 'text-amber-600' : 'text-slate-500'}>हि</span>
        <span className="text-slate-300">/</span>
        <span className={lang==='en' ? 'text-amber-600' : 'text-slate-500'}>EN</span>
      </button>
    )
  }
  return (
    <button onClick={toggleLang} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium">
      {lang === 'hi' ? 'EN' : 'हिंदी'}
    </button>
  )
}
