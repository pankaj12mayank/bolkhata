import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useShopData } from '../../context/ShopDataContext'
import { useToast } from '../../context/ToastContext'
import { useLang } from '../../context/LangContext'
import { fmt, initials } from '../../lib/format'
import Button from '../../components/Button'
import { api } from '../../lib/api'
import * as offline from '../../lib/offline'

export default function CustomerDetail() {
  const { id } = useParams()
  const { customers, updateCustomer, deleteCustomer, refreshAll } = useShopData()
  const { showToast } = useToast()
  const { t } = useLang()
  const navigate = useNavigate()
  const [c, setC] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [upi, setUpi] = useState('')
  const [shopUpi, setShopUpi] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getCustomer(id)
      setC(data)
      setName(data.name)
      setPhone(data.phone)
      setUpi(data.upi_id || '')
      // shop upi
      try { const me = await api.me(); if (me.shop?.upi_id) setShopUpi(me.shop.upi_id) } catch {}
    } catch {
      // Offline fallback: load from IndexedDB and local state
      try {
        const dbCusts = await offline.getCustomers()
        const found = dbCusts.find(x => String(x.id) === String(id)) || customers.find(x => String(x.id) === String(id))
        if (found) {
          const dbEntries = await offline.getEntries()
          const custEntries = dbEntries.filter(e => String(e.customer_id) === String(id) || e.customer_name?.toLowerCase() === found.name?.toLowerCase())
          const data = {
            ...found,
            entries: found.entries || custEntries || []
          }
          setC(data)
          setName(data.name || '')
          setPhone(data.phone || '')
          setUpi(data.upi_id || '')

          const shopProf = await offline.getShopProfileOffline()
          if (shopProf?.upi_id) setShopUpi(shopProf.upi_id)
        } else {
          setC(null)
        }
      } catch {
        setC(null)
      }
    } finally {
      setLoading(false)
    }
  }, [id, customers])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="text-ink-dim py-16 text-center">{t('common_loading')}</div>
  if (!c) return (
    <div className="text-center py-16 text-ink-dim">
      <p className="mb-4">{t('cd_not_found')}</p>
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
      await updateCustomer(c.id, { name: name.trim() || c.name, phone: phone.trim() || c.phone, upi_id: upi.trim() })
      await load()
      setEditing(false)
      showToast('toast_customer_detail_saved')
    } catch (e) {
      showToast(e.message)
    }
  }
  const doDelete = async () => {
    if (window.confirm(t('cd_delete_confirm', { name: c.name }))) {
      try {
        await deleteCustomer(c.id)
        showToast('toast_customer_deleted')
        navigate('/app/customers')
      } catch (e) {
        showToast(e.message)
      }
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-base text-[#1A1206] flex-shrink-0" style={{ background: 'linear-gradient(145deg,var(--gold),var(--gold-deep))' }}>{initials(c.name)}</div>
          <div className="min-w-0 font-bold text-lg truncate">{c.name} <span className="text-xs font-normal text-ink-dim">• {c.phone || t('common_no_phone')}</span></div>
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto">
          <div className="font-mono text-[24px] sm:text-[28px] font-semibold text-maroon">{fmt(c.balance)}</div>
          <div className="text-[13px] text-ink-dim">{t('cd_baaki')}</div>
          <div className="grid grid-cols-3 sm:flex gap-2 mt-3">
            <Button variant="ghost" size="sm" onClick={() => setEditing(o => !o)} className="justify-center">{t('cd_edit')}</Button>
            <Button variant="danger" size="sm" onClick={doDelete} className="justify-center">{t('cd_delete')}</Button>
            <Button size="sm" onClick={remind} className="justify-center col-span-3 sm:col-auto">{t('cd_remind')}</Button>
          </div>
          {(shopUpi || c.upi_id) && c.balance>0 && (
            <div className="mt-3 p-3 rounded-2xl bg-[rgba(79,163,122,.08)] border border-green">
              <div className="text-xs font-bold text-green">{t('cd_upi_link')}</div>
              <div className="text-[11px] text-ink-dim break-all mt-1">upi://pay?pa={c.upi_id || shopUpi}&am={c.balance}&tn=BolKhata {encodeURIComponent(c.name)}</div>
              <a href={`upi://pay?pa=${c.upi_id || shopUpi}&am=${c.balance}&tn=BolKhata ${encodeURIComponent(c.name)}`} className="mt-2 inline-block px-3 py-1.5 rounded-full bg-green text-white text-xs font-bold">{t('cd_upi_pay')}</a>
              <div className="text-[11px] text-ink-dim mt-1">{t('cd_upi_sub')}</div>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="bg-surface border border-line rounded-3xl p-6 mb-5">
          <div className="mb-3.5">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('cd_lbl_name')}</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
          </div>
          <div className="mb-3.5">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('cd_lbl_phone')}</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
          </div>
          <div className="mb-4">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('cd_lbl_upi')}</label>
            <input value={upi} onChange={e => setUpi(e.target.value)} placeholder="grahak@oksbi" className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
          </div>
          <Button onClick={saveEdit}>{t('cd_btn_update')}</Button>
        </div>
      )}

      <div className="bg-surface border border-line rounded-3xl p-6">
        <h3 className="font-extrabold text-[16.5px] mb-4">{t('cd_history')}</h3>
        {c.entries.length === 0 ? (
          <p className="text-ink-dim text-[13.5px]">{t('cd_no_history')}</p>
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
