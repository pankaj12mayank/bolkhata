import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../lib/api'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [emailErr, setEmailErr] = useState(false)
  const [passErr, setPassErr] = useState(false)
  const [formErr, setFormErr] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginWithToken } = useAuth()
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
      setFormErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-app text-ink flex items-center justify-center px-5 py-8 relative">
      <div className="grain" />
      <div className="absolute top-8 left-1/2 -translate-x-1/2"><Logo /></div>
      <div className="bg-surface border border-line rounded-3xl p-9 max-w-[400px] w-full shadow-deep">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-ink-dim text-[13px] font-bold mb-5 hover:text-gold">← Wapas jaayein</Link>
        <h1 className="font-display font-normal text-[26px] mb-1.5">Admin Login</h1>
        <p className="text-ink-dim text-[13.5px] mb-2">Sirf authorized BolKhata team ke liye</p>
        <p className="text-ink-dim text-[12px] mb-6">Demo: <b className="text-gold">admin@bolkhata.in</b> / <b className="text-gold">admin123</b></p>

        <div className="mb-4">
          <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@bolkhata.in"
            className={`w-full px-3.5 py-3 rounded-xl border bg-surface-2 text-ink text-[14.5px] outline-none ${emailErr ? 'border-maroon' : 'border-line focus:border-[var(--gold)]'}`} />
          {emailErr && <div className="text-maroon text-xs mt-1.5">Sahi email daalein</div>}
        </div>
        <div className="mb-2 relative">
          <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">Password</label>
          <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            className={`w-full px-3.5 py-3 rounded-xl border bg-surface-2 text-ink text-[14.5px] outline-none ${passErr ? 'border-maroon' : 'border-line focus:border-[var(--gold)]'}`} />
          <button onClick={() => setShowPw(s => !s)} className="absolute right-3.5 top-[38px] text-ink-dim text-[11.5px] font-extrabold tracking-wide">
            {showPw ? 'CHUPAO' : 'DIKHAO'}
          </button>
          {passErr && <div className="text-maroon text-xs mt-1.5">Password zaroori hai</div>}
        </div>
        {formErr && <div className="text-maroon text-xs mt-1 mb-2">{formErr}</div>}
        <div className="flex justify-end mb-5 mt-2">
          <button className="text-gold font-bold text-[13.5px]">Password bhool gaye?</button>
        </div>
        <Button onClick={submit} disabled={loading} className="w-full">
          {loading ? <><span className="w-4 h-4 rounded-full border-2 border-[rgba(26,18,6,.3)] border-t-[#1A1206] animate-spin inline-block" /> Verify ho raha hai...</> : 'Login'}
        </Button>
      </div>
    </div>
  )
}
