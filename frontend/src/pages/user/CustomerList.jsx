import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShopData } from '../../context/ShopDataContext'
import { useToast } from '../../context/ToastContext'
import { fmt, initials } from '../../lib/format'
import Button from '../../components/Button'

export default function CustomerList() {
  const { customers, addCustomer } = useShopData()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [balance, setBalance] = useState('')
  const [busy, setBusy] = useState(false)

  const sorted = [...customers].sort((a, b) => b.balance - a.balance)

  const submit = async () => {
    if (!name.trim()) { showToast('Grahak ka naam zaroori hai'); return }
    setBusy(true)
    try {
      const c = await addCustomer(name.trim(), phone.trim(), parseFloat(balance) || 0)
      setName(''); setPhone(''); setBalance(''); setOpen(false)
      showToast('Naya grahak jud gaya ✓')
      navigate(`/app/customers/${c.id}`)
    } catch (e) {
      showToast(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <h1 className="font-display font-normal text-[24px] sm:text-[28px]">Grahak List</h1>
          <p className="text-ink-dim text-[13px] sm:text-[14.5px] mt-1">Sabse zyada baaki wale sabse upar.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(o => !o)} className="w-full sm:w-auto justify-center">+ Naya Grahak</Button>
      </div>

      {open && (
        <div className="bg-surface border border-line rounded-3xl p-6 mb-5">
          <div className="mb-3.5">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Grahak ka Naam</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Jaise: Priya Traders" className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
          </div>
          <div className="mb-3.5">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 90000 00000" className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
          </div>
          <div className="mb-4">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Shuruaati Balance (₹) — agar pehle se udhaar hai</label>
            <input type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0" className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
          </div>
          <Button onClick={submit} disabled={busy}>{busy ? 'Jod rahe hain...' : 'Grahak Jodein'}</Button>
        </div>
      )}

      <div className="bg-surface border border-line rounded-3xl overflow-hidden">
        {customers.length === 0 ? (
          <div className="text-center py-14 px-5 text-ink-dim">
            <svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="1.6" className="mx-auto mb-4 text-gold opacity-70"><circle cx="9" cy="8" r="3.4" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /></svg>
            <h3 className="text-ink text-[17px] font-bold mb-1.5">Abhi koi grahak nahi hai</h3>
            <p className="text-[13.5px] max-w-[320px] mx-auto mb-4">Pehli entry bolke shuru karein, ya "+ Naya Grahak" se manually jodein.</p>
            <Button onClick={() => navigate('/app/entry')}>Pehli Entry Bolein</Button>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left font-mono text-[11px] uppercase tracking-wide text-ink-dim border-b border-line bg-surface-2">
                  <th className="p-3.5">Grahak</th><th>Phone</th><th>Baaki Balance</th><th></th>
                </tr></thead>
                <tbody>
                  {sorted.map(c => (
                    <tr key={c.id} onClick={() => navigate(`/app/customers/${c.id}`)} className="border-b border-line last:border-0 cursor-pointer hover:bg-surface-2">
                      <td className="p-3.5 font-bold flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm text-[#1A1206] flex-shrink-0" style={{ background: 'linear-gradient(145deg,var(--gold),var(--gold-deep))' }}>{initials(c.name)}</div>
                        {c.name}
                      </td>
                      <td className="font-mono text-[13px]">{c.phone || "—"}</td>
                      <td className="font-mono font-bold text-maroon">{fmt(c.balance)}</td>
                      <td><Button variant="ghost" size="sm">Dekhein →</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-line">
              {sorted.map(c => (
                <div key={c.id} onClick={() => navigate(`/app/customers/${c.id}`)} className="p-4 flex items-center gap-3 cursor-pointer hover:bg-surface-2">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-sm text-[#1A1206] flex-shrink-0" style={{ background: 'linear-gradient(145deg,var(--gold),var(--gold-deep))' }}>{initials(c.name)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[15px] truncate">{c.name}</div>
                    <div className="font-mono text-[12px] text-ink-dim truncate">{c.phone || "No phone"} • {fmt(c.balance)}</div>
                  </div>
                  <span className="text-gold font-bold text-[13px] flex-shrink-0">→</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
