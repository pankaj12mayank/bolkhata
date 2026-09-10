import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import Badge from '../../components/Badge'
import { useLang } from '../../context/LangContext'

const filters = ['all', 'Success', 'Pending', 'Failed']
const tone = { Success: 'green', Pending: 'gold', Failed: 'red' }

export default function Subscriptions() {
  const [filter, setFilter] = useState('all')
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const { t } = useLang()

  const load = useCallback(async (f) => {
    setLoading(true)
    try {
      setSubs(await api.adminSubscriptions(f))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(filter) }, [filter, load])

  return (
    <div className="w-full">
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-5">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all ${filter === f ? 'bg-amber-500 border-amber-500 text-slate-900 shadow-sm ring-2 ring-amber-100 dark:ring-amber-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            {f === 'all' ? t('cfl_all') : f}
          </button>
        ))}
      </div>
      <div className="bg-surface border border-line rounded-3xl overflow-hidden shadow-soft">
        {loading ? (
          <div className="text-ink-dim py-14 text-center">{t('common_loading')}</div>
        ) : subs.length === 0 ? (
          <div className="text-ink-dim py-14 text-center px-4">{t('sub_empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead><tr className="text-left font-mono text-[11px] uppercase tracking-wide text-ink-dim border-b border-line bg-surface-2">
                <th className="p-3.5">{t('sub_th_shop')}</th><th>{t('sub_th_amount')}</th><th>{t('sub_th_rz')}</th><th>{t('sub_th_status')}</th><th>{t('sub_th_date')}</th>
              </tr></thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b border-line last:border-0 hover:bg-surface-2">
                    <td className="p-3.5 font-bold">{s.shop_name || `#${s.shop_id}`}</td>
                    <td className="font-mono">₹{s.amount}</td>
                    <td className="font-mono text-[12px] sm:text-sm break-all">{s.razorpay_id}</td>
                    <td><Badge tone={tone[s.status]}>{s.status}</Badge></td>
                    <td className="font-mono text-[12px] sm:text-sm">{new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
