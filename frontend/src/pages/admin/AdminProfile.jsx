import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { useToast } from '../../context/ToastContext'
import { api } from '../../lib/api'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import SecretInput from '../../components/SecretInput'

function Field({ label, hint, children }) {
  return (
    <div className="mb-4">
      <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-ink-dim mt-1">{hint}</p>}
    </div>
  )
}

export default function AdminProfile() {
  const { setAdminProfile } = useAuth()
  const { showToast } = useToast()
  const { t } = useLang()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.adminProfile().then(p => {
      setName(p.name || '')
      setEmail(p.email || '')
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    if (!name.trim()) { showToast('ap_name_err'); return }
    setBusy(true)
    try {
      const payload = { name: name.trim() }
      if (email.trim()) payload.email = email.trim()
      if (password.trim()) payload.password = password.trim()
      const res = await api.updateAdminProfile(payload)
      setAdminProfile({ name: res.name, email: res.email })
      setPassword('')
      showToast('ap_saved', 'success')
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="py-16 text-center text-ink-dim">{t('common_loading')}</div>

  return (
    <div className="w-full">

      <div className="flex flex-col gap-5 w-full">
        <div className="bg-surface border border-line rounded-3xl p-5 sm:p-7 w-full">
          <Field label={t('ap_lbl_name')}>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)]" />
          </Field>
          <Field label={t('ap_lbl_email')} hint="Email is primary key (non-editable)">
            <input type="email" value={email} disabled className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink-dim text-[14.5px] outline-none cursor-not-allowed opacity-80" />
          </Field>
          <Field label={t('ap_lbl_password')} hint={t('ap_pw_hint')}>
            <SecretInput value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
          </Field>
          <Button onClick={save} disabled={busy}>{busy ? t('ap_btn_busy') : t('ap_btn_save')}</Button>
        </div>

        <div className="bg-surface border border-line rounded-3xl p-5 sm:p-7 w-full">
          <b className="block text-[15px] mb-4">{t('ap_info_t')}</b>
          <div className="flex items-center justify-between py-4 border-b border-line">
            <div><b className="block text-[14.5px]">{t('ap_info_email')}</b><span className="text-[12.5px] text-ink-dim break-all">{email || '-'}</span></div>
          </div>
          <div className="flex items-center justify-between py-4 border-b border-line">
            <div><b className="block text-[14.5px]">{t('ap_info_role')}</b><span className="text-[12.5px] text-ink-dim">{t('role_admin_panel')}</span></div>
            <Badge tone="gold">{t('role_admin_panel')}</Badge>
          </div>
          <div className="py-4">
            <b className="block text-[14.5px]">{t('ap_info_note')}</b>
            <span className="text-[12.5px] text-ink-dim mt-1 block">{t('ap_pw_hint')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}