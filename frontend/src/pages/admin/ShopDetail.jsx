import { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "../../lib/api"
import { initials, fmt } from "../../lib/format"
import Badge from "../../components/Badge"
import Button from "../../components/Button"
import GlobalPopup from "../../components/GlobalPopup"
import PageLoader from "../../components/PageLoader"
import Pagination from "../../components/Pagination"
import { useToast } from "../../context/ToastContext"
import { useLang } from "../../context/LangContext"

const PAGE_SIZE = 10

export default function ShopDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { t } = useLang()
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [popup, setPopup] = useState({ open: false, type: null })
  const [actionLoading, setActionLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try { setShop(await api.adminShopDetail(id)) } catch(e){ showToast(e.message, "error") } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [id])

  const activity = shop?.activity || []
  const totalPages = Math.ceil(activity.length / PAGE_SIZE)
  const pagedActivity = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return activity.slice(start, start + PAGE_SIZE)
  }, [activity, page])

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
      <p className="mb-4">{t('sd_not_found')}</p>
    </div>
  )

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-base text-[#1A1206] flex-shrink-0" style={{ background: "linear-gradient(145deg,var(--gold),var(--gold-deep))" }}>{initials(shop.shop_name)}</div>
          <div className="min-w-0 font-bold text-lg truncate">{shop.shop_name} <span className="text-xs font-normal text-ink-dim">• {shop.owner_name}</span></div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge tone={shop.plan_tier === "Paid" ? "green" : "gold"}>{t('sd_plan', { tier: shop.plan_tier })}</Badge>
          <Badge tone={shop.status === "Active" ? "green" : "red"}>{shop.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Button variant={shop.status === "Active" ? "danger" : "primary"} onClick={() => setPopup({ open:true, type:"toggle" })} disabled={actionLoading} className="w-full sm:w-auto">
          {shop.status === "Active" ? t('sh_make_inactive') : t('sh_make_active')}
        </Button>
        <Button variant="danger" onClick={() => setPopup({ open:true, type:"delete" })} disabled={actionLoading} className="w-full sm:w-auto">{t('sd_delete')}</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-7">
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-soft"><div className="font-mono text-[24px] sm:text-[28px] font-semibold">{shop.customers_count}</div><div className="text-[12px] sm:text-[13px] text-ink-dim mt-0.5">{t('sd_customers')}</div></div>
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-soft"><div className="font-mono text-[24px] sm:text-[28px] font-semibold">{shop.entries_count}</div><div className="text-[12px] sm:text-[13px] text-ink-dim mt-0.5">{t('sd_entries')}</div></div>
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-soft"><div className="font-mono text-[22px] sm:text-[28px] font-semibold truncate">{fmt(shop.outstanding)}</div><div className="text-[12px] sm:text-[13px] text-ink-dim mt-0.5">{t('sd_outstanding')}</div></div>
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-soft"><div className="font-mono text-[16px] sm:text-[18px] font-semibold">{new Date(shop.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div><div className="text-[12px] sm:text-[13px] text-ink-dim mt-0.5">{t('sd_joined')}</div></div>
      </div>

      <div className="bg-surface border border-line rounded-3xl p-4 sm:p-6 w-full overflow-hidden shadow-soft">
        <h3 className="font-extrabold text-[16px] sm:text-[16.5px] mb-4">{t('sd_recent')}</h3>
        {activity.length === 0 ? (
          <p className="text-ink-dim text-[13px] sm:text-[13.5px]">{t('sd_no_activity')}</p>
        ) : (
          <>
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-sm min-w-[560px]">
                <thead><tr className="text-left font-mono text-[11px] uppercase tracking-wide text-ink-dim border-b border-line"><th className="py-2.5">{t('sd_th_time')}</th><th>{t('sd_th_status')}</th><th>{t('sd_th_detail')}</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {pagedActivity.map((a, i) => (
                    <tr key={i} className="hover:bg-surface-2/50 transition-colors">
                      <td className="py-3 font-mono text-[13px]">{new Date(a.time).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                      <td><Badge tone={a.status === "success" ? "green" : "red"}>{a.status === "success" ? t('sd_parsed_ok') : t('sd_manual')}</Badge></td>
                      <td className="text-[13px]">{a.type === "credit_given" ? t('sd_credit') : t('sd_payment')} — {fmt(a.amount)} — "{a.raw}"</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={activity.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <GlobalPopup
        open={popup.open}
        onClose={() => setPopup({ open: false, type: null })}
        onConfirm={popup.type === "delete" ? handleDelete : handleToggle}
        loading={actionLoading}
        variant={popup.type === "delete" ? "danger" : "primary"}
        title={popup.type === "delete" ? t('sh_popup_delete_t') : shop.status === "Active" ? t('sh_popup_toggle_t_active') : t('sh_popup_toggle_t_inactive')}
        message={popup.type === "delete" ? t('sh_popup_delete_m', { name: shop.shop_name }) : t('sh_popup_toggle_m', { name: shop.shop_name, action: shop.status === "Active" ? t('sh_popup_action_deactivated') : t('sh_popup_action_activated') })}
        confirmText={popup.type === "delete" ? t('sh_popup_delete_c') : shop.status === "Active" ? t('sh_popup_toggle_c_active') : t('sh_popup_toggle_c_inactive')}
        cancelText={t('sh_cancel')}
      />
    </div>
  )
}