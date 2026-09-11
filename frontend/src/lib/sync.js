// Background sync - queue ko online aate hi server se sync
// Sync ke baad refreshAll() call hota hai taaki IndexedDB clean data se update ho
import { getQueue, removeQueueItem } from './offline'
import * as offline from './offline'
import { api } from './api'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

let syncing = false
let listeners = []
let onSyncComplete = null

export function onSyncStatus(cb) {
  listeners.push(cb)
  return () => { listeners = listeners.filter(x=>x!==cb) }
}

export function setOnSyncComplete(cb) {
  onSyncComplete = cb
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
            const token = localStorage.getItem('bolkhata_token') || ''
            await fetch(API_BASE + '/cash/sync', {
              method: 'POST',
              headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(item.payload)
            })
          } catch {}
          await removeQueueItem(item.qid)
          synced++
        } else if (item.type && item.type.startsWith('api_')) {
          // Generic API action from offline queue - use direct fetch to avoid circular dependency
          const token = localStorage.getItem('bolkhata_token') || ''
          const headers = { 'Content-Type': 'application/json' }
          if (token) headers.Authorization = `Bearer ${token}`
          const res = await fetch(API_BASE + item.path, {
            method: item.method || 'POST',
            headers,
            body: item.payload !== undefined ? JSON.stringify(item.payload) : undefined,
          })
          if (!res.ok) {
            throw new Error('sync api_' + item.method + ' ' + item.path + ' failed: ' + (await res.text().catch(()=>'')))
          }
          await removeQueueItem(item.qid)
          synced++
        } else {
          await removeQueueItem(item.qid)
        }
      } catch (e) {
        if (e.message && e.message.includes('Free plan')) {
          emit({ error: e.message })
          break
        }
        if (e.message && (e.message.includes('Failed to fetch') || e.message.includes('Network'))) break
        console.warn('sync item failed', item, e)
      }
    }
  } finally {
    syncing = false
    const pending = (await getQueue()).length
    emit({ syncing: false, synced, pending })
    if (onSyncComplete && synced > 0) {
      onSyncComplete()
    }
  }
  return { synced, pending: (await getQueue()).length }
}

// Auto-sync on online + periodic
export function initAutoSync() {
  window.addEventListener('online', () => {
    setTimeout(trySyncAll, 800)
  })
  setInterval(() => { if (navigator.onLine) trySyncAll() }, 30000)
  if (navigator.onLine) setTimeout(trySyncAll, 1500)
}

// Refresh offline DB after sync - clears _offline flags and reloads clean data
export async function refreshAfterSync() {
  try {
    const token = localStorage.getItem('bolkhata_token') || ''
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`

    const [custRes, entryRes] = await Promise.all([
      fetch(API_BASE + '/customers', { headers }),
      fetch(API_BASE + '/entries/today', { headers }),
    ])

    const customers = await custRes.json()
    const entries = await entryRes.json()

    await offline.saveCustomers(customers || [])
    if (entries) await offline.saveEntries(entries)
  } catch (e) {
    console.warn('refreshAfterSync failed:', e)
  }
}
