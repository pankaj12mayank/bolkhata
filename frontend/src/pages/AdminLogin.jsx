import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../context/LangContext'
import { api } from '../lib/api'
import LangToggle from '../components/LangToggle'
import SecretInput from '../components/SecretInput'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [emailErr, setEmailErr] = useState(false)
  const [passErr, setPassErr] = useState(false)
  const [formErr, setFormErr] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginWithToken } = useAuth()
  const { showToast } = useToast()
  const { t, tl } = useLang()
  const navigate = useNavigate()

  const submit = async () => {
    const okEmail = /^\S+@\S+\.\S+$/.test(email)
    setEmailErr(!okEmail)
    setPassErr(!password)
    setFormErr('')
    if (!okEmail || !password) return
    setLoading(true)
    try {
      const res = await api.adminLogin(email, password)
      loginWithToken(res.token, 'admin')
      navigate('/admin')
    } catch (e) {
      setFormErr(tl(e.message))
    } finally {
      setLoading(false)
    }
  }

  const [resetOpen, setResetOpen] = useState(false)
  const [resetStep, setResetStep] = useState(1) // 1: request, 2: verify
  const [resetEmail, setResetEmail] = useState('')
  const [resetOtp, setResetOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetBusy, setResetBusy] = useState(false)
  const [resetMsg, setResetMsg] = useState('')

  const handleRequestReset = async () => {
    if (!resetEmail.trim()) { setResetMsg('Email daalna zaroori hai'); return }
    setResetBusy(true)
    setResetMsg('')
    try {
      const res = await api.requestPasswordReset('admin', resetEmail.trim())
      setResetStep(2)
      setResetMsg(res.message + (res.dev_otp ? ` (Dev OTP: ${res.dev_otp})` : ''))
      showToast(res.message, 'success')
    } catch (e) {
      setResetMsg(tl(e.message))
      showToast(e.message, 'error')
    } finally {
      setResetBusy(false)
    }
  }

  const handleVerifyReset = async () => {
    if (!resetOtp.trim() || !newPassword.trim()) {
      setResetMsg('OTP aur Naya Password dono zaroori hain')
      return
    }
    setResetBusy(true)
    setResetMsg('')
    try {
      const res = await api.verifyPasswordReset('admin', resetEmail.trim(), resetOtp.trim(), newPassword.trim())
      showToast(res.message || 'Password reset ho gaya!', 'success')
      if (res.token) {
        loginWithToken(res.token, 'admin')
        navigate('/admin')
      } else {
        setResetOpen(false)
      }
    } catch (e) {
      setResetMsg(tl(e.message))
      showToast(e.message, 'error')
    } finally {
      setResetBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-app text-ink flex items-center justify-center px-5 py-8 relative">
      <div className="grain" />
      <div className="absolute top-6 right-6"><LangToggle /></div>
      <Link to="/" className="absolute top-8 left-1/2 -translate-x-1/2"><Logo /></Link>
      <div className="bg-surface border border-line rounded-3xl p-9 max-w-[400px] w-full shadow-deep">
        <h1 className="font-display font-normal text-[26px] mb-1.5">{t('al_title')}</h1>
        <p className="text-ink-dim text-[13.5px] mb-6">{t('al_sub')}</p>

        <div className="mb-4">
          <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('al_email')}</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('al_email_ph')}
            className={`w-full px-3.5 py-3 rounded-xl border bg-surface-2 text-ink text-[14.5px] outline-none ${emailErr ? 'border-maroon' : 'border-line focus:border-[var(--gold)]'}`} />
          {emailErr && <div className="text-maroon text-xs mt-1.5">{t('al_email_err')}</div>}
        </div>
        <div className="mb-2">
          <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{t('al_password')}</label>
          <SecretInput value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={`w-full px-3.5 py-3 pr-10 rounded-xl border bg-surface-2 text-ink text-[14.5px] outline-none ${passErr ? 'border-maroon' : 'border-line focus:border-[var(--gold)]'}`} />
          {passErr && <div className="text-maroon text-xs mt-1.5">{t('al_password_err')}</div>}
        </div>
        {formErr && <div className="text-maroon text-xs mt-1 mb-2">{formErr}</div>}
        <div className="flex justify-end mb-5 mt-2">
          <button type="button" onClick={() => { setResetEmail(email || ''); setResetStep(1); setResetMsg(''); setResetOpen(true) }} className="text-gold font-bold text-[13.5px]">
            {t('al_forgot')}
          </button>
        </div>
        <Button onClick={submit} disabled={loading} className="w-full">
          {loading ? <><span className="w-4 h-4 rounded-full border-2 border-[rgba(26,18,6,.3)] border-t-[#1A1206] animate-spin inline-block" /> {t('al_verify')}</> : t('al_btn')}
        </Button>
      </div>

      {resetOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-line rounded-3xl p-6 sm:p-7 max-w-[420px] w-full shadow-deep">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-line">
              <b className="text-base text-ink font-bold">Admin Password Reset</b>
              <button type="button" onClick={() => setResetOpen(false)} className="text-slate-400 hover:text-ink text-sm">✕</button>
            </div>

            {!navigator.onLine && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 font-medium">
                ⚡ Offline Mode Active: Offline password changes are stored locally in device vault and synced automatically upon reconnection.
              </div>
            )}

            {resetStep === 1 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink-dim mb-1">Admin Email ID</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="admin@bolkhata.in"
                    className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-sm outline-none focus:border-[var(--gold)]"
                  />
                </div>
                {resetMsg && <div className="text-xs text-amber-500 font-medium">{resetMsg}</div>}
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setResetOpen(false)} className="flex-1 justify-center">Cancel</Button>
                  <Button onClick={handleRequestReset} disabled={resetBusy} className="flex-1 justify-center">
                    {resetBusy ? 'Sending...' : 'Send Reset OTP'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink-dim mb-1">Enter Reset OTP</label>
                  <input
                    value={resetOtp}
                    onChange={e => setResetOtp(e.target.value)}
                    placeholder="1234 / OTP"
                    className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-sm outline-none focus:border-[var(--gold)] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-dim mb-1">New Admin Password</label>
                  <SecretInput
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Naya password"
                  />
                </div>
                {resetMsg && <div className="text-xs text-amber-500 font-medium">{resetMsg}</div>}
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setResetStep(1)} className="flex-1 justify-center">Back</Button>
                  <Button onClick={handleVerifyReset} disabled={resetBusy} className="flex-1 justify-center">
                    {resetBusy ? 'Saving...' : 'Set Password'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
