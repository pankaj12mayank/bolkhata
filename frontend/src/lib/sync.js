// Background sync - queue ko online aate hi server se sync
import { getQueue, removeQueueItem, getCustomers, getEntries } from './offline'
import { api } from './api'

let syncing = false
let listeners = []

export function onSyncStatus(cb) {
  listeners.push(cb)
  return () => { listeners = listeners.filter(x=>x!==cb) }
}
function emit(status) { listeners.forEach(cb=>cb(status)) }

export async function trySyncAll() {
  if (syncing) return { synced: 0, pending: 0 }
  if (!navigator.onLine) return { synced: 0, pending: (await getQueue()).length }
  syncing = true
  emit({ syncing: true })
  let synced = 0
  try {
    const q = await getQueue()
    // sort by ts
    q.sort((a,b)=>a.ts-b.ts)
    for (const item of q) {
      try {
        if (item.type === 'create_entry') {
          await api.createEntry(item.payload)
          await removeQueueItem(item.qid)
          synced++
        } else if (item.type === 'create_customer') {
          await api.createCustomer(item.payload)
          await removeQueueItem(item.qid)
          synced++
        } else if (item.type === 'update_customer') {
          await api.updateCustomer(item.id, item.payload)
          await removeQueueItem(item.qid)
          synced++
        } else if (item.type === 'delete_customer') {
          await api.deleteCustomer(item.id)
          await removeQueueItem(item.qid)
          synced++
        } else if (item.type === 'cash_day') {
          try {
            await fetch((import.meta.env.VITE_API_BASE||'http://localhost:8000/api') + '/cash/sync', {
              method: 'POST',
              headers: { 'Content-Type':'application/json', Authorization: `Bearer ${localStorage.getItem('bolkhata_token')||''}` },
              body: JSON.stringify(item.payload)
            })
          } catch {}
          await removeQueueItem(item.qid)
          synced++
        } else {
          await removeQueueItem(item.qid)
        }
      } catch (e) {
        // if 402/403/400 permanent, don't retry infinitely - but keep for now
        // increment tries?
        if (e.message && e.message.includes('Free plan')) {
          // keep queue but notify
          emit({ error: e.message })
          break
        }
        // network fail -> stop syncing this round
        if (e.message && (e.message.includes('Failed to fetch') || e.message.includes('Network'))) break
        // other error -> keep but try next
        console.warn('sync item failed', item, e)
      }
    }
  } finally {
    syncing = false
    const pending = (await getQueue()).length
    emit({ syncing: false, synced, pending })
  }
  return { synced, pending: (await getQueue()).length }
}

// Auto-sync on online + periodic
export function initAutoSync() {
  window.addEventListener('online', () => {
    setTimeout(trySyncAll, 800)
  })
  // periodic every 30s if online
  setInterval(() => { if (navigator.onLine) trySyncAll() }, 30000)
  // initial
  if (navigator.onLine) setTimeout(trySyncAll, 1500)
}
