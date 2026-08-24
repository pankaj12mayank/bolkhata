import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useShopData } from '../../context/ShopDataContext'
import { fmt, initials } from '../../lib/format'
import StatCard from '../../components/StatCard'
import Badge from '../../components/Badge'
import Button from '../../components/Button'

export default function Home() {
  const { shopProfile } = useAuth()
  const { customers, homeEntries, plan } = useShopData()
  const navigate = useNavigate()
  const sorted = [...customers].sort((a, b) => b.balance - a.balance)
  const totalOut = customers.reduce((s, c) => s + c.balance, 0)
  const firstName = shopProfile?.ownerName?.split(' ')?.[0] || 'Dukaandaar'

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="font-display font-normal text-[24px] sm:text-[28px]">Namaste, {firstName} ji \uD83D\uDC4B</h1>
          <p className="text-ink-dim text-[13px] sm:text-[14.5px] mt-1">Aaj ka hisaab dekhiye. Bhasha & pricing Admin ne set kiya hai.</p>
        </div>
        <Button onClick={() => navigate('/app/entry')} className="w-full sm:w-auto justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" /><path d="M6 11v1a6 6 0 0 0 12 0v-1M12 18v3" /></svg>
          Naya Entry Bolein
        </Button>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-7">
        <StatCard value={fmt(totalOut)} label="Kul udhaar baaki" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 19V5M4 19h16M9 15l3-4 2.5 3L19 9" /></svg>} />
        <StatCard value={customers.length} label="Total grahak" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="8" r="3.4" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /></svg>} />
        <StatCard value={`${plan.used} / ${plan.limit}`} label={`Is mahine (${plan.price ? plan.price : 99}/mo)`} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" /></svg>} />
        <StatCard value={customers.filter(c => c.balance > 0).length} label="Reminder yogya" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 sm:gap-5">
        <div className="bg-surface border border-line rounded-3xl p-4 sm:p-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="font-extrabold text-[16px] sm:text-[16.5px]">Aaj ki Entries</h3>
            <button onClick={() => navigate('/app/customers')} className="text-gold font-bold text-[13px] sm:text-[13.5px] text-left">Sab Grahak Dekhein \u2192</button>
          </div>
          {homeEntries.length === 0 ? (
            <div className="text-center py-9 text-ink-dim">
              <p className="text-[15px] text-ink font-bold mb-1">Aaj abhi tak koi entry nahi</p>
              <p className="text-[13.5px]">Mic dabaiye — Hinglish/Hindi/English sab chalega.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left font-mono text-[11px] uppercase tracking-wide text-ink-dim border-b border-line">
                  <th className="py-2.5">Grahak</th><th>Type</th><th>Amount</th><th>Samay</th>
                </tr></thead>
                <tbody>
                  {homeEntries.map((e, i) => (
                    <tr key={i} className="border-b border-line last:border-0">
                      <td className="py-3 font-bold">{e.name}</td>
                      <td><Badge tone={e.type === 'credit_given' ? 'red' : 'green'}>{e.type === 'credit_given' ? 'Udhaar Diya' : 'Vaapsi Mili'}</Badge></td>
                      <td className="font-mono">{fmt(e.amount)}</td>
                      <td className="font-mono">{e.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-surface border border-line rounded-3xl p-6">
          <h3 className="font-extrabold text-[16.5px] mb-4">Sabse Zyada Baaki</h3>
          {sorted.length === 0 ? (
            <p className="text-ink-dim text-[13.5px]">Abhi koi grahak nahi. Entry add karke shuru karein.</p>
          ) : sorted.slice(0, 3).map(c => (
            <div key={c.id} onClick={() => navigate(`/app/customers/${c.id}`)} className="flex items-center justify-between py-2.5 border-b border-line last:border-0 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm text-[#1A1206]" style={{ background: 'linear-gradient(145deg,var(--gold),var(--gold-deep))' }}>{initials(c.name)}</div>
                <b className="text-sm">{c.name}</b>
              </div>
              <span className="font-mono font-bold text-maroon">{fmt(c.balance)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}