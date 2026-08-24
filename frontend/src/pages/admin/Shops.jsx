import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../../lib/api"
import { initials } from "../../lib/format"
import Badge from "../../components/Badge"
import Button from "../../components/Button"
import GlobalPopup from "../../components/GlobalPopup"
import PageLoader from "../../components/PageLoader"
import { useToast } from "../../context/ToastContext"

const filters = ["all", "Free", "Paid", "Active", "Inactive"]

export default function Shops() {
  const [filter, setFilter] = useState("all")
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [popup, setPopup] = useState({ open: false, type: null, shop: null })
  const [actionLoading, setActionLoading] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const load = useCallback(async (f) => {
    setLoading(true)
    try {
      const data = await api.adminShops(f)
      setShops(data)
    } catch (e) {
      showToast(e.message, "error")
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { load(filter) }, [filter, load])

  const handleToggle = (shop) => {
    setPopup({ open: true, type: "toggle", shop })
  }
  const handleDelete = (shop) => {
    setPopup({ open: true, type: "delete", shop })
  }

  const confirmAction = async () => {
    if (!popup.shop) return
    setActionLoading(true)
    try {
      if (popup.type === "toggle") {
        const newState = popup.shop.status === "Active" ? false : true
        const res = await api.toggleShopStatus(popup.shop.id, newState)
        showToast(res.message || (newState ? "Shop activated successfully ✓" : "Shop deactivated successfully ✓"), "success")
        load(filter)
      } else if (popup.type === "delete") {
        const res = await api.deleteShop(popup.shop.id)
        showToast(res.message || "Shop permanently deleted ✓", "success")
        load(filter)
      }
    } catch (e) {
      showToast(e.message, "error")
    } finally {
      setActionLoading(false)
      setPopup({ open: false, type: null, shop: null })
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div className="min-w-0 flex-1">
          <h1 className="font-display font-normal text-[26px] sm:text-[28px]">Shops</h1>
          <p className="text-ink-dim text-[13px] sm:text-[14.5px] mt-1">All registered shops on the platform — Manage Active/Inactive and permanent delete here.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => showToast("CSV export coming soon", "success")} className="w-full sm:w-auto">Export CSV</Button>
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full border text-[13px] font-bold transition-all ${filter === f ? "bg-gold border-gold text-[#1A1206] shadow-soft" : "border-line text-ink-dim hover:border-[var(--gold)] hover:text-gold bg-surface"}`}>
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-line rounded-3xl overflow-hidden shadow-soft">
        {loading ? (
          <PageLoader />
        ) : shops.length === 0 ? (
          <div className="text-ink-dim py-14 text-center px-4">No shops found.</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm min-w-[820px]">
                <thead><tr className="text-left font-mono text-[11px] uppercase tracking-wide text-ink-dim border-b border-line bg-surface-2">
                  <th className="p-3.5">Shop</th><th>Plan</th><th>Entries</th><th>Status</th><th>Joined</th><th className="p-3.5 text-right">Actions</th>
                </tr></thead>
                <tbody>
                  {shops.map((s) => (
                    <tr key={s.id} className="border-b border-line last:border-0 hover:bg-surface-2 transition-colors">
                      <td className="p-3.5 font-bold flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/admin/shops/${s.id}`)}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm text-[#1A1206] flex-shrink-0" style={{ background: "linear-gradient(145deg,var(--gold),var(--gold-deep))" }}>{initials(s.shop_name)}</div>
                        <div className="min-w-0"><div className="truncate">{s.shop_name}</div><div className="text-xs text-ink-dim font-normal truncate">{s.owner_name} • #{s.id}</div></div>
                      </td>
                      <td><Badge tone={s.plan_tier === "Paid" ? "green" : "gold"}>{s.plan_tier}</Badge></td>
                      <td className="font-mono">{s.entries_used_this_month}</td>
                      <td><Badge tone={s.status === "Active" ? "green" : "red"}>{s.status}</Badge></td>
                      <td className="font-mono text-ink-dim text-[13px]">{new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => navigate(`/admin/shops/${s.id}`)} className="px-3 py-1.5 rounded-full border border-line text-[12px] font-bold hover:border-gold hover:text-gold bg-surface">View</button>
                          <button onClick={(e) => { e.stopPropagation(); handleToggle(s) }} className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all ${s.status === "Active" ? "border-maroon text-maroon hover:bg-[rgba(229,83,61,0.1)]" : "border-green text-green hover:bg-[rgba(79,163,122,0.1)]"}`}>
                            {s.status === "Active" ? "Make Inactive" : "Make Active"}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(s) }} className="px-3 py-1.5 rounded-full bg-maroon text-white text-[12px] font-bold hover:brightness-110 active:scale-95">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-line">
              {shops.map((s) => (
                <div key={s.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3 cursor-pointer" onClick={() => navigate(`/admin/shops/${s.id}`)}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-sm text-[#1A1206] flex-shrink-0" style={{ background: "linear-gradient(145deg,var(--gold),var(--gold-deep))" }}>{initials(s.shop_name)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[15px] truncate">{s.shop_name}</div>
                      <div className="text-xs text-ink-dim truncate">{s.owner_name} • #{s.id} • {s.plan_tier}</div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge tone={s.plan_tier === "Paid" ? "green" : "gold"}>{s.plan_tier}</Badge>
                        <Badge tone={s.status === "Active" ? "green" : "red"}>{s.status}</Badge>
                        <span className="font-mono text-[12px] text-ink-dim">{s.entries_used_this_month} entries • {new Date(s.created_at).toLocaleDateString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => navigate(`/admin/shops/${s.id}`)} className="py-2.5 rounded-full border border-line text-[13px] font-bold bg-surface">View</button>
                    <button onClick={() => handleToggle(s)} className={`py-2.5 rounded-full text-[13px] font-bold border ${s.status === "Active" ? "border-maroon text-maroon" : "border-green text-green"}`}>{s.status === "Active" ? "Deactivate" : "Activate"}</button>
                    <button onClick={() => handleDelete(s)} className="py-2.5 rounded-full bg-maroon text-white text-[13px] font-bold">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <GlobalPopup
        open={popup.open}
        onClose={() => setPopup({ open: false, type: null, shop: null })}
        onConfirm={confirmAction}
        loading={actionLoading}
        variant={popup.type === "delete" ? "danger" : "primary"}
        title={popup.type === "delete" ? "Permanently Delete?" : popup.shop?.status === "Active" ? "Deactivate Shop?" : "Activate Shop?"}
        message={popup.type === "delete" ? `${popup.shop?.shop_name} will be permanently deleted — all customers, entries and history will be erased forever. This cannot be undone. Continue?` : `${popup.shop?.shop_name} will be ${popup.shop?.status === "Active" ? "deactivated" : "activated"}. Inactive shops can log in but cannot create entries.`}
        confirmText={popup.type === "delete" ? "Yes, Delete" : popup.shop?.status === "Active" ? "Yes, Deactivate" : "Yes, Activate"}
        cancelText="Cancel"
      />
    </div>
  )
}