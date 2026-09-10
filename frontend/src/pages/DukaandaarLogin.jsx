import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import Button from '../components/Button'
import OtpInput from '../components/OtpInput'
import LangToggle from '../components/LangToggle'
import { useAuth } from '../context/AuthContext'
import { useShopData } from '../context/ShopDataContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../context/LangContext'
import { api } from '../lib/api'

export default function DukaandaarLogin() {
  const [registerMode, setRegisterMode] = useState(false)
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [phoneErr, setPhoneErr] = useState('')
  const [otp, setOtp] = useState(['', '', '', ''])
  const [otpErr, setOtpErr] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const [busy, setBusy] = useState(false)
  const timerRef = useRef(null)

  const { loginWithToken } = useAuth()
  const { refreshAll } = useShopData()
  const { showToast } = useToast()
  const { t, tl } = useLang()
  const navigate = useNavigate()

  useEffect(() => () => clearInterval(timerRef.current), [])

  const startResendTimer = () => {
    setResendIn(30)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setResendIn(s => { if (s <= 1) { clearInterval(timerRef.current); return 0 }; return s - 1 })
    }, 1000)
  }

  const sendOtp = async () => {
    if (!/^\d{10}$/.test(phone)) { setPhoneErr(t('dl_phone_err')); return }
    setPhoneErr('')
    setBusy(true)
    try {
      const res = await api.sendOtp(phone)
      setStep('otp')
      setOtp(['', '', '', ''])
      startResendTimer()
      showToast(t('dl_toast_otp_sent'))
    } catch (e) {
      showToast(e.message)
    } finally {
      setBusy(false)
    }
  }

  const verifyOtp = async () => {
    if (otp.some(v => !v)) { setOtpErr(t('dl_otp_err')); return }
    setOtpErr('')
    setBusy(true)
    try {
      if (registerMode) {
        navigate('/onboarding', { state: { phone, otp: otp.join('') } })
      } else {
        const res = await api.verifyOtp({ phone, otp: otp.join('') })
        loginWithToken(res.token, 'user')
        await refreshAll()
        navigate('/app')
      }
    } catch (e) {
      setOtpErr(tl(e.message))
    } finally {
      setBusy(false)
    }
  }

  const switchTab = (reg) => {
    setRegisterMode(reg); setStep('phone'); setPhone(''); setPhoneErr('')
  }

  return (
    <div className="min-h-screen bg-app text-ink flex items-center justify-center px-5 py-8 relative">
      <div className="grain" />
      <div className="absolute top-6 right-6"><LangToggle /></div>
      <Link to="/" className="absolute top-8 left-1/2 -translate-x-1/2"><Logo /></Link>
<div className="bg-surface border border-line rounded-3xl p-9 max-w-[400px] w-full shadow-deep">

        <div className="flex bg-surface-2 rounded-full p-1 mb-6 border border-line">
          <button onClick={() => switchTab(false)} className={`flex-1 text-center py-2.5 rounded-full text-[13px] font-bold transition-all ${!registerMode ? 'text-[#1A1206]' : 'text-ink-dim'}`}
            style={!registerMode ? { background: 'linear-gradient(135deg,var(--gold),var(--gold-deep))' } : {}}>{t('dl_tab_login')}</button>
          <button onClick={() => switchTab(true)} className={`flex-1 text-center py-2.5 rounded-full text-[13px] font-bold transition-all ${registerMode ? 'text-[#1A1206]' : 'text-ink-dim'}`}
            style={registerMode ? { background: 'linear-gradient(135deg,var(--gold),var(--gold-deep))' } : {}}>{t('dl_tab_register')}</button>
        </div>

        <h1 className="font-display font-normal text-[26px] mb-1.5">{registerMode ? t('dl_title_register') : t('dl_title_login')}</h1>
        <p className="text-ink-dim text-[13.5px] mb-4">{registerMode ? t('dl_sub_register') : t('dl_sub_login')}</p>

        {step === 'phone' && (
          <div>
            <div className="mb-4">
              <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('dl_phone')}</label>
              <div className="flex gap-2">
                <span className="px-3.5 py-3 rounded-xl border border-line bg-surface-2 font-bold text-[14.5px] text-ink-dim">+91</span>
                <input
                  type="tel" maxLength={10} value={phone} placeholder="98765 43210"
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-3.5 py-3 rounded-xl border bg-surface-2 text-ink text-[14.5px] outline-none ${phoneErr ? 'border-maroon' : 'border-line focus:border-[var(--gold)]'}`}
                />
              </div>
              {phoneErr && <div className="text-maroon text-xs mt-1.5">{phoneErr}</div>}
            </div>
            <Button onClick={sendOtp} disabled={busy} className="w-full">{busy ? t('dl_sending') : t('dl_btn_send')}</Button>
          </div>
        )}

        {step === 'otp' && (
          <div>
            <p className="text-[13px] text-ink-dim text-center mb-3.5" dangerouslySetInnerHTML={{ __html: t('dl_otp_sent', { phone }) }} />
            <OtpInput values={otp} onChange={setOtp} length={4} />
            {otpErr && <div className="text-maroon text-xs text-center mb-2">{otpErr}</div>}
            <div className="text-center text-[12.5px] text-ink-dim mb-[18px]">
              {resendIn > 0
                ? <span className="opacity-60">{t('dl_resend_in', { s: resendIn })}</span>
                : <button onClick={sendOtp} className="text-gold font-bold">{t('dl_resend')}</button>}
            </div>
            <Button onClick={verifyOtp} disabled={busy} className="w-full">{busy ? t('dl_verify_busy') : t('dl_verify')}</Button>
          </div>
        )}
      </div>
    </div>
  )
}
