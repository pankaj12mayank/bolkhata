import { NavLink } from 'react-router-dom'
import Logo from './Logo'
import { initials } from '../lib/format'

export default function Sidebar({ roleLabel, navGroups, profileName, profileSub, onLogout, isOpen, onClose }) {
  return (
    <>
      <aside className={`w-[264px] flex-shrink-0 bg-surface border-r border-line p-5 flex flex-col gap-4
        fixed lg:sticky top-0 h-screen z-[80] transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between">
          <Logo />
          <button onClick={onClose} className="lg:hidden text-xl text-ink-dim">✕</button>
        </div>

        <div className="text-center py-2.5 rounded-xl bg-surface-2 border border-line text-[11.5px] font-extrabold text-gold uppercase tracking-wide">
          {roleLabel}
        </div>

        <nav className="flex flex-col gap-1">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && <div className="font-mono text-[10.5px] tracking-widest uppercase text-ink-dim opacity-60 mt-2.5 mb-0.5 ml-1">{group.label}</div>}
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 w-full text-left ${
                      isActive ? 'text-gold shadow-[inset_0_0_0_1px_var(--line)]' : 'text-ink-dim hover:bg-surface-2 hover:text-ink'
                    }`
                  }
                  style={({ isActive }) => isActive ? { background: 'linear-gradient(135deg, color-mix(in srgb,var(--gold) 22%, transparent), color-mix(in srgb,var(--gold) 8%, transparent))' } : {}}
                >
                  {item.icon}{item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 pt-3.5 border-t border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-[13px] text-[#1A1206] flex-shrink-0"
              style={{ background: 'linear-gradient(145deg,var(--gold),var(--gold-deep))' }}>{initials(profileName)}</div>
            <div><b className="block text-[13.5px]">{profileName}</b><span className="text-[11.5px] text-ink-dim">{profileSub}</span></div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2.5 text-[13px] font-bold text-ink-dim px-3 py-2.5 rounded-lg hover:bg-[rgba(229,83,61,.12)] hover:text-maroon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>
            Logout
          </button>
        </div>
      </aside>
      {isOpen && <div onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[70] lg:hidden" />}
    </>
  )
}
