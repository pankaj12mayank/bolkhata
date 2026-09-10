export default function Logo({ size = 28, withWordmark = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div style={{ width: size, height: size }} className="rounded-xl bg-slate-900 dark:bg-amber-500 flex items-center justify-center shadow-sm flex-shrink-0">
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
          <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" fill="white" className="dark:fill-slate-900" />
          <path d="M6 10v1a6 6 0 0 0 12 0v-1M12 17v3" stroke="white" className="dark:stroke-slate-900" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      {withWordmark && (
        <span className="font-semibold text-[18px] tracking-tight text-slate-900 dark:text-white">
          Bol<span className="text-amber-600 dark:text-amber-400">Khata</span>
        </span>
      )}
    </div>
  )
}
