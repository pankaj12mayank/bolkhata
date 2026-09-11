import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Store, CheckCircle, XCircle, Crown, Search, Download } from "lucide-react"
import { api } from "../../lib/api"
import { initials } from "../../lib/format"
import Badge from "../../components/Badge"
import Button from "../../components/Button"
import GlobalPopup from "../../components/GlobalPopup"
import PageLoader from "../../components/PageLoader"
import Pagination from "../../components/Pagination"
import { useToast } from "../../context/ToastContext"
import { useLang } from "../../context/LangContext"

const filters = ["all", "Free", "Paid", "Active", "Inactive"]
const PAGE_SIZE = 10

export default function Shops() {
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [popup, setPopup] = useState({ open: false, type: null, shop: null })
  const [actionLoading, setActionLoading] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { t } = useLang()

  const load = useCallback(async (f, silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await api.adminShops(f)
      setShops(data || [])
    } catch (e) {
      if (!silent) showToast(e.message, "error")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    load(filter)
    const id = setInterval(() => load(filter, true), 30000)
    return () => clearInterval(id)
  }, [filter, load])

  const stats = useMemo(() => {
    const total = shops.length
    const active = shops.filter(s => s.status === "Active").length
    const inactive = shops.filter(s => s.status !== "Active").length
    const paid = shops.filter(s => s.plan_tier === "Paid").length
    return { total, active, inactive, paid }
  }, [shops])

  const filteredShops = useMemo(() => {
    let res = [...shops]
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      res = res.filter(s =>
        s.shop_name?.toLowerCase().includes(q) ||
        s.owner_name?.toLowerCase().includes(q) ||
        String(s.phone || '').includes(q) ||
        String(s.id).includes(q)
      )
    }
    return res
  }, [shops, search])

  const totalPages = Math.ceil(filteredShops.length / PAGE_SIZE)
  const pagedShops = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredShops.slice(start, start + PAGE_SIZE)
  }, [filteredShops, page])

  useEffect(() => {
    setPage(1)
  }, [filter, search])

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
      {/* Interactive 3D Motion Stats Bar (Dashboard Style - No Standard Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="p-4 rounded-3xl bg-surface border border-line shadow-soft flex items-center justify-between group cursor_pointer"
        >
          <div>
            <div className="text-[11.5px] font-bold text-ink-dim uppercase tracking-wider">Total Shops</div>
            <div className="text-2xl font-black font-mono text-ink mt-0.5">{stats.total}</div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
            <Store size={20} />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="p-4 rounded-3xl bg-surface border border-line shadow-soft flex items-center justify-between group cursor_pointer"
        >
          <div>
            <div className="text-[11.5px] font-bold text-ink-dim uppercase tracking-wider">Active Shops</div>
            <div className="text-2xl font-black font-mono text-green mt-0.5">{stats.active}</div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-green/10 border border-green/20 flex items-center justify-center text-green group-hover:scale-110 transition-transform">
            <CheckCircle size={20} />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="p-4 rounded-3xl bg-surface border border-line shadow-soft flex items-center justify-between group cursor_pointer"
        >
          <div>
            <div className="text-[11.5px] font-bold text-ink-dim uppercase tracking-wider">Inactive Shops</div>
            <div className="text-2xl font-black font-mono text-maroon mt-0.5">{stats.inactive}</div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-maroon/10 border border-maroon/20 flex items-center justify-center text-maroon group-hover:scale-110 transition-transform">
            <XCircle size={20} />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="p-4 rounded-3xl bg-surface border border-line shadow-soft flex items-center justify-between group cursor_pointer"
        >
          <div>
            <div className="text-[11.5px] font-bold text-ink-dim uppercase tracking-wider">Paid Plan</div>
            <div className="text-2xl font-black font-mono text-gold mt-0.5">{stats.paid}</div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[rgba(232,169,59,.12)] border border-gold/20 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
            <Crown size={20} />
          </div>
        </motion.div>
      </div>

      {/* Toolbar: Search, Filters & Export */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-dim" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search shop name, owner, phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-line bg-surface text-ink text-sm outline-none focus:border-[var(--gold)] shadow-soft"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <div className="flex gap-1.5 p-1 bg-surface border border-line rounded-2xl shadow-soft">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  filter === f
                    ? "bg-[var(--gold)] text-[#1A1206] shadow-sm"
                    : "text-ink-dim hover:text-ink hover:bg-surface-2"
                }`}
              >
                {f === "all" ? t('cfl_all') : f}
              </button>
            ))}
          </div>

          <Button variant="ghost" size="sm" onClick={() => showToast(t('sh_export_soon'), "success")} className="shrink-0 gap-1.5">
            <Download size={14} /> {t('sh_export')}
          </Button>
        </div>
      </div>

      {/* Shops Data Table */}
      <div className="bg-surface border border-line rounded-3xl overflow-hidden shadow-soft">
        {loading ? (
          <PageLoader />
        ) : filteredShops.length === 0 ? (
          <div className="text-ink-dim py-14 text-center px-4">{t('sh_empty')}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[820px]">
                <thead>
                  <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-ink-dim border-b border-line bg-surface-2/60">
                    <th className="p-4">{t('sh_th_shop')}</th>
                    <th className="p-4">{t('sh_th_plan')}</th>
                    <th className="p-4">{t('sh_th_entries')}</th>
                    <th className="p-4">{t('sh_th_status')}</th>
                    <th className="p-4">{t('sh_th_joined')}</th>
                    <th className="p-4 text-right">{t('sh_th_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pagedShops.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-surface-2/50 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/admin/shops/${s.id}`)}
                    >
                      <td className="p-4 font-bold">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm text-[#1A1206] shrink-0 shadow-soft"
                            style={{ background: "linear-gradient(145deg,var(--gold),var(--gold-deep))" }}
                          >
                            {initials(s.shop_name)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-extrabold text-ink group-hover:text-[var(--gold)] transition-colors">
                              {s.shop_name}
                            </div>
                            <div className="text-xs text-ink-dim font-normal truncate">
                              {s.owner_name} • +91 {s.phone} • #{s.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge tone={s.plan_tier === "Paid" ? "green" : "gold"}>{s.plan_tier}</Badge>
                      </td>
                      <td className="p-4 font-mono font-bold text-ink">{s.entries_used_this_month}</td>
                      <td className="p-4">
                        <Badge tone={s.status === "Active" ? "green" : "red"}>{s.status}</Badge>
                      </td>
                      <td className="p-4 font-mono text-ink-dim text-[12.5px]">
                        {new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="p-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/shops/${s.id}`)}
                            className="px-3 py-1.5 rounded-full border border-line text-[12px] font-bold hover:border-[var(--gold)] hover:text-[var(--gold)] bg-surface shadow-soft transition-all"
                          >
                            {t('sh_view')}
                          </button>
                          <button
                            onClick={() => handleToggle(s)}
                            className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all ${
                              s.status === "Active"
                                ? "border-maroon/40 text-maroon hover:bg-maroon/10"
                                : "border-green/40 text-green hover:bg-green/10"
                            }`}
                          >
                            {s.status === "Active" ? t('sh_make_inactive') : t('sh_make_active')}
                          </button>
                          <button
                            onClick={() => handleDelete(s)}
                            className="px-3 py-1.5 rounded-full bg-maroon text-white text-[12px] font-bold hover:brightness-110 active:scale-95 transition-all shadow-soft"
                          >
                            {t('sh_delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Theme-based Pagination */}
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={filteredShops.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
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