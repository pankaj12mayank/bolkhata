import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import StatCard from '../../components/StatCard'
import Badge from '../../components/Badge'
import { api } from '../../lib/api'
import { initials } from '../../lib/format'
import { useLang } from '../../context/LangContext'

const Icon = ({ d }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>

function Chart({ data }) {
  const { t } = useLang()
  if (!data || data.length === 0) return <div className="text-ink-dim py-8 text-center text-sm">{t('common_loading')}</div>
  const max = Math.max(...data.map(d => Math.max(d.entries, d.payments)), 1)
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  return (
    <div className="flex items-end gap-2 sm:gap-3 h-44 pt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
          <div className="flex items-end justify-center gap-1 flex-1 w-full">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(3, (d.entries / max) * 100)}%` }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
              title={`${d.entries} entries`}
              className="w-[42%] max-w-[22px] rounded-t-md bg-gradient-to-t from-[var(--gold-deep)] to-[var(--gold)]"
            />
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(3, (d.payments / max) * 100)}%` }}
              transition={{ delay: i * 0.09, duration: 0.5, ease: 'easeOut' }}
              title={`${d.payments} payments`}
              className="w-[42%] max-w-[22px] rounded-t-md bg-slate-900 opacity-70 dark:bg-white/70"
            />
          </div>
          <span className="font-mono text-[10px] text-ink-dim">{days[i]}</span>
        </div>
      ))}
    </div>
  )
}

export default function Overview() {
  const [stats, setStats] = useState(null)
  const [chart, setChart] = useState([])
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { t, tl } = useLang()

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const [ov, sh, ch] = await Promise.all([api.adminOverview(), api.adminShops(), api.adminOverviewChart()])
        if (!alive) return
        setStats(ov)
        setShops(sh)
        setChart(ch || [])
      } catch (e) {
        if (!alive) return
        setError(tl(e.message) || t('common_load_fail'))
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    const id = setInterval(load, 45000)
    return () => { alive = false; clearInterval(id) }
  }, [t, tl])

  if (loading) return <div className="text-ink-dim py-16 text-center">{t('common_loading')}</div>
  if (error) return <div className="text-maroon py-16 text-center">{t('common_load_fail')} — {error}</div>

  const statCards = [
    { value: stats.total_shops, label: t('ov_stat_total'), icon: <Icon d={<><path d="M4 10l1-6h14l1 6" /><path d="M5 10v9h14v-9" /></>} /> },
    { value: stats.active_shops, label: t('ov_stat_active'), icon: <Icon d={<><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></>} /> },
    { value: `₹${stats.mrr.toLocaleString('en-IN')}`, label: t('ov_mrr'), icon: <Icon d={<><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>} /> },
    { value: stats.entries_today, label: t('ov_stat_entries'), icon: <Icon d={<><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" /></>} /> },
    { value: `${stats.parse_success_pct}%`, label: t('ov_stat_parse'), icon: <Icon d={<><path d="M20 6L9 17l-5-5" /></>} /> },
    { value: `${stats.conversion_pct}%`, label: t('ov_stat_conv'), icon: <Icon d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>} /> },
  ]

  return (
    <div className="w-full">
      <div className="flex items-center justify-end gap-2 mb-6">
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="hidden sm:inline text-[11px] font-mono text-ink-dim flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] animate-pulse" />auto-refresh</motion.span>
        <Badge tone="green"><span className="inline-block w-2 h-2 rounded-full bg-green animate-pulse mr-1.5" />{t('ov_all_ok')}</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-7" style={{ perspective: 1000 }}>
        {statCards.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' }}
            whileHover={{ y: -4, rotateX: 2.5, rotateY: -2.5 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <StatCard value={c.value} label={c.label} icon={<div style={{ transform: 'translateZ(18px)' }}>{c.icon}</div>} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 sm:gap-5 mb-6">
        <div className="bg-surface border border-line rounded-3xl p-4 sm:p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-[16px] sm:text-[16.5px]">{t('ov_chart_title')}</h3>
            <div className="flex items-center gap-4 text-[11px] font-mono text-ink-dim">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--gold)' }} />{t('ov_chart_entries_lbl')}</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-900 dark:bg-white/70" />{t('ov_chart_pay_lbl')}</span>
            </div>
          </div>
          <Chart data={chart} />
        </div>

        <div className="bg-surface border border-line rounded-3xl p-4 sm:p-6 shadow-soft">
          <h3 className="font-extrabold text-[16px] sm:text-[16.5px] mb-4">{t('ov_all_shops')}</h3>
          {shops.slice(0, 6).map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between py-2.5 border-b border-line last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm text-[#1A1206] shadow-md" style={{ background: 'linear-gradient(145deg,var(--gold),var(--gold-deep))' }}>{initials(s.shop_name)}</div>
                <div><b className="block text-sm">{s.shop_name}</b><span className="text-xs text-ink-dim">{s.owner_name}</span></div>
              </div>
              <Badge tone={s.plan_tier === 'Paid' ? 'green' : 'gold'}>{s.plan_tier}</Badge>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}