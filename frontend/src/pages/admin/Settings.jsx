import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers,
  Bell,
  Globe,
  Clock,
  KeyRound,
  MessageSquare,
  Save,
  ShieldAlert,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Toggle from '../../components/Toggle'
import Select from '../../components/Select'
import { useToast } from '../../context/ToastContext'
import { useLang } from '../../context/LangContext'
import { api } from '../../lib/api'

function ToggleRow({ title, description, icon: Icon, on, onClick }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-2 border border-line transition-colors">
      <div className="flex items-center gap-3.5 min-w-0 pr-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Icon size={18} />
          </div>
        )}
        <div className="min-w-0">
          <div className="font-bold text-sm text-ink truncate">{title}</div>
          {description && <div className="text-xs text-ink-dim mt-0.5 leading-snug">{description}</div>}
        </div>
      </div>
      <Toggle on={on} onClick={onClick} />
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="mb-4">
      <label className="block text-[12.5px] font-bold text-ink-dim mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-ink-dim mt-1">{hint}</p>}
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { t } = useLang()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetConfirm, setResetConfirm] = useState('')

  const [limit, setLimit] = useState(100)
  const [price, setPrice] = useState(99)
  const [paidLimit, setPaidLimit] = useState(-1)
  const [defaultLang, setDefaultLang] = useState('Hindi')
  const [waTemplate, setWaTemplate] = useState('')
  const [autoReminder, setAutoReminder] = useState(true)
  const [autoReminderDay, setAutoReminderDay] = useState('mon')
  const [autoReminderTime, setAutoReminderTime] = useState('09:00')
  const [maintenance, setMaintenance] = useState(false)
  const [jwtExpiry, setJwtExpiry] = useState(10080)

  const load = async () => {
    setLoading(true)
    try {
      const s = await api.getSettings()
      setLimit(s.free_entries_limit ?? 100)
      setPrice(s.paid_price_inr ?? 99)
      setPaidLimit(s.paid_entries_limit ?? -1)
      setDefaultLang(s.default_language || 'Hindi')
      setWaTemplate(s.wa_template || '')
      setAutoReminder(s.auto_reminder === 'true')
      setAutoReminderDay(s.auto_reminder_day || 'mon')
      setAutoReminderTime(s.auto_reminder_time || '09:00')
      setMaintenance(s.maintenance_mode === 'true')
      setJwtExpiry(s.jwt_expire_minutes || 10080)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        free_entries_limit: parseInt(limit),
        paid_price_inr: parseInt(price),
        paid_entries_limit: parseInt(paidLimit),
        default_language: defaultLang,
        wa_template: waTemplate,
        auto_reminder: autoReminder ? 'true' : 'false',
        auto_reminder_day: autoReminderDay,
        auto_reminder_time: autoReminderTime,
        maintenance_mode: maintenance ? 'true' : 'false',
        jwt_expire_minutes: parseInt(jwtExpiry),
      }
      await api.updateSettings(payload)
      showToast('toast_settings_saved', 'success')
      load()
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const doReset = async () => {
    if (resetConfirm !== 'RESET') {
      showToast(t('sv_type_reset'), 'error')
      return
    }
    if (!confirm(t('sv_reset_confirm_q'))) return
    try {
      const r = await api.resetAllData({ confirm: 'RESET' })
      showToast(r.message || t('sv_reset_done'), 'success')
      setResetConfirm('')
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  if (loading) return <div className="py-16 text-center text-ink-dim">{t('common_loading')}</div>

  return (
    <div className="w-full">
      <div className="flex items-center justify-end gap-2 mb-6">
        <Button onClick={save} disabled={saving} className="justify-center">
          {saving ? t('sv_saving') : t('sv_save')}
        </Button>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* Banner linking to Plans Page */}
        <div className="bg-surface border border-line rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Layers size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <b className="text-base text-ink">Plan Pricing & Limits</b>
                <Badge tone="gold">Plans System</Badge>
              </div>
              <p className="text-xs text-ink-dim mt-1 leading-relaxed">
                Free, Standard (Pro), and Paid plan prices, entry limits, and feature lists are centrally managed under the Plans section.
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => navigate('/admin/plans')} className="shrink-0 justify-center gap-1.5">
            Manage Plans <ChevronRight size={16} />
          </Button>
        </div>

        {/* System Defaults */}
        <div className="bg-surface border border-line rounded-3xl p-5 sm:p-7 w-full">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-line">
            <Globe size={18} className="text-amber-500" />
            <b className="block text-[15px]">{t('sv_business_h')}</b>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('sv_default_lang')}>
              <Select value={defaultLang} onChange={(e) => setDefaultLang(e.target.value)}>
                <option>Hindi</option>
                <option>English</option>
              </Select>
            </Field>

            <Field label={t('sv_jwt')} hint={t('sv_jwt_hint')}>
              <div className="relative flex items-center">
                <input
                  type="number"
                  value={jwtExpiry}
                  onChange={(e) => setJwtExpiry(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)] font-mono"
                />
                <span className="absolute right-3.5 text-xs text-ink-dim font-mono">mins</span>
              </div>
            </Field>
          </div>
        </div>

        {/* WhatsApp & Auto-Reminders */}
        <div className="bg-surface border border-line rounded-3xl p-5 sm:p-7 w-full">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-line">
            <Bell size={18} className="text-amber-500" />
            <b className="block text-[15px]">Automated Reminders & WhatsApp</b>
          </div>

          <Field label={t('sv_wa_tmpl')} hint="Available tags: {name}, {balance}, {shop}">
            <textarea
              value={waTemplate}
              onChange={(e) => setWaTemplate(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[13.5px] outline-none focus:border-[var(--gold)] font-mono leading-relaxed"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Field label={t('sv_rem_day')}>
              <Select value={autoReminderDay} onChange={(e) => setAutoReminderDay(e.target.value)}>
                <option value="mon">{t('rem_day_mon')}</option>
                <option value="tue">{t('rem_day_tue')}</option>
                <option value="wed">{t('rem_day_wed')}</option>
                <option value="thu">{t('rem_day_thu')}</option>
                <option value="fri">{t('rem_day_fri')}</option>
                <option value="sat">{t('rem_day_sat')}</option>
                <option value="sun">{t('rem_day_sun')}</option>
              </Select>
            </Field>

            <Field label={t('sv_rem_time')}>
              <input
                type="time"
                value={autoReminderTime}
                onChange={(e) => setAutoReminderTime(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)] font-mono"
              />
            </Field>
          </div>

          <ToggleRow
            icon={MessageSquare}
            title={t('sv_auto_reminder')}
            description="Automatically schedule weekly WhatsApp reminder messages to customers with outstanding balances"
            on={autoReminder}
            onClick={() => setAutoReminder((v) => !v)}
          />
        </div>

        {/* System Controls */}
        <div className="bg-surface border border-line rounded-3xl p-5 sm:p-7 w-full">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-line">
            <SlidersHorizontal size={18} className="text-amber-500" />
            <b className="block text-[15px]">System Controls</b>
          </div>

          <ToggleRow
            icon={ShieldAlert}
            title={t('sv_maintenance')}
            description="Enable system maintenance mode to restrict non-admin access during updates"
            on={maintenance}
            onClick={() => setMaintenance((v) => !v)}
          />
        </div>

        {/* Danger Zone */}
        <div className="bg-surface border border-red-200 dark:border-red-900/60 rounded-3xl p-5 sm:p-7 w-full">
          <h3 className="font-bold text-red-600 dark:text-red-400 mb-2 text-base">{t('sv_danger_h')}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
            {t('sv_danger_a')} <b>{t('sv_danger_b')}</b>.{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t('sv_danger_c')}</span>
            {t('sv_danger_d')}{' '}
            <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold">RESET</code>{' '}
            {t('sv_danger_e')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
              placeholder={t('sv_reset_confirm')}
              className="flex-1 px-3.5 py-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-surface-2 text-ink text-sm outline-none focus:border-red-400 font-mono"
            />
            <Button
              variant="danger"
              onClick={doReset}
              disabled={resetConfirm !== 'RESET'}
              className="w-full sm:w-auto justify-center font-bold"
            >
              {t('sv_btn_reset')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}