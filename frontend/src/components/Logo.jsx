export default function Logo({ size = 30, withWordmark = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="60" height="60" rx="16" fill="#241D2E" stroke="#E8A93B" strokeOpacity="0.18" strokeWidth="1.2"/>
        <circle cx="32" cy="32" r="18" fill="#2C2438" stroke="#E8A93B" strokeOpacity="0.12" />
        {/* Mic body - gold with depth */}
        <path d="M32 17.5a6 6 0 0 1 6 6v7a6 6 0 0 1-12 0v-7a6 6 0 0 1 6-6z" fill="#E8A93B"/>
        <path d="M32 18.5a5 5 0 0 1 5 5v6a5 5 0 0 1-10 0v-6a5 5 0 0 1 5-5z" fill="#F0C369" opacity="0.95"/>
        <path d="M30.5 19.5a1.8 1.8 0 0 1 1.8-1.8" stroke="white" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round"/>
        {/* Mic stand */}
        <path d="M23.5 31.5v1.2a8.5 8.5 0 0 0 17 0v-1.2" stroke="#E5533D" strokeWidth="2.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M32 40v5.5" stroke="#E5533D" strokeWidth="2.3" strokeLinecap="round"/>
        <path d="M28.5 45.5h7" stroke="#E5533D" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
      {withWordmark && (
        <span className="font-display text-xl tracking-tight" style={{ color: 'var(--ink)' }}>
          Bol<span style={{ color: 'var(--gold)' }}>Khata</span>
        </span>
      )}
    </div>
  )
}
