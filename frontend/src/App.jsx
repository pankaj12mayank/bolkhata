import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'sonner'
import { ThemeProvider } from './context/ThemeContext'
import { LangProvider } from './context/LangContext'
import { AuthProvider } from './context/AuthContext'
import { ShopDataProvider } from './context/ShopDataContext'
import { ToastProvider } from './context/ToastContext'
import { NotificationsProvider } from './context/NotificationsContext'
import ProtectedRoute from './components/ProtectedRoute'
import PageLoader from './components/PageLoader'
import { TopProgress } from './components/GlobalLoader'
import { useLang } from './context/LangContext'

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
import CashCounter from './pages/user/CashCounter'

import AdminLayout from './layouts/AdminLayout'
import Overview from './pages/admin/Overview'
import Shops from './pages/admin/Shops'
import ShopDetail from './pages/admin/ShopDetail'
import Subscriptions from './pages/admin/Subscriptions'
import Logs from './pages/admin/Logs'
import Settings from './pages/admin/Settings'
import Configuration from './pages/admin/Configuration'
import AdminProfile from './pages/admin/AdminProfile'
import Plans from './pages/admin/Plans'
import Payments from './pages/admin/Payments'

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
    const t = setTimeout(() => setLoading(false), 220)
    return () => clearTimeout(t)
  }, [loc.pathname])
  return (
    <>
      <ScrollToTop />
      <TopProgress loading={loading} />
      {loading && <PageLoader fullScreen />}
      <AnimatePresence mode="wait">
        <motion.div key={loc.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24, ease: [0.16,1,0.3,1] }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginGateway />} />
          <Route path="/login/dukaandaar" element={<DukaandaarLogin />} />
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/bolkhata" element={<AdminLogin />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/app" element={<ProtectedRoute role="user"><UserLayout /></ProtectedRoute>}>
            <Route index element={<Home />} />
            <Route path="entry" element={<NewEntry />} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="cash" element={<CashCounter />} />
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
            <Route path="configuration" element={<Configuration />} />
            <Route path="plans" element={<Plans />} />
            <Route path="payments" element={<Payments />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  )
}

function NotFound() {
  const { t } = useLang()
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-3xl font-bold mb-2">{t('p404_t')}</h1>
      <p className="text-slate-500 mb-4">{t('p404_sub')}</p>
      <a href="/" className="text-amber-600 font-semibold">{t('back_home')}</a>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <ToastProvider>
          <AuthProvider>
            <ShopDataProvider>
              <NotificationsProvider>
                <AppRoutes />
                <Toaster position="bottom-right" richColors closeButton toastOptions={{ duration: 3000, style: { borderRadius: '12px' } }} />
              </NotificationsProvider>
            </ShopDataProvider>
          </AuthProvider>
        </ToastProvider>
      </LangProvider>
    </ThemeProvider>
  )
}
