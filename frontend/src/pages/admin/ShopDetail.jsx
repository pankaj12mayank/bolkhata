import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { api } from "../../lib/api"
import { initials, fmt } from "../../lib/format"
import Badge from "../../components/Badge"
import Button from "../../components/Button"
import GlobalPopup from "../../components/GlobalPopup"
import PageLoader from "../../components/PageLoader"
import { useToast } from "../../context/ToastContext"

export default function ShopDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [popup, setPopup] = useState({ open: false, type: null })
  const [actionLoading, setActionLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try { setShop(await api.adminShopDetail(id)) } catch(e){ showToast(e.message, "error") } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [id])

  const handleToggle = async () => {
    setActionLoading(true)
    try{
      const newState = shop.status === "Active" ? false : true
      const res = await api.toggleShopStatus(shop.id, newState)
      showToast(res.message, "success")
      load()
    } catch(e){ showToast(e.message, "error") } finally { setActionLoading(false); setPopup({ open:false, type:null }) }
  }
  const handleDelete = async () => {
    setActionLoading(true)
    try{
      const res = await api.deleteShop(shop.id)
      showToast(res.message, "success")
      navigate("/admin/shops")
    } catch(e){ showToast(e.message, "error"); setActionLoading(false); setPopup({ open:false, type:null }) }
  }

  if (loading) return <PageLoader />
  if (!shop) return (
    <div className="text-center py-16 text-ink-dim w-full px-4">
      <p className="mb-4">Shop not found.</p>
      <Link to="/admin/shops" className="text-gold font-bold">← Back to Shops</Link>
    </div>
  )

  return (
    <div className="w-full">
      <Link to="/admin/shops" className="inline-flex items-center gap-1.5 text-ink-dim text-[13.5px] font-bold mb-4 hover:text-gold">← Back to Shops</Link>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-extrabold text-xl text-[#1A1206] flex-shrink-0" style={{ background: "linear-gradient(145deg,var(--gold),var(--gold-deep))" }}>{initials(shop.shop_name)}</div>
          <div className="min-w-0"><h1 className="font-display font-normal text-[24px] sm:text-[28px] truncate">{shop.shop_name}</h1><p className="text-ink-dim text-[13px] sm:text-[14px] truncate">{shop.owner_name} • {shop.is_active ? "Active" : "Inactive"}</p></div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge tone={shop.plan_tier === "Paid" ? "green" : "gold"}>{shop.plan_tier} Plan</Badge>
          <Badge tone={shop.status === "Active" ? "green" : "red"}>{shop.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Button variant={shop.status === "Active" ? "danger" : "primary"} onClick={() => setPopup({ open:true, type:"toggle" })} disabled={actionLoading} className="w-full sm:w-auto">
          {shop.status === "Active" ? "Make Inactive" : "Make Active"}
        </Button>
        <Button variant="danger" onClick={() => setPopup({ open:true, type:"delete" })} disabled={actionLoading} className="w-full sm:w-auto">Permanently Delete</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-7">
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5"><div className="font-mono text-[24px] sm:text-[28px] font-semibold">{shop.customers_count}</div><div className="text-[12px] sm:text-[13px] text-ink-dim mt-0.5">Customers</div></div>
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5"><div className="font-mono text-[24px] sm:text-[28px] font-semibold">{shop.entries_count}</div><div className="text-[12px] sm:text-[13px] text-ink-dim mt-0.5">Total Entries</div></div>
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5"><div className="font-mono text-[22px] sm:text-[28px] font-semibold truncate">{fmt(shop.outstanding)}</div><div className="text-[12px] sm:text-[13px] text-ink-dim mt-0.5">Outstanding</div></div>
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5"><div className="font-mono text-[16px] sm:text-[18px] font-semibold">{new Date(shop.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div><div className="text-[12px] sm:text-[13px] text-ink-dim mt-0.5">Joined On</div></div>
      </div>

      <div className="bg-surface border border-line rounded-3xl p-4 sm:p-6 w-full overflow-hidden">
        <h3 className="font-extrabold text-[16px] sm:text-[16.5px] mb-4">Recent Activity</h3>
        {shop.activity.length === 0 ? (
          <p className="text-ink-dim text-[13px] sm:text-[13.5px]">No activity yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-sm min-w-[560px]">
              <thead><tr className="text-left font-mono text-[11px] uppercase tracking-wide text-ink-dim border-b border-line"><th className="py-2.5">Time</th><th>Status</th><th>Detail</th></tr></thead>
              <tbody>
                {shop.activity.map((a, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="py-3 font-mono text-[13px]">{new Date(a.time).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td><Badge tone={a.status === "success" ? "green" : "red"}>{a.status === "success" ? "Parsed OK" : "Manual Fallback"}</Badge></td>
                    <td className="text-[13px]">{a.type === "credit_given" ? "Credit Given" : "Payment Received"} — {fmt(a.amount)} — "{a.raw}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <GlobalPopup
        open={popup.open}
        onClose={() => setPopup({ open:false, type:null })}
        onConfirm={popup.type === "delete" ? handleDelete : handleToggle}
        loading={actionLoading}
        variant={popup.type === "delete" ? "danger" : "primary"}
        title={popup.type === "delete" ? "Permanently Delete?" : shop.status === "Active" ? "Deactivate Shop?" : "Activate Shop?"}
        message={popup.type === "delete" ? `${shop.shop_name} will be permanently deleted — all customers, entries and history will be erased forever. This cannot be undone.` : `${shop.shop_name} will be ${shop.status === "Active" ? "deactivated" : "activated"}. Inactive shops can log in but cannot create entries.`}
        confirmText={popup.type === "delete" ? "Yes, Delete" : "Yes, Confirm"}
        cancelText="Cancel"
      />
    </div>
  )
}