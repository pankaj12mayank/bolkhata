import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import { useLang } from '../../context/LangContext'
import { api } from '../../lib/api'
import Button from '../../components/Button'
import Toggle from '../../components/Toggle'
import Select from '../../components/Select'

export default function Profile() {
  const { shopProfile, setShopProfile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { showToast } = useToast()
  const { t } = useLang()
  const [shopName, setShopName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [language, setLanguage] = useState('Hindi')
  const [upiId, setUpiId] = useState('')
  const [autoReminder, setAutoReminder] = useState(true)
  const [voiceBeep, setVoiceBeep] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setShopName(shopProfile?.shopName || '')
    setOwnerName(shopProfile?.ownerName || '')
    setLanguage(shopProfile?.language || 'Hindi')
    setUpiId(shopProfile?.upi_id || '')
    // fetch fresh profile for upi
    api.me().then(me => {
      if (me.shop?.upi_id) setUpiId(me.shop.upi_id)
      if (me.shop?.upi_id !== undefined) setShopProfile(prev => ({ ...prev, upi_id: me.shop.upi_id }))
    }).catch(() => {})
  }, [shopProfile?.shopName])

  const save = async () => {
    setBusy(true)
    try {
      const updated = await api.updateShop({ shop_name: shopName, owner_name: ownerName, language, upi_id: upiId })
      setShopProfile({ ...shopProfile, shopName: updated.shop_name, ownerName: updated.owner_name, language: updated.language, phone: updated.phone, upi_id: updated.upi_id })
      showToast('toast_profile_saved')
    } catch (e) {
      showToast(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-5 w-full">
        <div className="bg-surface border border-line rounded-3xl p-5 sm:p-7 w-full">
          <div className="mb-3.5">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('pr_lbl_shop')}</label>
            <input value={shopName} onChange={e => setShopName(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
          </div>
          <div className="mb-3.5">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('pr_lbl_owner')}</label>
            <input value={ownerName} onChange={e => setOwnerName(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
          </div>
          <div className="mb-3.5">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('pr_lbl_phone')}</label>
            <input value={shopProfile?.phone || ''} disabled className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink-dim text-[14.5px] outline-none" />
          </div>
          <div className="mb-3.5">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('pr_lbl_upi')}</label>
            <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="dukandarraja@okhdfcbank" className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
            <p className="text-[11px] text-ink-dim mt-1">{t('pr_upi_hint')}</p>
          </div>
          <div className="mb-4">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('pr_lbl_lang')}</label>
            <Select value={language} onChange={e => setLanguage(e.target.value)}>
              <option>Hindi</option><option>English</option>
            </Select>
          </div>
          <Button onClick={save} disabled={busy}>{busy ? t('pr_btn_busy') : t('pr_btn_save')}</Button>
        </div>
        <div className="bg-surface border border-line rounded-3xl p-5 sm:p-7 w-full">
          <div className="flex items-center justify-between py-4 border-b border-line">
            <div><b className="block text-[14.5px]">{t('pr_dark_t')}</b><span className="text-[12.5px] text-ink-dim">{t('pr_dark_sub')}</span></div>
            <Toggle on={theme === 'dark'} onClick={toggleTheme} />
          </div>
          <div className="flex items-center justify-between py-4 border-b border-line">
            <div><b className="block text-[14.5px]">{t('pr_wa_t')}</b><span className="text-[12.5px] text-ink-dim">{t('pr_wa_sub')}</span></div>
            <Toggle on={autoReminder} onClick={() => setAutoReminder(v => !v)} />
          </div>
          <div className="flex items-center justify-between py-4">
            <div><b className="block text-[14.5px]">{t('pr_beep_t')}</b><span className="text-[12.5px] text-ink-dim">{t('pr_beep_sub')}</span></div>
            <Toggle on={voiceBeep} onClick={() => setVoiceBeep(v => !v)} />
          </div>
        </div>
      </div>
    </div>
  )
}