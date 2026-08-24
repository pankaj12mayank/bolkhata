import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import Badge from '../../components/Badge'

const filters = ['all', 'Success', 'Pending', 'Failed']
const tone = { Success: 'green', Pending: 'gold', Failed: 'red' }

export default function Subscriptions() {
  const [filter, setFilter] = useState('all')
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)

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
      <div className="mb-5">
        <h1 className="font-display font-normal text-[26px] sm:text-[28px]">Subscriptions</h1>
        <p className="text-ink-dim text-[13px] sm:text-[14.5px] mt-1">All payments processed via Razorpay.</p>
      </div>
      <div className="flex gap-2 flex-wrap mb-5">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full border text-[13px] font-bold transition-all ${filter === f ? 'bg-gold border-gold text-[#1A1206] shadow-soft' : 'border-line text-ink-dim hover:border-[var(--gold)] hover:text-gold bg-surface'}`}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>
      <div className="bg-surface border border-line rounded-3xl overflow-hidden shadow-soft">
        {loading ? (
          <div className="text-ink-dim py-14 text-center">Loading...</div>
        ) : subs.length === 0 ? (
          <div className="text-ink-dim py-14 text-center px-4">No subscriptions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead><tr className="text-left font-mono text-[11px] uppercase tracking-wide text-ink-dim border-b border-line bg-surface-2">
                <th className="p-3.5">Shop ID</th><th>Amount</th><th>Razorpay ID</th><th>Status</th><th>Date</th>
              </tr></thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b border-line last:border-0 hover:bg-surface-2">
                    <td className="p-3.5 font-bold">#{s.shop_id}</td>
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
