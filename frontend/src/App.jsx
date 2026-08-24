import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ShopDataProvider } from './context/ShopDataContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import PageLoader from './components/PageLoader'

import Landing from './pages/Landing'
import LoginGateway from './pages/LoginGateway'
import DukaandaarLogin from './pages/DukaandaarLogin'
import AdminLogin from './pages/AdminLogin'
import Onboarding from './pages/Onboarding'

import UserLayout from './layouts/UserLayout'
import Home from './pages/user/Home'
import NewEntry from './pages/user/NewEntry'
import CustomerList from './pages/user/CustomerList'
import CustomerDetail from './pages/user/CustomerDetail'
import Billing from './pages/user/Billing'
import Profile from './pages/user/Profile'

import AdminLayout from './layouts/AdminLayout'
import Overview from './pages/admin/Overview'
import Shops from './pages/admin/Shops'
import ShopDetail from './pages/admin/ShopDetail'
import Subscriptions from './pages/admin/Subscriptions'
import Logs from './pages/admin/Logs'
import Settings from './pages/admin/Settings'

function ScrollToTop() {
  const loc = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [loc.pathname])
  return null
}
function AppRoutes() {
  const loc = useLocation()
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 180)
    return () => clearTimeout(t)
  }, [loc.pathname])
  return (
    <>
      <ScrollToTop />
      {loading && <PageLoader fullScreen />}
      <div className="page-enter" key={loc.pathname}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginGateway />} />
          <Route path="/login/dukaandaar" element={<DukaandaarLogin />} />
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/app" element={<ProtectedRoute role="user"><UserLayout /></ProtectedRoute>}>
            <Route index element={<Home />} />
            <Route path="entry" element={<NewEntry />} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="billing" element={<Billing />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Overview />} />
            <Route path="shops" element={<Shops />} />
            <Route path="shops/:id" element={<ShopDetail />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="logs" element={<Logs />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center"><h1 className="font-display text-3xl mb-2">Page nahi mila</h1><p className="text-ink-dim mb-4">Galat URL hai. Home par wapas jayein.</p><a href="/" className="text-gold font-bold">← Home</a></div>} />
        </Routes>
      </div>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ShopDataProvider>
            <AppRoutes />
          </ShopDataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
