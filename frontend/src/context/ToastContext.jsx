import { createContext, useContext, useRef, useState } from 'react'
import { useLang } from './LangContext'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState('')
  const [type, setType] = useState('success')
  const [show, setShow] = useState(false)
  const timer = useRef(null)
  const { tl } = useLang()

  const showToast = (text, tType = 'success', params = null) => {
    let final = tl(text)
    if (text.startsWith('toast_')) {
      if (params) {
        for (const k in params) final = final.replaceAll(`{${k}}`, params[k])
      }
    }
    setMsg(final)
    setType(tType)
    setShow(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setShow(false), 3400)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className={`fixed bottom-6 right-6 z-[400] max-w-[380px] px-5 py-4 rounded-2xl font-bold text-[13.5px] leading-snug
        bg-white dark:bg-slate-800 border shadow-deep flex items-center gap-3 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${type === 'success' ? 'border-green-500' : 'border-red-500'}
        ${show ? 'opacity-100 translate-x-0 translate-y-0' : 'opacity-0 translate-x-8 translate-y-4 pointer-events-none'}`}
        style={{ boxShadow: '0 20px 50px -12px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.08)' }}
      >
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${type === 'success' ? 'bg-green-100 dark:bg-green-900/30 border border-green-500' : 'bg-red-100 dark:bg-red-900/30 border border-red-500'}`}>
          <span className={`text-[14px] ${type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{type === 'success' ? '✓' : '!'}</span>
        </div>
        <span className="text-slate-900 dark:text-slate-100 font-body flex-1">{msg}</span>
        <button onClick={() => setShow(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 ml-2 text-[16px] leading-none">×</button>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
