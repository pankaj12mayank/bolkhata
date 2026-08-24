import { useState } from 'react'
import ThemeToggle from './ThemeToggle'
import { initials } from '../lib/format'

const notifications = [
  { tone: 'maroon', title: 'Ramesh Kumar ka udhaar 15 din se baaki', sub: 'Reminder bhejne ka samay ho gaya' },
  { tone: 'gold', title: '7 entries baaki hai is mahine', sub: 'Free plan limit paas aa rahi hai' },
  { tone: 'green', title: 'Sunita Devi ne ₹150 vaapas kiye', sub: 'Aaj 9:20 AM' },
]

export default function Topbar({ onMenuClick, showSearch = true, searchValue, onSearchChange, profileName }) {
  const [notifOpen, setNotifOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 px-7 py-4 backdrop-blur-md border-b border-line" style={{ background: 'color-mix(in srgb, var(--bg) 80%, transparent)' }}>
      <button onClick={onMenuClick} className="lg:hidden text-xl">☰</button>
      {showSearch && (
        <div className="flex-1 max-w-[420px] hidden sm:flex items-center gap-2.5 bg-surface-2 border border-line rounded-full px-4 py-2.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-ink-dim"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input value={searchValue} onChange={e => onSearchChange?.(e.target.value)} placeholder="Dhoondhein..." className="flex-1 bg-transparent outline-none text-sm text-ink" />
        </div>
      )}
      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <div className="relative">
          <button onClick={() => setNotifOpen(o => !o)} className="w-[38px] h-[38px] rounded-full bg-surface-2 border border-line flex items-center justify-center relative">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
            <span className="absolute top-[7px] right-2 w-[7px] h-[7px] rounded-full bg-maroon" />
          </button>
          {notifOpen && (
            <>
              <div onClick={() => setNotifOpen(false)} className="fixed inset-0 z-[90]" />
              <div className="absolute top-12 right-0 w-[300px] bg-surface border border-line rounded-2xl shadow-deep p-2.5 z-[100]">
                <div className="text-xs font-extrabold text-ink-dim uppercase tracking-wide px-2.5 py-2">Notifications</div>
                {notifications.map((n, i) => (
                  <div key={i} className="p-2.5 rounded-lg text-[13px] flex gap-2.5 items-start hover:bg-surface-2">
                    <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: `var(--${n.tone === 'maroon' ? 'maroon' : n.tone === 'gold' ? 'gold' : 'green'})` }} />
                    <div><b className="block text-[13px]">{n.title}</b><span className="text-ink-dim text-[11.5px]">{n.sub}</span></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-[13px] text-[#1A1206]" style={{ background: 'linear-gradient(145deg,var(--gold),var(--gold-deep))' }}>
          {initials(profileName || 'User')}
        </div>
      </div>
    </header>
  )
}
