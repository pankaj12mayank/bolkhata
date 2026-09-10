import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Wallet, Users, Mic, Bell, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useShopData } from '../../context/ShopDataContext'
import { fmt, initials } from '../../lib/format'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Card from '../../components/Card'
import { SkeletonCard } from '../../components/Skeleton'
import { api } from '../../lib/api'
import { useLang } from '../../context/LangContext'

function useCountUp(target, duration = 700) {
  const [val, setVal] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    if (typeof target !== 'number') { setVal(target ?? 0); return }
    const from = prev.current
    prev.current = target
    let raf
    const start = performance.now()
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration)
      setVal(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}

function Stat({ icon: Icon, value, label, accent }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const n = useCountUp(typeof value === 'number' && inView ? value : (typeof value === 'string' ? value : 0))
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14, rotateX: 18 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      whileHover={{ y: -4, rotateX: 3, rotateY: -3 }}
      style={{ perspective: 700 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-soft hover:shadow-medium transition-shadow relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <Icon size={16} />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${accent}`}>live</span>
      </div>
      <div className="text-2xl font-bold tracking-tight">
        {typeof value === 'number' ? n.toLocaleString('en-IN') : value}
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-amber-400/10 blur-xl" />
    </motion.div>
  )
}

function WeekChart({ data }) {
  const { t } = useLang()
  if (!data || data.length === 0) return <div className="text-slate-500 py-8 text-center text-sm">{t('common_loading')}</div>
  const max = Math.max(...data.map(d => Math.max(d.given, d.received)), 1)
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  return (
    <div className="flex items-end gap-2 sm:gap-3 h-36 pt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
          <div className="flex items-end justify-center gap-1 flex-1 w-full">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(3, (d.given / max) * 100)}%` }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
              title={`${t('home_chart_given')} ₹${d.given}`}
              className="w-[42%] max-w-[20px] rounded-t-md bg-gradient-to-t from-amber-600 to-amber-400"
            />
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(3, (d.received / max) * 100)}%` }}
              transition={{ delay: i * 0.09, duration: 0.5, ease: 'easeOut' }}
              title={`${t('home_chart_received')} ₹${d.received}`}
              className="w-[42%] max-w-[20px] rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400"
            />
          </div>
          <span className="font-mono text-[10px] text-slate-400">{days[i]}</span>
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const { shopProfile } = useAuth()
  const { customers, homeEntries, plan, isOffline, pendingSync, loading } = useShopData()
  const { t } = useLang()
  const navigate = useNavigate()
  const sorted = [...customers].sort((a, b) => b.balance - a.balance)
  const totalOut = customers.reduce((s, c) => s + c.balance, 0)
  const firstName = shopProfile?.ownerName?.split(' ')?.[0] || 'Dukaandaar'
  const [insight, setInsight] = useState(null)
  const [daily, setDaily] = useState([])
  useEffect(()=>{
    let alive = true
    const load = () => {
      api.getInsights().then(d => alive && setInsight(d)).catch(()=>{})
      api.getInsightsDaily().then(d => alive && setDaily(d || [])).catch(()=>{})
    }
    load()
    const id = setInterval(load, 30000)
    return () => { alive = false; clearInterval(id) }
  },[customers.length])

  if (loading && customers.length===0) {
    return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3].map(i=> <SkeletonCard key={i} />)}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full animate-pulse ${isOffline ? 'bg-slate-400' : 'bg-emerald-500'}`} />
          {isOffline ? t('home_offline_queue', { n: pendingSync }) : t('home_online')}
        </span>
        <Button onClick={()=>navigate('/app/entry')}><Mic size={16} /> {t('entry_cta')}</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Wallet} value={fmt(totalOut)} label={t('stat_total_out')} accent="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20" />
        <Stat icon={Users} value={customers.length} label={t('stat_customers')} accent="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700" />
        <Stat icon={Mic} value={`${plan.used}/${plan.limit === 999999 ? '∞' : plan.limit}`} label={t('plan_monthly', { tier: plan.tier, price: plan.price })} accent="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700" />
        <Stat icon={Bell} value={customers.filter(c=>c.balance>0).length} label={t('stat_reminder')} accent="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700" />
      </div>

      {isOffline && <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-sm font-medium text-amber-800 dark:text-amber-400 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> {t('offline_banner', { n: pendingSync })}</div>}

      {daily.length > 0 && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <h3 className="font-semibold">{t('home_chart_title')}</h3>
            <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />{t('home_chart_given')}</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />{t('home_chart_received')}</span>
            </div>
          </div>
          <WeekChart data={daily} />
        </Card>
      )}

      {insight && (
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="text-xs font-semibold tracking-widest uppercase text-amber-600 dark:text-amber-400">{t('home_insight_heading')}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{insight.summary}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20">{t('home_insight_udhaar', { amt: insight.week_given })}</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">{t('home_insight_wapas', { amt: insight.week_received })}</span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{t('home_insight_total', { amt: insight.total_baki })}</span>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={()=>navigate('/app/cash')} className="hidden sm:flex">{t('home_cash_band')} <ArrowRight size={14} /></Button>
          </div>
          {insight.riskiest?.length>0 && <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-sm"><span className="font-semibold text-red-600 dark:text-red-400">{t('home_recovery')}</span> {insight.riskiest.map(r=> `${r.name} ₹${r.balance}`).join(' • ')}</div>}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
        <Card padding="p-0" className="overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold">{t('entries_today')}</h3>
            <button onClick={()=>navigate('/app/customers')} className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1">{t('view_all')} <ArrowRight size={14} /></button>
          </div>
          {homeEntries.length===0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3"><Mic size={20} className="text-slate-400" /></div>
              <p className="font-medium">{t('no_entries_today')}</p>
              <p className="text-sm text-slate-500">{t('home_empty_hint')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs font-semibold tracking-widest uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800"><th className="px-5 py-3">{t('th_customer')}</th><th className="px-3 py-3">{t('th_type')}</th><th className="px-3 py-3">{t('th_amount')}</th><th className="px-3 py-3">{t('th_time')}</th></tr></thead>
                <tbody>
                  {homeEntries.map((e,i)=> (
                    <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i*0.03 }} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-medium">{e.name}</td>
                      <td className="px-3 py-3"><Badge tone={e.type==='credit_given'?'red':'green'}>{e.type==='credit_given'?t('badge_udhaar'):t('badge_wapas')}</Badge></td>
                      <td className="px-3 py-3 font-mono font-semibold">{fmt(e.amount)}</td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-500">{e.time}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">{t('top_baki')}</h3>
          {sorted.length===0 ? <p className="text-sm text-slate-500">{t('no_customers')}</p> : sorted.slice(0,4).map(c=> (
            <motion.div key={c.id} whileHover={{ x: 4 }} onClick={()=>navigate(`/app/customers/${c.id}`)} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center text-xs font-bold">{initials(c.name).slice(0,2)}</div>
                <span className="font-medium text-sm">{c.name}</span>
              </div>
              <span className="font-mono font-semibold text-sm">{fmt(c.balance)}</span>
            </motion.div>
          ))}
        </Card>
      </div>
    </div>
  )
}