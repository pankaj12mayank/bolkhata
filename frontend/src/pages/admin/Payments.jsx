import { useEffect, useState } from 'react'
import { Save, RotateCcw, TestTube2, Check, Copy } from 'lucide-react'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import SecretInput from '../../components/SecretInput'
import { useToast } from '../../context/ToastContext'
import { useLang } from '../../context/LangContext'
import { api } from '../../lib/api'

function Toggle({ on, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-11 h-6 rounded-full relative flex-shrink-0 border transition-colors ${
        on ? 'bg-[rgba(79,163,122,.2)] border-green' : 'bg-surface-2 border-line'
      }`}
    >
      <div
        className={`absolute top-0.5 w-[18px] h-[18px] rounded-full transition-transform ${
          on ? 'translate-x-5 bg-green' : 'translate-x-0.5 bg-ink-dim'
        }`}
      />
    </button>
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

export default function Payments() {
  const { showToast } = useToast()
  const { t } = useLang()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(null)
  const [diag, setDiag] = useState({})
  const [copied, setCopied] = useState(false)

  const [keyId, setKeyId] = useState('')
  const [keySecret, setKeySecret] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [testMode, setTestMode] = useState(true)

  const load = async () => {
    try {
      const s = await api.getSettings()
      const r = await api.getSettingsRaw().catch(() => null)
      if (r) setDiag(r)
      setKeyId(s.razorpay_key_id || '')
      setKeySecret(s.razorpay_key_secret || '')
      setWebhookSecret(s.razorpay_webhook_secret || '')
      setTestMode(s.razorpay_test_mode === 'true')
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
      await api.updateSettings({
        razorpay_key_id: keyId,
        razorpay_key_secret: keySecret,
        razorpay_webhook_secret: webhookSecret,
        razorpay_test_mode: testMode ? 'true' : 'false',
      })
      showToast('toast_config_saved', 'success')
      await load()
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const test = async () => {
    setTesting('rz')
    try {
      const res = await api.testRazorpayCustom({ key_id: keyId, key_secret: keySecret })
      showToast(res.message, res.success ? 'success' : 'error')
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setTesting(null)
    }
  }

  const webhookUrl = `${import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'}/billing/webhook`

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    showToast('Webhook URL copied ✓', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="py-16 text-center text-ink-dim">{t('common_loading')}</div>

  const configured = !!diag._razorpay_configured

  return (
    <div className="w-full">
      <div className="flex justify-end gap-2 mb-6 w-full">
        <Button variant="ghost" onClick={load} disabled={saving} className="justify-center">
          <RotateCcw size={16} /> {t('common_refresh')}
        </Button>
        <Button onClick={save} disabled={saving} className="justify-center">
          <Save size={16} /> {saving ? t('common_saving') : 'Save Settings'}
        </Button>
      </div>

      <div className="flex flex-col gap-5 w-full">
        {/* Full-width Card 1: Key Configuration */}
        <div className="bg-surface border border-line rounded-3xl p-5 sm:p-7 w-full">
          <div className="flex items-center justify-between gap-2 mb-4">
            <b className="block text-[15px]">{t('pay_key')}</b>
            <Badge tone={configured ? 'green' : 'gold'}>
              {configured ? t('pay_live') : t('pay_mock')}
            </Badge>
          </div>

          <Field label={t('pay_key_id')}>
            <input
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              placeholder="rzp_test_xxx"
              className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)] font-mono"
            />
          </Field>

          <Field label={t('pay_secret')}>
            <SecretInput
              value={keySecret}
              onChange={(e) => setKeySecret(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          <Field label={t('pay_webhook_secret')}>
            <SecretInput
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder="whsec_..."
            />
          </Field>

          <div className="flex items-center justify-between py-3 my-2 border-t border-b border-line">
            <div>
              <b className="block text-[14.5px]">{t('pay_test_mode')}</b>
              <span className="text-[12px] text-ink-dim">{t('pay_test_mode_note')}</span>
            </div>
            <Toggle on={testMode} onClick={() => setTestMode((v) => !v)} />
          </div>

          <Button variant="secondary" onClick={test} disabled={testing === 'rz'} className="w-full mt-4 justify-center">
            {testing === 'rz' ? t('common_saving') : <><TestTube2 size={16} /> {t('pay_test')}</>}
          </Button>
        </div>

        {/* Full-width Card 2: Webhook & Status */}
        <div className="bg-surface border border-line rounded-3xl p-5 sm:p-7 w-full">
          <b className="block text-[15px] mb-2">{t('pay_webhook_title')}</b>

          <div className="bg-surface-2 rounded-2xl p-4 border border-line mb-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11.5px] font-bold text-ink-dim uppercase tracking-wider">Webhook Endpoint</span>
              <button
                type="button"
                onClick={copyWebhook}
                className="text-xs text-gold font-bold flex items-center gap-1 hover:underline"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="break-all font-mono text-[12.5px] text-ink">{webhookUrl}</div>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between py-3 border-b border-line">
              <div>
                <b className="block text-[14.5px]">{t('pay_mode')}</b>
              </div>
              <Badge tone={testMode ? 'gold' : 'green'}>
                {testMode ? t('pay_test_mode') : t('pay_live')}
              </Badge>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-line">
              <div>
                <b className="block text-[14.5px]">{t('pay_connected')}</b>
              </div>
              <Badge tone={configured ? 'green' : 'red'}>
                {configured ? t('pay_yes') : t('pay_no')}
              </Badge>
            </div>

            <div className="py-3">
              <b className="block text-[14.5px]">Webhook Events</b>
              <span className="text-[12.5px] text-ink-dim mt-1 block">
                Listen for <code className="px-1.5 py-0.5 rounded bg-surface-2 border border-line font-mono text-xs">payment.captured</code> and <code className="px-1.5 py-0.5 rounded bg-surface-2 border border-line font-mono text-xs">payment.failed</code>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}