import { useState } from 'react'
import { useShopData } from '../../context/ShopDataContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { api } from '../../lib/api'
import Button from '../../components/Button'

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
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState('idle') // idle|mock

  const isFree = plan.tier === 'Free'
  const pct = isFree ? Math.min(100, (plan.used / plan.limit) * 100) : 100
  const priceLabel = plan.price || 99

  const payReal = async () => {
    setBusy(true)
    try {
      const order = await api.createBillingOrder()
      if (order.mock) {
        // Mock flow — directly verify without Razorpay UI
        // Show mock card path
        setMode('mock')
        // Auto-verify mock
        await api.verifyBilling({ razorpay_order_id: order.order_id, razorpay_payment_id: 'pay_mock_' + Date.now(), razorpay_signature: 'mock' })
        await refreshAll()
        showToast('Payment safal ✓ — Mock mode, Paid activate ho gaya (real keys lagao to real payment hoga)')
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
            showToast('Payment safal ✓ — Paid plan active!')
          } catch (e) {
            showToast(e.message)
          } finally {
            setBusy(false)
          }
        },
        modal: { ondismiss: () => setBusy(false) }
      }
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (r) { showToast(r.error?.description || 'Payment fail'); setBusy(false) })
      rzp.open()
    } catch (e) {
      showToast(e.message)
      // Fallback to legacy mock if create-order not available or error
      if (e.message.includes('mock') || e.message.includes('real payments')) {
        try {
          await upgradePlan()
          await refreshAll()
          showToast('Mock upgrade safal ✓')
        } catch {}
      }
      setBusy(false)
    }
  }

  const payMockDirect = async ()=>{
    setBusy(true)
    try{
      await upgradePlan()
      await refreshAll()
      showToast('Mock payment safal ✓ — Paid')
    } catch(e){ showToast(e.message)} finally{ setBusy(false); setMode('idle') }
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="font-display font-normal text-[24px] sm:text-[28px]">Plan &amp; Billing</h1>
        <p className="text-ink-dim text-[13px] sm:text-[14.5px] mt-1">Apna plan dekhein aur zaroorat padne par upgrade karein. Admin ne price <b>₹{priceLabel}</b> set kiya hai — real Razorpay yahi se chalega.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 sm:gap-5">
        <div className="bg-surface border border-line rounded-3xl p-4 sm:p-7">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px] px-3 py-1.5 rounded-full bg-[rgba(232,169,59,.15)] text-gold font-bold uppercase tracking-wide">{plan.tier} Plan</span>
          <h2 className="font-display font-normal text-[26px] mt-3.5">
            {isFree ? '₹0' : `₹${priceLabel}`} <span className="text-sm text-ink-dim font-body font-semibold">/ mahina</span>
          </h2>
          <div className="h-2.5 rounded-md bg-surface-2 overflow-hidden my-3">
            <div className="h-full rounded-md transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,var(--gold),var(--gold-deep))' }} />
          </div>
          <p className="text-[13px] text-ink-dim">
            {isFree ? `${plan.used} / ${plan.limit} voice entries is mahine istemaal hui (Admin se change hoga)` : `Unlimited — Paid active, limit ${plan.limit === 999999 ? '∞' : plan.limit}`}
          </p>

          {isFree && (
            <div className="bg-surface-2 border border-line rounded-2xl p-6 mt-4">
              <b className="text-[15px]">Paid Plan mein upgrade karein</b>
              <p className="text-ink-dim text-[13.5px] my-2">Unlimited entries + Hinglish/Hindi/English voice accuracy — sirf <b>₹{priceLabel}/mahina</b>. {plan.limit !== 15 && `(Admin ne Free limit ${plan.limit} kiya)`}</p>
              {mode === 'mock' ? (
                <div>
                  <div className="rounded-2xl p-5 mb-4 relative overflow-hidden text-[#F3E9DA]" style={{ background: 'linear-gradient(135deg,#2C2438,#1B1622)' }}>
                    <div className="w-[34px] h-6 rounded mb-5" style={{ background: 'linear-gradient(145deg,var(--gold),var(--gold-deep))' }} />
                    <div className="font-mono text-base tracking-[2px]">•••• •••• •••• 4821</div>
                    <div className="flex justify-between mt-4 text-[11px] opacity-75 font-mono">
                      <span>{shopProfile?.ownerName?.toUpperCase() || 'DUKAANDAAR'}</span><span>Razorpay (mock — keys nahi lagi)</span>
                    </div>
                  </div>
                  <Button onClick={payMockDirect} disabled={busy} className="w-full">{busy ? 'Process...' : `₹${priceLabel} Mock Pay Karein`}</Button>
                  <button onClick={()=>setMode('idle')} className="w-full mt-2 text-[12.5px] text-ink-dim">Wapas</button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button onClick={payReal} disabled={busy} className="w-full">{busy ? 'Process ho raha hai...' : `Upgrade Karein — ₹${priceLabel} Pay`}</Button>
                  <span className="text-[11.5px] text-ink-dim text-center">Real Razorpay khulega agar Admin ne keys lagayi hain, warna mock chalega. Test Admin → Settings → Razorpay Test.</span>
                </div>
              )}
            </div>
          )}
          {!isFree && <div className="mt-4 bg-[rgba(79,163,122,.12)] border border-green rounded-xl p-3 text-[13.5px] text-green font-bold text-center">✓ Paid active — Unlimited entries, voice Hinglish/Hindi/English sab chalega</div>}
        </div>

        <div className="bg-surface border border-line rounded-3xl p-6">
          <h3 className="font-extrabold text-[16.5px] mb-4">Plan Comparison</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-line"><td className="py-3">Entries / mahina</td><td className="font-mono py-3">{plan.limit === 999999 ? '∞' : plan.limit}</td><td className="font-mono py-3">Unlimited</td></tr>
              <tr className="border-b border-line"><td className="py-3">Grahak list & balance</td><td className="py-3">✓</td><td className="py-3">✓</td></tr>
              <tr className="border-b border-line"><td className="py-3">WhatsApp reminder</td><td className="py-3">✓</td><td className="py-3">✓</td></tr>
              <tr className="border-b border-line"><td className="py-3">Voice — Hinglish/Hindi/English</td><td className="py-3">✓</td><td className="py-3">✓ (priority)</td></tr>
              <tr><td className="py-3">Price</td><td className="font-bold py-3">₹0</td><td className="font-bold py-3">₹{priceLabel}</td></tr>
            </tbody>
          </table>
          <p className="text-[11.5px] text-ink-dim mt-3">Price & limit Admin → Settings se live badalta hai. Postgres pe bhi same.</p>
        </div>
      </div>
    </div>
  )
}
