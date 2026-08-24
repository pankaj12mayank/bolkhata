import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const Icon = ({ d }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>

const navGroups = [
  { label: 'Business', items: [
    { to: '/admin', end: true, label: 'Overview', icon: <Icon d={<><rect x="3" y="3" width="7.5" height="7.5" rx="1.6" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" /></>} /> },
    { to: '/admin/shops', label: 'Shops', icon: <Icon d={<><path d="M4 10l1-6h14l1 6" /><path d="M5 10v9h14v-9" /></>} /> },
    { to: '/admin/subscriptions', label: 'Subscriptions', icon: <Icon d={<><rect x="3" y="6" width="18" height="13" rx="2.4" /><path d="M3 10h18M7 15h4" /></>} /> },
  ]},
  { label: 'System', items: [
    { to: '/admin/logs', label: 'Entries & Logs', icon: <Icon d={<><path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M9 12h6M9 16h6M9 8h3" /></>} /> },
    { to: '/admin/settings', label: 'Settings', icon: <Icon d={<><circle cx="12" cy="12" r="3" /></>} /> },
  ]},
]

export default function AdminLayout() {
  const [open, setOpen] = useState(false)
  const { logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const doLogout = () => {
    logout()
    navigate('/login')
    showToast('Aap logout ho gaye')
  }

  return (
    <div className="min-h-screen flex bg-app text-ink" data-mode="admin">
      <div className="grain" />
      <Sidebar
        roleLabel="Admin Panel"
        navGroups={navGroups}
        profileName="Admin"
        profileSub="BolKhata HQ"
        onLogout={doLogout}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
      <main className="flex-1 min-w-0">
        <Topbar onMenuClick={() => setOpen(true)} profileName="Admin" showSearch={false} />
        <div className="px-4 sm:px-7 py-7 pb-16">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
