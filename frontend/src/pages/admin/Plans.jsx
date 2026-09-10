import { useEffect, useState } from 'react'
import { Save, RotateCcw, Sparkles } from 'lucide-react'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
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

export default function Plans() {
  const { showToast } = useToast()
  const { t } = useLang()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [plans, setPlans] = useState([])

  const load = async () => {
    try {
      const d = await api.adminPlans()
      setPlans(d.plans || [])
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const update = (i, key, val) => {
    const next = [...plans]
    next[i] = { ...next[i], [key]: val }
    setPlans(next)
  }

  const save = async () => {
    setSaving(true)
    try {
      await api.adminUpdatePlans({ plans })
      showToast('toast_config_saved', 'success')
      await load()
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-16 text-center text-ink-dim">{t('common_loading')}</div>

  return (
    <div className="w-full">
      <div className="flex items-center justify-end gap-2 mb-6">
        <Button variant="ghost" onClick={load} disabled={saving} className="justify-center">
          <RotateCcw size={16} /> {t('common_refresh')}
        </Button>
        <Button onClick={save} disabled={saving} className="justify-center">
          <Save size={16} /> {saving ? t('common_saving') : t('pl_save')}
        </Button>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {plans.map((p, i) => (
          <div
            key={p.id}
            className={`bg-surface border rounded-3xl p-5 sm:p-7 w-full flex flex-col transition-all ${
              p.highlight ? 'border-[var(--gold)] shadow-medium ring-1 ring-[var(--gold)]' : 'border-line'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-6 pb-4 border-b border-line">
              <div className="flex items-center gap-3">
                <input
                  value={p.name}
                  onChange={(e) => update(i, 'name', e.target.value)}
                  className="font-display font-bold text-2xl bg-surface-2 border border-line focus:border-[var(--gold)] text-ink outline-none px-3 py-1.5 rounded-xl shadow-xs"
                />
                {p.highlight && <Badge tone="gold"><Sparkles size={12} className="inline mr-1" /> Featured</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12.5px] font-bold text-ink-dim">{t('pl_highlight')}</span>
                <Toggle on={p.highlight} onClick={() => update(i, 'highlight', !p.highlight)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
              <Field label={t('pl_price')}>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-ink-dim font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={p.price}
                    onChange={(e) => update(i, 'price', Math.max(0, +e.target.value || 0))}
                    className="w-full pl-8 pr-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)] font-mono font-bold"
                  />
                </div>
              </Field>
              <Field label={t('pl_limit')} hint="-1 = Unlimited entries">
                <div className="relative flex items-center">
                  <input
                    value={p.entries_limit == null ? '' : p.entries_limit}
                    onChange={(e) => {
                      const v = e.target.value
                      update(i, 'entries_limit', v === '' ? null : v === '-1' ? null : Number(v))
                    }}
                    placeholder="-1 (Unlimited)"
                    className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)] font-mono font-bold"
                  />
                  {p.entries_limit === null && (
                    <span className="absolute right-3 text-xs font-bold text-green bg-green/10 px-2 py-0.5 rounded-md">Unlimited</span>
                  )}
                </div>
              </Field>
              <Field label={t('pl_tag')}>
                <input
                  value={p.tag || ''}
                  onChange={(e) => update(i, 'tag', e.target.value)}
                  placeholder="popular / starter / pro"
                  className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)] font-medium"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('pl_features_en')} hint="Enter each feature point on a new line (English)">
                <textarea
                  value={(p.features_en || []).join('\n')}
                  onChange={(e) => update(i, 'features_en', e.target.value.split('\n'))}
                  rows={5}
                  className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[13.5px] outline-none focus:border-[var(--gold)] leading-relaxed font-mono"
                />
              </Field>

              <Field label={t('pl_features_hi')} hint="Enter each feature point on a new line (Hindi)">
                <textarea
                  value={(p.features_hi || []).join('\n')}
                  onChange={(e) => update(i, 'features_hi', e.target.value.split('\n'))}
                  rows={5}
                  className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface-2 text-ink text-[13.5px] outline-none focus:border-[var(--gold)] leading-relaxed font-mono"
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}