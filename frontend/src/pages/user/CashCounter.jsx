import { useEffect, useState } from "react"
import { useToast } from "../../context/ToastContext"
import { useLang } from "../../context/LangContext"
import Button from "../../components/Button"
import { fmt } from "../../lib/format"
import * as offline from "../../lib/offline"

const DENOMS = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1]

function todayStr() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()) }

export default function CashCounter() {
  const { showToast } = useToast()
  const { t } = useLang()
  const [denoms, setDenoms] = useState({})
  const [note, setNote] = useState("")
  const [expected, setExpected] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState([])
  const [apiData, setApiData] = useState(null)

  const total = DENOMS.reduce((s,d)=> s + (Number(denoms[d])||0)*d, 0)
  const diff = expected !== "" ? total - Number(expected) : null

  const load = async () => {
    setLoading(true)
    try {
      // try API first
      const token = localStorage.getItem('bolkhata_token')
      const base = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'
      let data = null
      try {
        const r = await fetch(base+'/cash/today', { headers: token?{Authorization:`Bearer ${token}`}:{} })
        if (r.ok) data = await r.json()
      } catch {}
      if (data) {
        setApiData(data)
        setDenoms(data.denominations || {})
        setNote(data.note || "")
        if (data.expected_cash) setExpected(String(data.expected_cash))
        await offline.saveCashDay(todayStr(), { denominations: data.denominations, total: data.total_cash, note: data.note })
      } else {
        // offline
        const off = await offline.getCashDay(todayStr())
        if (off) {
          setDenoms(off.denominations || {})
          setNote(off.note || "")
        }
      }
      // history
      try {
        const rh = await fetch(base+'/cash/history', { headers: token?{Authorization:`Bearer ${token}`}:{} })
        if (rh.ok) setHistory(await rh.json())
        else {
          const all = await offline.getAllCashDays()
          setHistory(all.slice(0,7))
        }
      } catch {
        const all = await offline.getAllCashDays()
        setHistory(all.slice(0,7))
      }
    } finally { setLoading(false) }
  }
  useEffect(()=>{load()},[])

  const setCount = (d, v) => {
    const n = parseInt(v) || 0
    setDenoms(prev=> ({...prev, [d]: n<0?0:n}))
  }

  const save = async () => {
    setSaving(true)
    const payload = { denominations: denoms, note, expected_cash: expected? Number(expected): undefined }
    // save offline first
    await offline.saveCashDay(todayStr(), { denominations: denoms, total, note, expected: expected?Number(expected):null })
    if (!navigator.onLine) {
      await offline.queueAction({ type: 'cash_day', payload: { ...payload, date: todayStr() } })
      showToast('toast_cash_closed', 'success', { amount: fmt(total) })
      setSaving(false)
      return
    }
    try {
      const token = localStorage.getItem('bolkhata_token')
      const base = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'
      const r = await fetch(base+'/cash/today', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}) },
        body: JSON.stringify(payload)
      })
      if (!r.ok) throw new Error((await r.json()).detail || 'Save fail')
      const data = await r.json()
      showToast('toast_cash_closed', 'success', { amount: fmt(total) })
      load()
    } catch(e){
      // queue
      await offline.queueAction({ type: 'cash_day', payload: { ...payload, date: todayStr() } })
      showToast('toast_queue_pending', 'success', { message: e.message })
    } finally { setSaving(false) }
  }

  if (loading) return <div className="py-16 text-center text-ink-dim">{t('common_loading')}</div>

  return (
    <div className="w-full">
      <div className="mb-6 flex justify-end">
        <div className="text-sm font-mono text-ink-dim">{apiData ? t('cc_today', { date: todayStr(), received: fmt(apiData.payment_received), given: fmt(apiData.udhaar_given) }) : `${todayStr()} • ${t('cc_offline')}`}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 sm:gap-5">
        <div className="bg-surface border border-line rounded-3xl p-4 sm:p-6">
          <h3 className="font-extrabold mb-4">{t('cc_note_gino')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DENOMS.map(d=>(
              <div key={d} className="flex items-center justify-between bg-surface-2 border border-line rounded-2xl px-4 py-3">
                <span className="font-mono font-bold text-lg">₹{d}</span>
                <div className="flex items-center gap-2">
                  <button onClick={()=>setCount(d, (Number(denoms[d])||0)-1)} className="w-9 h-9 rounded-full bg-surface border border-line font-bold">−</button>
                  <input type="number" value={denoms[d]||""} onChange={e=>setCount(d,e.target.value)} placeholder="0" className="w-16 text-center py-2 rounded-xl border border-line bg-surface font-mono font-bold" />
                  <button onClick={()=>setCount(d, (Number(denoms[d])||0)+1)} className="w-9 h-9 rounded-full bg-[var(--gold)] text-[#1A1206] font-bold">+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('cc_expected_cash')}</label>
            <input type="number" value={expected} onChange={e=>setExpected(e.target.value)} placeholder="e.g. 15400" className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 font-mono" />
          </div>
          <div className="mt-3">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('cc_note')}</label>
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder={t('cc_note_ph')} className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2" />
          </div>
          <div className="mt-5 flex items-center justify-between bg-surface-2 border border-line rounded-2xl p-4">
            <div>
              <div className="text-[12px] font-mono uppercase tracking-wide text-ink-dim">{t('cc_total')}</div>
              <div className="font-mono text-2xl font-extrabold text-green">{fmt(total)}</div>
              {diff!==null && <div className={`text-sm font-bold ${diff===0?'text-green': diff>0?'text-gold':'text-maroon'}`}>{diff===0? t('cc_match') : diff>0? t('cc_extra', { amount: fmt(diff) }) : t('cc_less', { amount: fmt(diff) })}</div>}
            </div>
            <Button onClick={save} disabled={saving}>{saving ? t('cc_save') : t('cc_close_day')}</Button>
          </div>
        </div>

        <div className="bg-surface border border-line rounded-3xl p-6">
          <h3 className="font-extrabold mb-4">{t('cc_last7')}</h3>
          {history.length===0? <p className="text-ink-dim text-sm">{t('cc_no_history')}</p> :
            <div className="space-y-3">
              {history.map(h=>(
                <div key={h.date} className="flex justify-between items-center border-b border-line pb-3 last:border-0">
                  <div><div className="font-mono text-sm font-bold">{h.date}</div><div className="text-xs text-ink-dim">{h.note||'—'}</div></div>
                  <div className="font-mono font-bold">{fmt(h.total_cash||h.total||0)}</div>
                </div>
              ))}
            </div>
          }
          <div className="mt-6 p-4 rounded-2xl bg-[rgba(232,169,59,.08)] border border-[rgba(232,169,59,.15)]">
            <b className="text-sm">{t('cc_offline_tip_t')}</b>
            <p className="text-[12.5px] text-ink-dim mt-1">{t('cc_offline_tip_d')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
