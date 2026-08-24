import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import { api } from '../../lib/api'
import Button from '../../components/Button'

function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} className={`w-11 h-6 rounded-full relative flex-shrink-0 border transition-colors ${on ? 'bg-[rgba(79,163,122,.2)] border-green' : 'bg-surface-2 border-line'}`}>
      <div className={`absolute top-0.5 w-[18px] h-[18px] rounded-full transition-transform ${on ? 'translate-x-5 bg-green' : 'translate-x-0.5 bg-ink-dim'}`} />
    </button>
  )
}

export default function Profile() {
  const { shopProfile, setShopProfile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { showToast } = useToast()
  const [shopName, setShopName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [language, setLanguage] = useState('Hinglish')
  const [autoReminder, setAutoReminder] = useState(true)
  const [voiceBeep, setVoiceBeep] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setShopName(shopProfile?.shopName || '')
    setOwnerName(shopProfile?.ownerName || '')
    setLanguage(shopProfile?.language || 'Hinglish')
  }, [shopProfile])

  const save = async () => {
    setBusy(true)
    try {
      const updated = await api.updateShop({ shop_name: shopName, owner_name: ownerName, language })
      setShopProfile({ ...shopProfile, shopName: updated.shop_name, ownerName: updated.owner_name, language: updated.language, phone: updated.phone })
      showToast('Profile update ho gayi \u2713')
    } catch (e) {
      showToast(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="font-display font-normal text-[24px] sm:text-[28px]">Profile</h1>
        <p className="text-ink-dim text-[13px] sm:text-[14.5px] mt-1">Apni dukaan ki jaankari yahan update karein. Bhasha se voice hint badlega.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <div className="bg-surface border border-line rounded-3xl p-4 sm:p-6">
          <div className="mb-3.5">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Dukaan ka Naam</label>
            <input value={shopName} onChange={e => setShopName(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
          </div>
          <div className="mb-3.5">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Malik ka Naam</label>
            <input value={ownerName} onChange={e => setOwnerName(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
          </div>
          <div className="mb-3.5">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Phone Number</label>
            <input value={shopProfile?.phone || ''} disabled className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink-dim text-[14.5px] outline-none" />
          </div>
          <div className="mb-4">
            <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Bhasha — Voice ke liye</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]">
              <option>Hinglish</option><option>Hindi</option><option>English</option><option>Marathi</option>
            </select>
          </div>
          <Button onClick={save} disabled={busy}>{busy ? 'Save ho raha hai...' : 'Save Karein'}</Button>
        </div>
        <div className="bg-surface border border-line rounded-3xl p-6">
          <div className="flex items-center justify-between py-4 border-b border-line">
            <div><b className="block text-[14.5px]">Dark Theme</b><span className="text-[12.5px] text-ink-dim">Raat mein aankhon ke liye aaram deh</span></div>
            <Toggle on={theme === 'dark'} onClick={toggleTheme} />
          </div>
          <div className="flex items-center justify-between py-4 border-b border-line">
            <div><b className="block text-[14.5px]">WhatsApp Reminder Auto-Suggest</b><span className="text-[12.5px] text-ink-dim">Overdue grahak ke liye suggestion</span></div>
            <Toggle on={autoReminder} onClick={() => setAutoReminder(v => !v)} />
          </div>
          <div className="flex items-center justify-between py-4">
            <div><b className="block text-[14.5px]">Voice Confirmation Awaaz</b><span className="text-[12.5px] text-ink-dim">Entry save hone par beep</span></div>
            <Toggle on={voiceBeep} onClick={() => setVoiceBeep(v => !v)} />
          </div>
        </div>
      </div>
    </div>
  )
}