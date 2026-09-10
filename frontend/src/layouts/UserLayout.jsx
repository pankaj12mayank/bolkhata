import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import OfflineBadge from '../components/OfflineBadge'
import { useAuth } from '../context/AuthContext'
import { useShopData } from '../context/ShopDataContext'
import { useLang } from '../context/LangContext'

const navGroups = [
  { label: 'Dukaan', items: [
    { to: '/app', end: true, label: 'Home' },
    { to: '/app/entry', label: 'Naya Entry' },
    { to: '/app/customers', label: 'Grahak List' },
    { to: '/app/cash', label: 'Cash Counter' },
  ]},
  { label: 'Khata', items: [
    { to: '/app/billing', label: 'Plan & Billing' },
    { to: '/app/profile', label: 'Profile' },
  ]},
]

const bottomNav = [
  { to: '/app', end: true, label: 'Home', k: 'nav_home' },
  { to: '/app/customers', label: 'Grahak', k: 'nav_customers' },
  { to: '/app/entry', label: 'mic', k: '', mic: true },
  { to: '/app/cash', label: 'Cash', k: 'nav_cash' },
  { to: '/app/billing', label: 'Plan', k: 'nav_billing' },
]

export default function UserLayout() {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { shopProfile, logout } = useAuth()
  const { refreshAll, reset } = useShopData()
  const { t } = useLang()
  const navigate = useNavigate()

  useEffect(() => { refreshAll().catch(() => {}) }, [refreshAll])

  const doLogout = () => {
    reset()
    logout()
    navigate('/login')
  }

  const owner = shopProfile?.ownerName || t('common_owner')
  const shop = shopProfile?.shopName || t('common_shop')

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950" data-mode="user">
      <Sidebar
        roleLabel={t('role_user_panel')}
        navGroups={navGroups}
        profileName={owner}
        profileSub={shop}
        onLogout={doLogout}
        isOpen={open}
        onClose={() => setOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(v=>!v)}
      />
      <main className="flex-1 min-w-0">
        <Topbar onMenuClick={() => setOpen(true)} profileName={owner} showSearch={false} />
        <div className="w-full px-4 sm:px-7 py-7 pb-28 lg:pb-8">
          <Outlet />
        </div>
      </main>

      <OfflineBadge />
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div className="flex justify-around">
          {bottomNav.map(item => item.mic ? (
            <NavLink key={item.to} to={item.to} className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center -mt-5 shadow-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" fill="white" /><path d="M6 10v1a6 6 0 0 0 12 0v-1M12 17v3" stroke="white" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </NavLink>
          ) : (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `flex flex-col items-center gap-1 text-[11px] font-medium px-3 py-1 ${isActive ? 'text-amber-600' : 'text-slate-500'}`}>
              <span className="text-[11px]">{item.k ? t(item.k) : item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}