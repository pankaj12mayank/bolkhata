import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import Button from '../components/Button'
import OtpInput from '../components/OtpInput'
import { useAuth } from '../context/AuthContext'
import { useShopData } from '../context/ShopDataContext'
import { useToast } from '../context/ToastContext'
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
    if (!/^\d{10}$/.test(phone)) { setPhoneErr('Sahi 10-ank ka number daalein'); return }
    setPhoneErr('')
    setBusy(true)
    try {
      const res = await api.sendOtp(phone)
      setStep('otp')
      setOtp(['', '', '', ''])
      startResendTimer()
      showToast(`OTP bhej diya gaya (dev: ${res.dev_otp})`)
    } catch (e) {
      showToast(e.message)
    } finally {
      setBusy(false)
    }
  }

  const verifyOtp = async () => {
    if (otp.some(v => !v)) { setOtpErr('Poora OTP daalein'); return }
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
      setOtpErr(e.message)
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
      <div className="absolute top-8 left-1/2 -translate-x-1/2"><Logo /></div>
      <div className="bg-surface border border-line rounded-3xl p-9 max-w-[400px] w-full shadow-deep">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-ink-dim text-[13px] font-bold mb-5 hover:text-gold">← Wapas jaayein</Link>

        <div className="flex bg-surface-2 rounded-full p-1 mb-6 border border-line">
          <button onClick={() => switchTab(false)} className={`flex-1 text-center py-2.5 rounded-full text-[13px] font-bold transition-all ${!registerMode ? 'text-[#1A1206]' : 'text-ink-dim'}`}
            style={!registerMode ? { background: 'linear-gradient(135deg,var(--gold),var(--gold-deep))' } : {}}>Login</button>
          <button onClick={() => switchTab(true)} className={`flex-1 text-center py-2.5 rounded-full text-[13px] font-bold transition-all ${registerMode ? 'text-[#1A1206]' : 'text-ink-dim'}`}
            style={registerMode ? { background: 'linear-gradient(135deg,var(--gold),var(--gold-deep))' } : {}}>Nayi Dukaan</button>
        </div>

        <h1 className="font-display font-normal text-[26px] mb-1.5">{registerMode ? 'Nayi Dukaan Register Karein' : 'Namaste, phir se swagat hai'}</h1>
        <p className="text-ink-dim text-[13.5px] mb-2">{registerMode ? 'Phone number se shuru karein' : 'Apna registered phone number daalein'}</p>
        {!registerMode && <p className="text-ink-dim text-[12px] mb-4">Demo shop try karne ke liye: <b className="text-gold">9876543210</b></p>}

        {step === 'phone' && (
          <div>
            <div className="mb-4">
              <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Phone Number</label>
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
            <Button onClick={sendOtp} disabled={busy} className="w-full">{busy ? 'Bhej rahe hain...' : 'OTP Bhejein'}</Button>
          </div>
        )}

        {step === 'otp' && (
          <div>
            <p className="text-[13px] text-ink-dim text-center mb-3.5">OTP <b className="text-ink">+91 {phone}</b> par bheja gaya</p>
            <OtpInput values={otp} onChange={setOtp} length={4} />
            {otpErr && <div className="text-maroon text-xs text-center mb-2">{otpErr}</div>}
            <div className="text-center text-[12.5px] text-ink-dim mb-[18px]">
              {resendIn > 0
                ? <span className="opacity-60">OTP dobara bhejein ({resendIn}s)</span>
                : <button onClick={sendOtp} className="text-gold font-bold">OTP dobara bhejein</button>}
            </div>
            <Button onClick={verifyOtp} disabled={busy} className="w-full">{busy ? 'Verify ho raha hai...' : 'Verify & Login'}</Button>
          </div>
        )}
      </div>
    </div>
  )
}
