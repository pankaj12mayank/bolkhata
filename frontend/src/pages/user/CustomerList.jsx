import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useShopData } from '../../context/ShopDataContext'
import { useToast } from '../../context/ToastContext'
import { fmt, initials } from '../../lib/format'
import Button from '../../components/Button'
import Pagination from '../../components/Pagination'
import { useLang } from '../../context/LangContext'

const PAGE_SIZE = 10

export default function CustomerList() {
  const { customers, addCustomer } = useShopData()
  const { showToast } = useToast()
  const { t } = useLang()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [balance, setBalance] = useState('')
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const custFilters = [
    { id: 'all', label: t('cfl_all') },
    { id: 'has', label: t('cfl_has') },
    { id: 'high', label: t('cfl_high') },
    { id: 'zero', label: t('cfl_zero') },
  ]

  const filtered = useMemo(() => {
    let list = [...customers]
    if (filter === 'has') list = list.filter(c=> c.balance>0)
    else if (filter === 'zero') list = list.filter(c=> c.balance===0)
    else if (filter === 'high') list = list.filter(c=> c.balance>500)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c=> c.name.toLowerCase().includes(q) || (c.phone||'').includes(q))
    }
    return list.sort((a,b)=> b.balance - a.balance)
  }, [customers, filter, search])

  useEffect(() => {
    setPage(1)
  }, [filter, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pagedCustomers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const submit = async () => {
    if (!name.trim()) { showToast('toast_customer_name_required'); return }
    setBusy(true)
    try {
      const c = await addCustomer(name.trim(), phone.trim(), parseFloat(balance) || 0)
      setName(''); setPhone(''); setBalance(''); setOpen(false)
      showToast('toast_customer_added')
      navigate(`/app/customers/${c.id}`)
    } catch (e) {
      showToast(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setOpen(o => !o)} className="w-full sm:w-auto justify-center">+ {t('add_customer')}</Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {custFilters.map(f=> (
            <button key={f.id} onClick={()=>setFilter(f.id)} className={`px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all ${filter===f.id ? 'bg-amber-500 border-amber-500 text-slate-900 shadow-sm ring-2 ring-amber-100 dark:ring-amber-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{f.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 ml-auto w-full sm:max-w-xs focus-within:border-amber-300 dark:focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-amber-100 dark:focus-within:ring-amber-900/20">
          <Search size={14} className="text-slate-400" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('cl_search_ph')} className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400 dark:text-slate-200" />
        </div>
      </div>

      {open && (
        <div className="bg-surface border border-line rounded-3xl p-6 mb-5 shadow-soft">
          <div className="mb-3.5">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('cl_lbl_name')}</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={t('cl_ph_name')} className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
          </div>
          <div className="mb-3.5">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('cl_lbl_phone')}</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 90000 00000" className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
          </div>
          <div className="mb-4">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('cl_lbl_balance')}</label>
            <input type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0" className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
          </div>
          <Button onClick={submit} disabled={busy}>{busy ? t('cl_btn_add_busy') : t('cl_btn_add')}</Button>
        </div>
      )}

      <div className="bg-surface border border-line rounded-3xl overflow-hidden shadow-soft">
        {customers.length === 0 ? (
          <div className="text-center py-14 px-5 text-ink-dim">
            <svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="1.6" className="mx-auto mb-4 text-gold opacity-70"><circle cx="9" cy="8" r="3.4" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /></svg>
            <h3 className="text-ink text-[17px] font-bold mb-1.5">{t('cl_empty_t')}</h3>
            <p className="text-[13.5px] max-w-[320px] mx-auto mb-4">{t('cl_empty_sub')}</p>
            <Button onClick={() => navigate('/app/entry')}>{t('cl_btn_first')}</Button>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left font-mono text-[11px] uppercase tracking-wide text-ink-dim border-b border-line bg-surface-2">
                  <th className="p-3.5">{t('th_customer')}</th><th>{t('th_phone')}</th><th>{t('th_balance')}</th><th></th>
                </tr></thead>
                <tbody className="divide-y divide-line">
                  {pagedCustomers.map(c => (
                    <tr key={c.id} onClick={() => navigate(`/app/customers/${c.id}`)} className="cursor-pointer hover:bg-surface-2/50 transition-colors">
                      <td className="p-3.5 font-bold flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm text-[#1A1206] flex-shrink-0" style={{ background: 'linear-gradient(145deg,var(--gold),var(--gold-deep))' }}>{initials(c.name)}</div>
                        {c.name}
                      </td>
                      <td className="font-mono text-[13px]">{c.phone || "—"}</td>
                      <td className="font-mono font-bold text-maroon">{fmt(c.balance)}</td>
                      <td><Button variant="ghost" size="sm">{t('cl_view')}</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-line">
              {pagedCustomers.map(c => (
                <div key={c.id} onClick={() => navigate(`/app/customers/${c.id}`)} className="p-4 flex items-center gap-3 cursor-pointer hover:bg-surface-2/50 transition-colors">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-sm text-[#1A1206] flex-shrink-0" style={{ background: 'linear-gradient(145deg,var(--gold),var(--gold-deep))' }}>{initials(c.name)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[15px] truncate">{c.name}</div>
                    <div className="font-mono text-[12px] text-ink-dim truncate">{c.phone || t('common_no_phone')} • {fmt(c.balance)}</div>
                  </div>
                  <span className="text-gold font-bold text-[13px] flex-shrink-0">→</span>
                </div>
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  )
}