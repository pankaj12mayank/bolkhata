import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { useShopData } from './ShopDataContext'
import { api } from '../lib/api'
import { fmt } from '../lib/format'

const NotificationsContext = createContext(null)
const READ_KEY = 'bolkhata_notif_read_v1'

function loadRead() {
  try { const v = JSON.parse(localStorage.getItem(READ_KEY) || '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
function saveRead(list) {
  try { localStorage.setItem(READ_KEY, JSON.stringify(list)) } catch {}
}

export function NotificationsProvider({ children }) {
  const { role } = useAuth()
  const { customers, plan, pendingSync } = useShopData()
  const [readIds, setReadIds] = useState(loadRead)
  const [adminFeed, setAdminFeed] = useState(null)

  useEffect(() => {
    if (role !== 'admin') { setAdminFeed(null); return }
    let dead = false
    const load = async () => {
      try {
        const [ov, subs] = await Promise.all([
          api.adminOverview(),
          api.adminSubscriptions('Pending'),
        ])
        if (!dead) setAdminFeed({ total_shops: ov.total_shops, active_shops: ov.active_shops, pending_subs: Array.isArray(subs) ? subs.length : 0 })
      } catch {}
    }
    load()
    const iv = setInterval(load, 45000)
    return () => { dead = true; clearInterval(iv) }
  }, [role])

  const items = useMemo(() => {
    const arr = []
    if (role === 'user') {
      const limit = plan?.limit || 100
      const used = plan?.used || 0
      if (plan && (plan.tier === 'Free' || plan.tier === 'Standard') && limit > 0 && used / limit >= 0.8) {
        arr.push({ id: 'u_plan', kind: 'warn', key: 'notif_plan_limit', params: { plan: plan.tier, used, limit }, to: '/app/billing' })
      }
      const top = [...customers].sort((a, b) => b.balance - a.balance).filter(c => c.balance > 0).slice(0, 3)
      top.forEach(c => arr.push({ id: `u_due_${c.id}`, kind: 'due', key: 'notif_due', params: { name: c.name, amount: fmt(c.balance) }, to: `/app/customers/${c.id}` }))
      if (pendingSync > 0) {
        arr.push({ id: 'u_offline', kind: 'info', key: 'notif_offline_sync', params: { n: pendingSync }, to: null })
      }
    } else if (role === 'admin' && adminFeed) {
      if (adminFeed.pending_subs > 0) {
        arr.push({ id: 'a_subs', kind: 'due', key: 'notif_admin_pending_subs', params: { n: adminFeed.pending_subs }, to: '/admin/subscriptions' })
      }
      arr.push({ id: 'a_shops', kind: 'info', key: 'notif_admin_shops', params: { n: adminFeed.active_shops }, to: '/admin/shops' })
    }
    return arr
  }, [role, customers, plan, pendingSync, adminFeed])

  const unreadCount = items.filter(n => !readIds.includes(n.id)).length

  const markRead = useCallback((id) => {
    setReadIds(prev => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      saveRead(next)
      return next
    })
  }, [])
  const markAllRead = useCallback(() => {
    const ids = items.map(n => n.id)
    setReadIds(prev => {
      const next = Array.from(new Set([...prev, ...ids]))
      saveRead(next)
      return next
    })
  }, [items])

  return (
    <NotificationsContext.Provider value={{ items, unreadCount, readIds, markRead, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  )
}
export const useNotifications = () => useContext(NotificationsContext)