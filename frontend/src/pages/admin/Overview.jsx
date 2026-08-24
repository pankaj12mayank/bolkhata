import { useEffect, useState } from 'react'
import StatCard from '../../components/StatCard'
import Badge from '../../components/Badge'
import { api } from '../../lib/api'
import { initials } from '../../lib/format'

const Icon = ({ d }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>

export default function Overview() {
  const [stats, setStats] = useState(null)
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [ov, sh] = await Promise.all([api.adminOverview(), api.adminShops()])
        setStats(ov)
        setShops(sh)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div className="text-ink-dim py-16 text-center">Loading...</div>

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="font-display font-normal text-[26px] sm:text-[28px]">Admin Overview</h1>
          <p className="text-ink-dim text-[13px] sm:text-[14.5px] mt-1">Complete health check of the BolKhata platform — live from database.</p>
        </div>
        <Badge tone="green"><span className="inline-block w-2 h-2 rounded-full bg-green mr-1.5" />All systems normal</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-7">
        <StatCard value={stats.total_shops} label="Total Shops" icon={<Icon d={<><path d="M4 10l1-6h14l1 6" /><path d="M5 10v9h14v-9" /></>} />} />
        <StatCard value={stats.active_shops} label="Active Shops" icon={<Icon d={<><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></>} />} />
        <StatCard value={`₹${stats.mrr.toLocaleString('en-IN')}`} label="MRR" icon={<Icon d={<><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>} />} />
        <StatCard value={stats.entries_today} label="Voice entries today" icon={<Icon d={<><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" /></>} />} />
        <StatCard value={`${stats.parse_success_pct}%`} label="Voice parse success" icon={<Icon d={<><path d="M20 6L9 17l-5-5" /></>} />} />
        <StatCard value={`${stats.conversion_pct}%`} label="Free → Paid conversion" icon={<Icon d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>} />} />
      </div>

      <div className="bg-surface border border-line rounded-3xl p-4 sm:p-6">
        <h3 className="font-extrabold text-[16px] sm:text-[16.5px] mb-4">All Shops</h3>
        {shops.slice(0, 6).map((s, i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-line last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm text-[#1A1206]" style={{ background: 'linear-gradient(145deg,var(--gold),var(--gold-deep))' }}>{initials(s.shop_name)}</div>
              <div><b className="block text-sm">{s.shop_name}</b><span className="text-xs text-ink-dim">{s.owner_name}</span></div>
            </div>
            <Badge tone={s.plan_tier === 'Paid' ? 'green' : 'gold'}>{s.plan_tier}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
