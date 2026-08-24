import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useShopData } from '../../context/ShopDataContext'
import { useToast } from '../../context/ToastContext'
import { fmt, initials } from '../../lib/format'
import Button from '../../components/Button'
import { api } from '../../lib/api'

export default function CustomerDetail() {
  const { id } = useParams()
  const { updateCustomer, deleteCustomer, refreshAll } = useShopData()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [c, setC] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getCustomer(id)
      setC(data)
      setName(data.name)
      setPhone(data.phone)
    } catch {
      setC(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="text-ink-dim py-16 text-center">Load ho raha hai...</div>
  if (!c) return (
    <div className="text-center py-16 text-ink-dim">
      <p className="mb-4">Ye grahak nahi mila.</p>
      <Link to="/app/customers" className="text-gold font-bold">← Grahak List par wapas</Link>
    </div>
  )

  const remind = async () => {
    try {
      const res = await api.remindCustomer(c.id)
      window.open(res.wa_link, '_blank')
    } catch (e) {
      showToast(e.message)
    }
  }
  const saveEdit = async () => {
    try {
      await updateCustomer(c.id, { name: name.trim() || c.name, phone: phone.trim() || c.phone })
      await load()
      setEditing(false)
      showToast('Grahak detail update ho gayi ✓')
    } catch (e) {
      showToast(e.message)
    }
  }
  const doDelete = async () => {
    if (window.confirm(`Kya aap pakka "${c.name}" ko delete karna chahte hain?`)) {
      try {
        await deleteCustomer(c.id)
        showToast('Grahak delete ho gaya')
        navigate('/app/customers')
      } catch (e) {
        showToast(e.message)
      }
    }
  }

  return (
    <div className="w-full">
      <Link to="/app/customers" className="inline-flex items-center gap-1.5 text-ink-dim text-[13.5px] font-bold mb-4 hover:text-gold">← Grahak List par wapas</Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-extrabold text-xl text-[#1A1206] flex-shrink-0" style={{ background: 'linear-gradient(145deg,var(--gold),var(--gold-deep))' }}>{initials(c.name)}</div>
          <div className="min-w-0"><h1 className="font-display font-normal text-[22px] sm:text-[28px] truncate">{c.name}</h1><p className="text-ink-dim text-[13px] sm:text-[14px] truncate">{c.phone || "No phone"}</p></div>
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto">
          <div className="font-mono text-[24px] sm:text-[28px] font-semibold text-maroon">{fmt(c.balance)}</div>
          <div className="text-[13px] text-ink-dim">baaki hai</div>
          <div className="grid grid-cols-3 sm:flex gap-2 mt-3">
            <Button variant="ghost" size="sm" onClick={() => setEditing(o => !o)} className="justify-center">Edit</Button>
            <Button variant="danger" size="sm" onClick={doDelete} className="justify-center">Delete</Button>
            <Button size="sm" onClick={remind} className="justify-center col-span-3 sm:col-auto">WhatsApp Reminder</Button>
          </div>
        </div>
      </div>

      {editing && (
        <div className="bg-surface border border-line rounded-3xl p-6 mb-5">
          <div className="mb-3.5">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Grahak ka Naam</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
          </div>
          <div className="mb-4">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
          </div>
          <Button onClick={saveEdit}>Update Karein</Button>
        </div>
      )}

      <div className="bg-surface border border-line rounded-3xl p-6">
        <h3 className="font-extrabold text-[16.5px] mb-4">Entry History</h3>
        {c.entries.length === 0 ? (
          <p className="text-ink-dim text-[13.5px]">Is grahak ki abhi koi entry nahi hai.</p>
        ) : (
          <div className="relative pl-6 before:content-[''] before:absolute before:left-[6px] before:top-1.5 before:bottom-1.5 before:w-px before:bg-line">
            {c.entries.map((e) => {
              const isCredit = e.type === 'credit_given'
              return (
                <div key={e.id} className="relative pb-6 last:pb-0">
                  <div className={`absolute -left-6 top-1 w-[13px] h-[13px] rounded-full border-[3px] border-surface ${isCredit ? 'bg-maroon' : 'bg-green'}`} />
                  <div className="flex justify-between items-baseline gap-2.5">
                    <span className="font-mono text-[11.5px] text-ink-dim">{new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <span className={`font-mono font-bold text-base ${isCredit ? 'text-maroon' : 'text-green'}`}>{isCredit ? '+' : '-'}{fmt(e.amount)}</span>
                  </div>
                  <div className="font-hand text-[14.5px] text-ink-dim mt-0.5">"{e.raw_voice_text}"</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
