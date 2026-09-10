import { useShopData } from '../context/ShopDataContext'
import { useLang } from '../context/LangContext'
import { trySyncAll } from '../lib/sync'
import { useState } from 'react'

export default function OfflineBadge() {
  const { isOffline, pendingSync } = useShopData()
  const { t } = useLang()
  const [syncing, setSyncing] = useState(false)
  if (!isOffline && pendingSync === 0) return null
  const handleSync = async () => {
    if (!navigator.onLine) return
    setSyncing(true)
    try { await trySyncAll() } finally { setSyncing(false) }
  }
  return (
    <div className={`fixed bottom-[84px] lg:bottom-6 left-1/2 -translate-x-1/2 z-[55] flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-soft text-[12.5px] font-bold ${isOffline ? 'bg-maroon text-white border-maroon' : 'bg-[var(--gold)] text-[#1A1206] border-[var(--gold-deep)]'}`}>
      <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-white animate-pulse' : 'bg-[#1A1206]'}`} />
      {isOffline ? t('offline_badge_off', { n: pendingSync }) : t('offline_badge_pending', { n: pendingSync })}
      {!isOffline && pendingSync>0 && (
        <button onClick={handleSync} disabled={syncing} className="ml-2 px-3 py-1 rounded-full bg-[#1A1206] text-[var(--gold)] text-xs font-extrabold disabled:opacity-60">
          {syncing ? t('syncing') : t('sync_now')}
        </button>
      )}
    </div>
  )
}
