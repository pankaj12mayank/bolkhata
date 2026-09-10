import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../../lib/api"
import { initials } from "../../lib/format"
import Badge from "../../components/Badge"
import Button from "../../components/Button"
import GlobalPopup from "../../components/GlobalPopup"
import PageLoader from "../../components/PageLoader"
import { useToast } from "../../context/ToastContext"
import { useLang } from "../../context/LangContext"

const filters = ["all", "Free", "Paid", "Active", "Inactive"]

export default function Shops() {
  const [filter, setFilter] = useState("all")
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [popup, setPopup] = useState({ open: false, type: null, shop: null })
  const [actionLoading, setActionLoading] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { t } = useLang()

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
        showToast(res.message || (newState ? t('sh_activated') : t('sh_deactivated')), "success")
        load(filter)
      } else if (popup.type === "delete") {
        const res = await api.deleteShop(popup.shop.id)
        showToast(res.message || t('sh_deleted'), "success")
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
      <div className="flex justify-end mb-5">
        <Button variant="ghost" size="sm" onClick={() => showToast(t('sh_export_soon'), "success")} className="w-full sm:w-auto">{t('sh_export')}</Button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-5">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all ${filter === f ? "bg-amber-500 border-amber-500 text-slate-900 shadow-sm ring-2 ring-amber-100 dark:ring-amber-900" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"}`}>
            {f === "all" ? t('cfl_all') : f}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-line rounded-3xl overflow-hidden shadow-soft">
        {loading ? (
          <PageLoader />
        ) : shops.length === 0 ? (
          <div className="text-ink-dim py-14 text-center px-4">{t('sh_empty')}</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm min-w-[820px]">
                <thead><tr className="text-left font-mono text-[11px] uppercase tracking-wide text-ink-dim border-b border-line bg-surface-2">
                  <th className="p-3.5">{t('sh_th_shop')}</th><th>{t('sh_th_plan')}</th><th>{t('sh_th_entries')}</th><th>{t('sh_th_status')}</th><th>{t('sh_th_joined')}</th><th className="p-3.5 text-right">{t('sh_th_actions')}</th>
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
                          <button onClick={() => navigate(`/admin/shops/${s.id}`)} className="px-3 py-1.5 rounded-full border border-line text-[12px] font-bold hover:border-gold hover:text-gold bg-surface">{t('sh_view')}</button>
                          <button onClick={(e) => { e.stopPropagation(); handleToggle(s) }} className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all ${s.status === "Active" ? "border-maroon text-maroon hover:bg-[rgba(229,83,61,0.1)]" : "border-green text-green hover:bg-[rgba(79,163,122,0.1)]"}`}>
                            {s.status === "Active" ? t('sh_make_inactive') : t('sh_make_active')}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(s) }} className="px-3 py-1.5 rounded-full bg-maroon text-white text-[12px] font-bold hover:brightness-110 active:scale-95">{t('sh_delete')}</button>
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
                        <span className="font-mono text-[12px] text-ink-dim">{s.entries_used_this_month} {t('sh_entries_lbl')} • {new Date(s.created_at).toLocaleDateString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => navigate(`/admin/shops/${s.id}`)} className="py-2.5 rounded-full border border-line text-[13px] font-bold bg-surface">{t('sh_view')}</button>
                    <button onClick={() => handleToggle(s)} className={`py-2.5 rounded-full text-[13px] font-bold border ${s.status === "Active" ? "border-maroon text-maroon" : "border-green text-green"}`}>{s.status === "Active" ? t('sh_deactivate') : t('sh_activate')}</button>
                    <button onClick={() => handleDelete(s)} className="py-2.5 rounded-full bg-maroon text-white text-[13px] font-bold">{t('sh_delete')}</button>
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
        title={popup.type === "delete" ? t('sh_popup_delete_t') : popup.shop?.status === "Active" ? t('sh_popup_toggle_t_active') : t('sh_popup_toggle_t_inactive')}
        message={popup.type === "delete" ? t('sh_popup_delete_m', { name: popup.shop?.shop_name }) : t('sh_popup_toggle_m', { name: popup.shop?.shop_name, action: popup.shop?.status === "Active" ? t('sh_popup_action_deactivated') : t('sh_popup_action_activated') })}
        confirmText={popup.type === "delete" ? t('sh_popup_delete_c') : popup.shop?.status === "Active" ? t('sh_popup_toggle_c_active') : t('sh_popup_toggle_c_inactive')}
        cancelText={t('sh_cancel')}
      />
    </div>
  )
}