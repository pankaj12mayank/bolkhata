import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Trash2, Filter, CheckSquare, Square, AlertTriangle } from 'lucide-react'
import { api } from '../../lib/api'
import Badge from '../../components/Badge'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import { useToast } from '../../context/ToastContext'
import { useLang } from '../../context/LangContext'

const filters = [
  { id: 'all', label: 'all' },
  { id: 'success', label: 'success' },
  { id: 'failed', label: 'failed' },
]

export default function Logs() {
  const [filter, setFilter] = useState('all')
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { showToast } = useToast()
  const { t } = useLang()

  const filterLabel = (id) => id === 'all' ? t('cfl_all') : id === 'success' ? t('logs_parsed_ok') : t('logs_f_manual')

  const load = useCallback(async (f) => {
    setLoading(true)
    try { setLogs(await api.adminLogs(f)) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load(filter); setSelected(new Set()) }, [filter, load])

  const filtered = useMemo(() => {
    if (!search) return logs
    const q = search.toLowerCase()
    return logs.filter(l =>
      l.shop_name?.toLowerCase().includes(q) ||
      l.raw_voice_text?.toLowerCase().includes(q) ||
      l.parsed_summary?.toLowerCase().includes(q)
    )
  }, [logs, search])

  const toggle = (id) => {
    const n = new Set(selected)
    if (n.has(id)) n.delete(id); else n.add(id)
    setSelected(n)
  }
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(l=>l.id)))
  }
  const clearSel = () => setSelected(new Set())

  const doBulkDelete = async () => {
    if (selected.size===0) return
    setDeleting(true)
    try {
      const ids = Array.from(selected)
      await api.bulkDeleteLogs(ids)
      showToast(t('logs_deleted', { n: ids.length }))
      setShowConfirm(false)
      clearSel()
      load(filter)
    } catch (e) { showToast(e.message) }
    finally { setDeleting(false) }
  }

  return (
    <div className="w-full">
      {selected.size>0 && (
        <div className="flex justify-end mb-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
            <span className="text-sm font-medium px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">{t('logs_selected', { n: selected.size })}</span>
            <Button variant="danger" size="sm" onClick={()=>setShowConfirm(true)}><Trash2 size={14} /> {t('logs_hard_delete')}</Button>
            <Button variant="ghost" size="sm" onClick={clearSel}>{t('logs_clear')}</Button>
          </motion.div>
        </div>
      )}

      {/* Filters - horizontal chips with ring */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <Filter size={14} className="text-slate-400 flex-shrink-0" />
          {filters.map(f => (
            <motion.button
              key={f.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition-all ${filter===f.id ? 'bg-amber-500 text-slate-900 border-slate-900 shadow-sm ring-2 ring-amber-100 dark:ring-amber-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              {filterLabel(f.id)}
            </motion.button>
          ))}
        </div>
        <div className="flex-1 flex items-center gap-2 max-w-sm ml-auto">
          <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus-within:border-amber-300 dark:focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-amber-100 dark:focus-within:ring-amber-900/20">
            <Search size={14} className="text-slate-400" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('logs_search')} className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400 dark:text-slate-200" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1,2,3,4].map(i=> <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length===0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3"><Search size={20} className="text-slate-400" /></div>
            <p className="font-medium dark:text-slate-200">{t('logs_empty_t')}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('logs_empty_sub')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="text-left text-xs font-semibold tracking-widest uppercase text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40">
                    <th className="p-3 w-10">
                      <button onClick={toggleAll} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
                        {selected.size===filtered.length && filtered.length>0 ? <CheckSquare size={16} className="text-amber-600" /> : <Square size={16} className="text-slate-400" />}
                      </button>
                    </th>
                    <th className="p-3">{t('logs_th_shop')}</th><th>{t('logs_th_raw')}</th><th>{t('logs_th_parsed')}</th><th>{t('logs_th_status')}</th><th>{t('logs_th_time')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <motion.tr
                      key={l.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 ${selected.has(l.id) ? 'bg-amber-50/60 dark:bg-amber-950/20' : 'even:bg-slate-50/30 dark:even:bg-slate-800/50'}`}
                    >
                      <td className="p-3">
                        <button onClick={()=>toggle(l.id)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
                          {selected.has(l.id) ? <CheckSquare size={16} className="text-amber-600" /> : <Square size={16} className="text-slate-400" />}
                        </button>
                      </td>
                      <td className="p-3 font-medium dark:text-slate-200 whitespace-nowrap">{l.shop_name}</td>
                      <td className="p-3 font-mono text-xs dark:text-slate-300 max-w-[240px] truncate" title={l.raw_voice_text}>"{l.raw_voice_text}"</td>
                      <td className="p-3 font-mono text-xs dark:text-slate-300 whitespace-nowrap">{l.parsed_summary}</td>
                      <td className="p-3"><Badge tone={l.status==='success'?'green':'red'}>{l.status==='success'?t('logs_parsed_ok'):t('logs_manual')}</Badge></td>
                      <td className="p-3 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{new Date(l.created_at).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{t('logs_footer', { n: filtered.length, sel: selected.size })}</span>
              <span className="hidden sm:inline">{t('logs_footer_note')}</span>
            </div>
          </>
        )}
      </div>

      {/* Global Theme Modal */}
      <Modal open={showConfirm} onClose={()=>setShowConfirm(false)} title={t('logs_modal_t')} size="md">
        <div className="space-y-4">
          <div className="flex gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
            <AlertTriangle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm dark:text-slate-200">
              <b>{t('logs_modal_warn_t')}</b> {t('logs_modal_warn', { n: selected.size })}
            </div>
          </div>
          <div className="max-h-32 overflow-auto bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-xs font-mono dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {t('logs_ids')}{Array.from(selected).join(', ')}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={()=>setShowConfirm(false)} disabled={deleting}>{t('logs_cancel')}</Button>
            <Button variant="danger" onClick={doBulkDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white border-red-600">
              {deleting ? t('logs_deleting') : t('logs_delete_btn', { n: selected.size })}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
