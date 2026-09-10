import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../context/LangContext'

const Icon = ({ d }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>

const navGroups = [
  { label: 'Business', items: [
    { to: '/admin', end: true, label: 'Overview', icon: <Icon d={<><rect x="3" y="3" width="7.5" height="7.5" rx="1.6" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" /></>} /> },
    { to: '/admin/shops', label: 'Shops', icon: <Icon d={<><path d="M4 10l1-6h14l1 6" /><path d="M5 10v9h14v-9" /></>} /> },
    { to: '/admin/subscriptions', label: 'Subscriptions', icon: <Icon d={<><rect x="3" y="6" width="18" height="13" rx="2.4" /><path d="M3 10h18M7 15h4" /></>} /> },
    { to: '/admin/plans', label: 'Plans', icon: <Icon d={<><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h20" /></>} /> },
  ]},
  { label: 'System', items: [
    { to: '/admin/logs', label: 'Entries & Logs', icon: <Icon d={<><path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M9 12h6M9 16h6M9 8h3" /></>} /> },
    { to: '/admin/settings', label: 'Settings', icon: <Icon d={<><circle cx="12" cy="12" r="3" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.42 1.42M2 12h2M20 12h2M6.34 17.66l-1.42 1.42M19.07 4.93l-1.42 1.42" /></>} /> },
    { to: '/admin/payments', label: 'Payments', icon: <Icon d={<><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h20" /></>} /> },
    { to: '/admin/configuration', label: 'Configuration', icon: <Icon d={<><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>} /> },
    { to: '/admin/profile', label: 'My Profile', icon: <Icon d={<><circle cx="12" cy="7.5" r="3.5" /><path d="M5.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" /></>} /> },
  ]},
]

export default function AdminLayout() {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { logout } = useAuth()
  const { showToast } = useToast()
  const { t } = useLang()
  const navigate = useNavigate()

  const doLogout = () => {
    logout()
    navigate('/login')
    showToast('toast_logged_out')
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950" data-mode="admin">
      <Sidebar
        roleLabel={t('role_admin_panel')}
        navGroups={navGroups}
        profileName="Admin"
        profileSub={t('admin_hq')}
        onLogout={doLogout}
        isOpen={open}
        onClose={() => setOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(v=>!v)}
      />
      <main className="flex-1 min-w-0">
        <Topbar onMenuClick={() => setOpen(true)} profileName="Admin" showSearch={false} />
        <div className="w-full px-4 sm:px-7 py-7 pb-16">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
