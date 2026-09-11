import { useState, useEffect } from 'react'
import { useShopData } from '../../context/ShopDataContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useLang } from '../../context/LangContext'
import { api } from '../../lib/api'
import Button from '../../components/Button'
import Badge from '../../components/Badge'

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => reject(new Error('Razorpay SDK load fail'))
    document.body.appendChild(s)
  })
}

export default function Billing() {
  const { plan, refreshAll, upgradePlan } = useShopData()
  const { shopProfile } = useAuth()
  const { showToast } = useToast()
  const { t } = useLang()
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState('idle') // idle|mock
  const [history, setHistory] = useState(null)

  const loadHistory = async () => {
    try { setHistory(await api.billingHistory()) } catch { setHistory([]) }
  }
  useEffect(() => { loadHistory() }, [])

  const isFree = plan.tier === 'Free'
  const isStandard = plan.tier === 'Standard'
  const pct = isFree || isStandard ? Math.min(100, (plan.used / plan.limit) * 100) : 100
  const priceLabel = plan.price || 99
  const standardPrice = plan.standard_price || 49
  const standardLimit = plan.standard_limit || 500
  const [tierChoice, setTierChoice] = useState('Paid')

  const payReal = async (tier='Paid') => {
    setBusy(true)
    try {
      const order = await api.createBillingOrder(tier)
      if (order.mock) {
        // Mock flow — directly verify without Razorpay UI
        // Show mock card path
        setMode('mock')
        setTierChoice(tier)
        // Auto-verify mock
        await api.verifyBilling({ razorpay_order_id: order.order_id, razorpay_payment_id: 'pay_mock_' + Date.now(), razorpay_signature: 'mock' })
        await refreshAll()
        loadHistory()
        showToast('toast_payment_success_mock', 'success', { tier })
        setBusy(false)
        return
      }
      // Real Razorpay checkout
      await loadRazorpay()
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'BolKhata',
        description: `Paid Plan — ₹${priceLabel}/mahina`,
        order_id: order.order_id,
        prefill: { name: shopProfile?.ownerName || '', contact: shopProfile?.phone || '' },
        theme: { color: '#E8A93B' },
        handler: async function (resp) {
          try {
            await api.verifyBilling({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            })
            await refreshAll()
            loadHistory()
            showToast('toast_payment_success_paid')
          } catch (e) {
            showToast(e.message)
          } finally {
            setBusy(false)
          }
        },
        modal: { ondismiss: () => setBusy(false) }
      }
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (r) { showToast(r.error?.description || 'toast_payment_failed'); setBusy(false) })
      rzp.open()
    } catch (e) {
      showToast(e.message)
      // Fallback to legacy mock if create-order not available or error
      if (e.message.includes('mock') || e.message.includes('real payments')) {
        try {
          await upgradePlan()
          await refreshAll()
          showToast('toast_mock_upgrade')
        } catch {}
      }
      setBusy(false)
    }
  }

  const payMockDirect = async (tier='Paid')=>{
    setBusy(true)
    try{
      await api.upgradeBilling(tier)
      await refreshAll()
      loadHistory()
      showToast('toast_payment_mock', 'success', { tier })
    } catch(e){ showToast(e.message)} finally{ setBusy(false); setMode('idle') }
  }

  return (
    <div className="w-full">

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 sm:gap-5">
        <div className="bg-surface border border-line rounded-3xl p-4 sm:p-7">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px] px-3 py-1.5 rounded-full bg-[rgba(232,169,59,.15)] text-gold font-bold uppercase tracking-wide">{t('bl_plan', { tier: plan.tier })}</span>
          <h2 className="font-display font-normal text-[26px] mt-3.5">
            {isFree ? '₹0' : `₹${priceLabel}`} <span className="text-sm text-ink-dim font-body font-semibold">{t('bl_per_month')}</span>
          </h2>
          <div className="h-2.5 rounded-md bg-surface-2 overflow-hidden my-3">
            <div className="h-full rounded-md transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,var(--gold),var(--gold-deep))' }} />
          </div>
          <p className="text-[13px] text-ink-dim">
            {isFree ? t('bl_used_free', { used: plan.used, limit: plan.limit }) : t('bl_used_paid', { limit: plan.limit === 999999 ? '∞' : plan.limit })}
          </p>

          {isFree && (
            <div className="bg-surface-2 border border-line rounded-2xl p-6 mt-4">
              <b className="text-[15px]">{t('bl_upgrade')}</b>
              <p className="text-ink-dim text-[13.5px] my-2">{t('bl_free_copy')} {plan.limit !== 100 && t('bl_admin_limit', { limit: plan.limit })}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <button onClick={()=>setTierChoice('Standard')} className={`p-4 rounded-2xl border-2 text-left ${tierChoice==='Standard'?'border-[var(--gold)] bg-[rgba(232,169,59,.08)]':'border-line bg-surface'}`}>
                  <div className="font-mono text-xs uppercase tracking-wide text-ink-dim">Standard</div>
                  <div className="font-display text-2xl">₹{standardPrice}<span className="text-xs font-body">/mo</span></div>
                  <div className="text-xs text-ink-dim mt-1">{t('bl_entries_mo', { n: standardLimit })}</div>
                  <div className="text-[11px] text-green mt-1">{t('bl_offline_cash')}</div>
                </button>
                <button onClick={()=>setTierChoice('Paid')} className={`p-4 rounded-2xl border-2 text-left ${tierChoice==='Paid'?'border-[var(--gold)] bg-[rgba(232,169,59,.08)]':'border-line bg-surface'}`}>
                  <div className="font-mono text-xs uppercase tracking-wide text-ink-dim">Paid <span className="ml-1 px-1.5 py-0.5 rounded bg-[var(--gold)] text-[#1A1206] text-[9px]">{t('bl_popular')}</span></div>
                  <div className="font-display text-2xl">₹{priceLabel}<span className="text-xs font-body">/mo</span></div>
                  <div className="text-xs text-ink-dim mt-1">{t('bl_unlimited')}</div>
                  <div className="text-[11px] text-green mt-1">{t('bl_priority_ai')}</div>
                </button>
              </div>
              {mode === 'mock' ? (
                <div className="mt-4">
                  <div className="rounded-2xl p-5 mb-4 relative overflow-hidden text-[#F3E9DA]" style={{ background: 'linear-gradient(135deg,#2C2438,#1B1622)' }}>
                    <div className="w-[34px] h-6 rounded mb-5" style={{ background: 'linear-gradient(145deg,var(--gold),var(--gold-deep))' }} />
                    <div className="font-mono text-base tracking-[2px]">•••• •••• •••• 4821</div>
                    <div className="flex justify-between mt-4 text-[11px] opacity-75 font-mono">
                      <span>{shopProfile?.ownerName?.toUpperCase() || 'DUKAANDAAR'}</span><span>{t('bl_mock_card', { tier: tierChoice })}</span>
                    </div>
                  </div>
                  <Button onClick={()=>payMockDirect(tierChoice)} disabled={busy} className="w-full">{busy ? t('bl_process_short') : t('bl_mock_pay', { amount: tierChoice==='Paid'?priceLabel:standardPrice, tier: tierChoice })}</Button>
                  <button onClick={()=>setMode('idle')} className="w-full mt-2 text-[12.5px] text-ink-dim">{t('bl_back')}</button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-4">
                  <Button onClick={()=>payReal(tierChoice)} disabled={busy} className="w-full">{busy ? t('bl_process') : t('bl_upgrade_btn', { tier: tierChoice, amount: tierChoice==='Paid'?priceLabel:standardPrice })}</Button>
                  <span className="text-[11.5px] text-ink-dim text-center">{t('bl_real_note')}</span>
                </div>
              )}
            </div>
          )}
          {isStandard && <div className="mt-4 bg-[rgba(232,169,59,.12)] border border-[var(--gold)] rounded-xl p-3 text-[13.5px] text-ink font-bold text-center">{t('bl_std_active', { limit: standardLimit })}</div>}
          {!isFree && !isStandard && <div className="mt-4 bg-[rgba(79,163,122,.12)] border border-green rounded-xl p-3 text-[13.5px] text-green font-bold text-center">{t('bl_paid_active')}</div>}
        </div>

        <div className="bg-surface border border-line rounded-3xl p-6">
          <h3 className="font-extrabold text-[16.5px] mb-4">{t('bl_comparison')}</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-line"><td className="py-3">{t('bl_row_entries')}</td><td className="font-mono py-3">{plan.limit === 999999 ? '∞' : plan.limit}</td><td className="font-mono py-3">Unlimited</td></tr>
              <tr className="border-b border-line"><td className="py-3">{t('bl_row_customers')}</td><td className="py-3">✓</td><td className="py-3">✓</td></tr>
              <tr className="border-b border-line"><td className="py-3">{t('bl_row_wa')}</td><td className="py-3">✓</td><td className="py-3">✓</td></tr>
              <tr className="border-b border-line"><td className="py-3">{t('bl_row_voice')}</td><td className="py-3">✓</td><td className="py-3">✓ (priority)</td></tr>
              <tr><td className="py-3">{t('bl_row_price')}</td><td className="font-bold py-3">₹0</td><td className="font-bold py-3">₹{priceLabel}</td></tr>
            </tbody>
          </table>
          <p className="text-[11.5px] text-ink-dim mt-3">{t('bl_footer')}</p>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-3xl p-4 sm:p-6 mt-4 sm:mt-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-[16.5px]">{t('bl_history_title')}</h3>
            <p className="text-ink-dim text-[12.5px] mt-0.5">{t('bl_history_sub')}</p>
          </div>
          {history && history.length > 0 && <Badge tone="gold">{history.length}</Badge>}
        </div>
        {history === null ? (
          <div className="text-ink-dim py-8 text-center text-sm">{t('common_loading')}</div>
        ) : history.length === 0 ? (
          <div className="text-ink-dim py-8 text-center text-sm">{t('bl_history_empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead><tr className="text-left font-mono text-[11px] uppercase tracking-wide text-ink-dim border-b border-line bg-surface-2">
                <th className="p-3.5">{t('bl_history_plan')}</th><th>{t('bl_history_amount')}</th><th>{t('bl_history_status')}</th><th>{t('bl_history_ref')}</th><th>{t('bl_history_date')}</th>
              </tr></thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id} className="border-b border-line last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="p-3.5 font-bold">{h.amount === standardPrice ? 'Standard' : 'Paid'}</td>
                    <td className="font-mono">₹{Math.round(h.amount)}</td>
                    <td><Badge tone={h.status === 'Success' ? 'green' : h.status === 'Pending' ? 'gold' : 'red'}>{h.status}</Badge></td>
                    <td className="font-mono text-[12px] sm:text-sm break-all max-w-[200px] truncate">{h.order_id || h.razorpay_id || '—'}</td>
                    <td className="font-mono text-[12px] sm:text-sm">{h.created_at ? new Date(h.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
