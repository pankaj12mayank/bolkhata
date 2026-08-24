import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import Badge from '../../components/Badge'

const filters = ['all', 'success', 'failed']

export default function Logs() {
  const [filter, setFilter] = useState('all')
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (f) => {
    setLoading(true)
    try {
      setLogs(await api.adminLogs(f))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(filter) }, [filter, load])

  return (
    <div className="w-full">
      <div className="mb-5">
        <h1 className="font-display font-normal text-[26px] sm:text-[28px]">Entries &amp; Logs</h1>
        <p className="text-ink-dim text-[13px] sm:text-[14.5px] mt-1">Live voice-entry monitoring — track parsing quality.</p>
      </div>
      <div className="flex gap-2 flex-wrap mb-5">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full border text-[13px] font-bold transition-all ${filter === f ? 'bg-gold border-gold text-[#1A1206] shadow-soft' : 'border-line text-ink-dim hover:border-[var(--gold)] hover:text-gold bg-surface'}`}>
            {f === 'all' ? 'All' : f === 'success' ? 'Parsed OK' : 'Manual Fallback'}
          </button>
        ))}
      </div>
      <div className="bg-surface border border-line rounded-3xl overflow-hidden shadow-soft">
        {loading ? (
          <div className="text-ink-dim py-14 text-center">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-ink-dim py-14 text-center px-4">No entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead><tr className="text-left font-mono text-[11px] uppercase tracking-wide text-ink-dim border-b border-line bg-surface-2">
                <th className="p-3.5">Shop</th><th>Raw Voice Text</th><th>Parsed</th><th>Status</th><th>Time</th>
              </tr></thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={i} className="border-b border-line last:border-0 hover:bg-surface-2">
                    <td className="p-3.5 font-bold">{l.shop_name}</td>
                    <td className="font-hand text-[14px] sm:text-[14.5px]">"{l.raw_voice_text}"</td>
                    <td className="font-mono text-xs">{l.parsed_summary}</td>
                    <td><Badge tone={l.status === 'success' ? 'green' : 'red'}>{l.status === 'success' ? 'Parsed OK' : 'Manual Fallback'}</Badge></td>
                    <td className="font-mono text-[12px] sm:text-sm">{new Date(l.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
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
