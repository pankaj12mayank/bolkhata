import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import Button from '../components/Button'
import Select from '../components/Select'
import { useAuth } from '../context/AuthContext'
import { useShopData } from '../context/ShopDataContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../context/LangContext'
import { api } from '../lib/api'

export default function Onboarding() {
  const [shopName, setShopName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [language, setLanguage] = useState('Hindi')
  const [busy, setBusy] = useState(false)
  const { loginWithToken, setShopProfile } = useAuth()
  const { refreshAll } = useShopData()
  const { showToast } = useToast()
  const { t } = useLang()
  const navigate = useNavigate()
  const location = useLocation()
  const { phone, otp } = location.state || {}

  const submit = async () => {
    if (!phone || !otp) { navigate('/login/dukaandaar'); return }
    const finalShop = shopName.trim() || t('common_shop')
    const finalOwner = ownerName.trim() || t('common_owner')
    setBusy(true)
    try {
      const res = await api.verifyOtp({
        phone, otp, is_register: true,
        shop_name: finalShop, owner_name: finalOwner, language,
      })
      loginWithToken(res.token, 'user')
      setShopProfile({ shopName: finalShop, ownerName: finalOwner, phone: '+91 ' + phone, language })
      await refreshAll()
      navigate('/app')
      showToast(t('ob_welcome', { name: finalOwner.split(' ')[0] }))
    } catch (e) {
      showToast(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-app text-ink flex items-center justify-center px-5 py-8 relative">
      <div className="grain" />
      <div className="absolute top-8 left-1/2 -translate-x-1/2"><Logo /></div>
      <div className="bg-surface border border-line rounded-3xl p-9 max-w-[400px] w-full shadow-deep">
        <div className="flex gap-1.5 justify-center mb-6">
          <span className="w-[26px] h-1 rounded bg-line" />
          <span className="w-[26px] h-1 rounded bg-gold" />
        </div>
        <h1 className="font-display font-normal text-[26px] mb-1.5">{t('ob_title')}</h1>
        <p className="text-ink-dim text-[13.5px] mb-6">{t('ob_sub')}</p>

        <div className="mb-4">
          <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('ob_lbl_shop')}</label>
          <input value={shopName} onChange={e => setShopName(e.target.value)} placeholder={t('ob_ph_shop')}
            className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
        </div>
        <div className="mb-4">
          <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('ob_lbl_owner')}</label>
          <input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder={t('ob_ph_owner')}
            className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
        </div>
        <div className="mb-5">
          <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('ob_lbl_lang')}</label>
          <Select value={language} onChange={e => setLanguage(e.target.value)}>
            <option>Hindi</option><option>English</option>
          </Select>
        </div>
        <Button onClick={submit} disabled={busy} className="w-full">{busy ? t('ob_busy') : t('ob_btn')}</Button>
      </div>
    </div>
  )
}
