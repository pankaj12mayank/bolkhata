import Logo from './Logo'

export default function PageLoader({ fullScreen = false }) {
  return (
    <div className={`${fullScreen ? 'fixed inset-0 z-[250] flex items-center justify-center' : 'py-16 flex items-center justify-center'} `} style={fullScreen ? { background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(10px)' } : {}}>
      <div className="relative" style={{ perspective: '900px' }}>
        <div className="absolute inset-0 -z-10 rounded-[28px] blur-[22px] opacity-35" style={{ background: 'radial-gradient(380px circle at 50% 50%, var(--gold) 0%, transparent 72%)' }} />
        <div className="relative w-[88px] h-[88px] sm:w-[96px] sm:h-[96px] rounded-[24px] flex items-center justify-center shadow-deep animate-floatBook" style={{ background: 'linear-gradient(145deg, var(--surface-2), var(--surface))', border: '1.2px solid var(--line)', transformStyle: 'preserve-3d' }}>
          <div className="animate-orbBreathe">
            <Logo size={44} withWordmark={false} />
          </div>
        </div>
      </div>
    </div>
  )
}
