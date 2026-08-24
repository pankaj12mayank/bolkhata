export default function AILoader({ text = "AI soch raha hai...", subtext = "Hinglish • Hindi • English" }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative w-[120px] h-[120px] flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-[var(--line)] animate-pulseRing" />
        <div className="absolute inset-[10px] rounded-full border border-[var(--gold)] opacity-20 animate-pulseRing" style={{ animationDelay: '0.4s' }} />
        <div className="absolute inset-[22px] rounded-full border border-[var(--gold)] opacity-30 animate-pulseRing" style={{ animationDelay: '0.8s' }} />
        <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center animate-orbBreathe shadow-soft" style={{ background: 'radial-gradient(circle at 35% 30%, var(--gold), var(--gold-deep) 75%)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2a2.5 2.5 0 0 0-2.5 2.5v2A2.5 2.5 0 0 0 12 9a2.5 2.5 0 0 0 2.5-2.5v-2A2.5 2.5 0 0 0 12 2z" fill="#1A1206" /><path d="M7 8.5a5 5 0 0 0 10 0" stroke="#1A1206" strokeWidth="1.6" strokeLinecap="round" fill="none" /><circle cx="12" cy="14.5" r="1.2" fill="#1A1206" /></svg>
        </div>
      </div>
      <div className="mt-5 text-center">
        <p className="font-bold text-[14.5px] flex items-center gap-2 justify-center">
          <span className="w-2 h-2 rounded-full bg-gold animate-blink" />
          {text}
        </p>
        <p className="font-mono text-[11px] tracking-wide text-ink-dim uppercase mt-1">{subtext}</p>
        <div className="flex items-center justify-center gap-1 mt-3 h-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="w-[3px] bg-gold rounded-full animate-wave" style={{ height: '8px', animationDelay: `${i * 0.08}s`, animationDuration: '0.9s' }} />
          ))}
        </div>
      </div>
    </div>
  )
}
