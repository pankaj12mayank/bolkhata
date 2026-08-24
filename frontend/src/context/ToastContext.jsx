import { createContext, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState('')
  const [type, setType] = useState('success')
  const [show, setShow] = useState(false)
  const timer = useRef(null)

  const showToast = (text, t = 'success') => {
    const hindiMap = {
      'Shop deleted successfully': 'Dukaan safalta se delete ho gayi ✓',
      'Shop status updated': 'Dukaan status update ho gaya ✓',
      'Settings saved': 'Settings save ho gaye ✓',
      'Reset successful': 'Sab data reset ho gaya ✓',
      'Error': 'Kuch galat ho gaya',
    }
    let final = text
    if (hindiMap[text]) final = hindiMap[text]
    setMsg(final)
    setType(t)
    setShow(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setShow(false), 3400)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className={`fixed bottom-6 right-6 z-[400] max-w-[380px] px-5 py-4 rounded-2xl font-bold text-[13.5px] leading-snug
        bg-surface border shadow-deep flex items-center gap-3 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${type === 'success' ? 'border-[var(--gold)]' : 'border-[var(--maroon)]'}
        ${show ? 'opacity-100 translate-x-0 translate-y-0' : 'opacity-0 translate-x-8 translate-y-4 pointer-events-none'}`}
        style={{ boxShadow: '0 20px 50px -12px rgba(0,0,0,0.45), 0 0 0 1px var(--line)' }}
      >
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${type === 'success' ? 'bg-[rgba(79,163,122,0.15)] border border-green' : 'bg-[rgba(229,83,61,0.12)] border border-maroon'}`}>
          <span className={`text-[14px] ${type === 'success' ? 'text-green' : 'text-maroon'}`}>{type === 'success' ? '✓' : '!'}</span>
        </div>
        <span className="text-ink font-body flex-1">{msg}</span>
        <button onClick={() => setShow(false)} className="text-ink-dim hover:text-ink ml-2 text-[16px] leading-none">×</button>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
