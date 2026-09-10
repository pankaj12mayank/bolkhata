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
          <button className="text-gold font-bold text-[13.5px]">{t('al_forgot')}</button>
        </div>
        <Button onClick={submit} disabled={loading} className="w-full">
          {loading ? <><span className="w-4 h-4 rounded-full border-2 border-[rgba(26,18,6,.3)] border-t-[#1A1206] animate-spin inline-block" /> {t('al_verify')}</> : t('al_btn')}
        </Button>
      </div>
    </div>
  )
}
