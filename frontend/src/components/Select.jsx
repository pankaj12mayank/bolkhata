import { ChevronDown } from 'lucide-react'

export default function Select({ className = '', children, ...props }) {
  return (
    <div className={`relative ${className}`}>
      <select
        {...props}
        className="w-full appearance-none px-3.5 py-3 pr-9 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] font-normal outline-none focus:border-[var(--gold)] cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none" />
    </div>
  )
}