import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { useAuth } from '../context/AuthContext'
import { useShopData } from '../context/ShopDataContext'

const Icon = ({ d }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>

const navGroups = [
  { label: 'Dukaan', items: [
    { to: '/app', end: true, label: 'Home', icon: <Icon d={<><path d="M3 11l9-7 9 7" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></>} /> },
    { to: '/app/entry', label: 'Naya Entry', icon: <Icon d={<><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" /><path d="M6 11v1a6 6 0 0 0 12 0v-1M12 18v3" /></>} /> },
    { to: '/app/customers', label: 'Grahak List', icon: <Icon d={<><circle cx="9" cy="8" r="3.4" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /></>} /> },
  ]},
  { label: 'Khata', items: [
    { to: '/app/billing', label: 'Plan & Billing', icon: <Icon d={<><rect x="3" y="6" width="18" height="13" rx="2.4" /><path d="M3 10h18" /></>} /> },
    { to: '/app/profile', label: 'Profile', icon: <Icon d={<><circle cx="12" cy="8" r="3.6" /><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" /></>} /> },
  ]},
]

const bottomNav = [
  { to: '/app', end: true, label: 'Home', icon: <Icon d={<><path d="M3 11l9-7 9 7" /><path d="M5 10v9h14v-9" /></>} /> },
  { to: '/app/customers', label: 'Grahak', icon: <Icon d={<><circle cx="9" cy="8" r="3.4" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /></>} /> },
  { to: '/app/entry', label: 'mic', mic: true },
  { to: '/app/billing', label: 'Plan', icon: <Icon d={<><rect x="3" y="6" width="18" height="13" rx="2.4" /><path d="M3 10h18" /></>} /> },
  { to: '/app/profile', label: 'Profile', icon: <Icon d={<><circle cx="12" cy="8" r="3.6" /><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" /></>} /> },
]

export default function UserLayout() {
  const [open, setOpen] = useState(false)
  const { shopProfile, logout } = useAuth()
  const { refreshAll, reset } = useShopData()
  const navigate = useNavigate()

  useEffect(() => { refreshAll().catch(() => {}) }, [refreshAll])

  const doLogout = () => {
    reset()
    logout()
    navigate('/login')
  }

  const owner = shopProfile?.ownerName || 'Dukaandaar'
  const shop = shopProfile?.shopName || 'Meri Dukaan'

  return (
    <div className="min-h-screen flex bg-app text-ink" data-mode="user">
      <div className="grain" />
      <Sidebar
        roleLabel="Dukaandaar Panel"
        navGroups={navGroups}
        profileName={owner}
        profileSub={shop}
        onLogout={doLogout}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
      <main className="flex-1 min-w-0">
        <Topbar onMenuClick={() => setOpen(true)} profileName={owner} showSearch={false} />
        <div className="px-4 sm:px-7 py-7 pb-28 lg:pb-16">
          <Outlet />
        </div>
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] backdrop-blur-md border-t border-line px-1.5 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]" style={{ background: 'color-mix(in srgb, var(--bg) 92%, transparent)' }}>
        <div className="flex justify-around">
          {bottomNav.map(item => item.mic ? (
            <NavLink key={item.to} to={item.to} className="w-[52px] h-[52px] rounded-full flex items-center justify-center -mt-6 shadow-[0_10px_22px_-8px_rgba(232,169,59,.6)]"
              style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-deep))' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" fill="#1A1206" /><path d="M6 11v1a6 6 0 0 0 12 0v-1M12 18v3" stroke="#1A1206" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </NavLink>
          ) : (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `flex flex-col items-center gap-1 text-[10.5px] font-bold px-2.5 py-1 ${isActive ? 'text-gold' : 'text-ink-dim'}`}>
              {item.icon}{item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}