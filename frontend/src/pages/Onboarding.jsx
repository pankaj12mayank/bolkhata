import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { useShopData } from '../context/ShopDataContext'
import { useToast } from '../context/ToastContext'
import { api } from '../lib/api'

export default function Onboarding() {
  const [shopName, setShopName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [language, setLanguage] = useState('Hindi')
  const [busy, setBusy] = useState(false)
  const { loginWithToken, setShopProfile } = useAuth()
  const { refreshAll } = useShopData()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const { phone, otp } = location.state || {}

  const submit = async () => {
    if (!phone || !otp) { navigate('/login/dukaandaar'); return }
    const finalShop = shopName.trim() || 'Meri Dukaan'
    const finalOwner = ownerName.trim() || 'Dukaandaar'
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
      showToast(`BolKhata mein swagat hai, ${finalOwner.split(' ')[0]} ji! 🎉`)
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
        <h1 className="font-display font-normal text-[26px] mb-1.5">Apni Dukaan Set Up Karein</h1>
        <p className="text-ink-dim text-[13.5px] mb-6">Bas do minute — phir seedha bolna shuru karein</p>

        <div className="mb-4">
          <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Dukaan ka Naam</label>
          <input value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Jaise: Sharma Kirana Store"
            className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
        </div>
        <div className="mb-4">
          <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Aapka Naam</label>
          <input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Jaise: Ramesh Sharma"
            className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
        </div>
        <div className="mb-5">
          <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Bhasha Chunein</label>
          <select value={language} onChange={e => setLanguage(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]">
            <option>Hindi</option><option>Hinglish</option><option>Marathi</option><option>English</option>
          </select>
        </div>
        <Button onClick={submit} disabled={busy} className="w-full">{busy ? 'Set up ho raha hai...' : 'Shuru Karein →'}</Button>
      </div>
    </div>
  )
}
