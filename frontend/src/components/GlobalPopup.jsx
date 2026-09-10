import Logo from './Logo'
import { useLang } from '../context/LangContext'

export default function GlobalPopup({ open, onClose, onConfirm, title, message, confirmText, cancelText, variant = "danger", loading = false }) {
  const { t } = useLang()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.65)] backdrop-blur-[6px] animate-fadeUp" onClick={onClose} />
      <div className="relative w-full max-w-[420px] bg-surface border border-line rounded-[28px] p-7 shadow-deep animate-fadeUp overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ background: 'radial-gradient(600px circle at 50% 0%, var(--gold), transparent 70%)' }} />
        <div className="flex flex-col items-center text-center">
          <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-4 animate-orbBreathe" style={{ background: variant === 'danger' ? 'rgba(229,83,61,0.12)' : 'rgba(232,169,59,0.15)', border: `1.5px solid ${variant === 'danger' ? 'var(--maroon)' : 'var(--gold)'}` }}>
            <Logo size={36} withWordmark={false} />
          </div>
          <h3 className="font-display text-[22px] leading-tight">{title}</h3>
          <p className="text-ink-dim text-[13.5px] mt-2 leading-relaxed">{message}</p>
          <div className="flex gap-3 w-full mt-6">
            <button onClick={onClose} disabled={loading} className="flex-1 py-3.5 rounded-full border-[1.5px] border-line text-ink font-bold text-[13.5px] bg-surface-2 hover:border-[var(--gold)] hover:text-gold transition-all disabled:opacity-50 active:scale-[0.98]">
              {cancelText || t('pop_no')}
            </button>
            <button onClick={onConfirm} disabled={loading} className={`flex-1 py-3.5 rounded-full font-bold text-[13.5px] text-[#1A1206] shadow-[0_10px_22px_-10px_rgba(232,169,59,.5)] hover:-translate-y-0.5 transition-all disabled:opacity-50 active:scale-[0.98] ${variant === 'danger' ? 'bg-[linear-gradient(135deg,var(--maroon),#9f2a1f)] text-white' : 'bg-[linear-gradient(135deg,var(--gold),var(--gold-deep))]'}`}>
              {loading ? t('pop_busy') : (confirmText || t('pop_yes'))}
            </button>
          </div>
          <p className="text-[11px] text-ink-dim mt-3">{t('pop_theme_pfx')}<span className="font-mono text-gold">{document.documentElement.classList.contains('light') ? t('pop_light') : t('pop_dark')}</span></p>
        </div>
      </div>
    </div>
  )
}
