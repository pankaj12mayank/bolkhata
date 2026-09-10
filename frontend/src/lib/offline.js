// Offline-first IndexedDB wrapper - pura app offline chalega
// DB: bolkhata_offline v2

const DB_NAME = 'bolkhata_offline'
const DB_VERSION = 3
const STORES = ['customers', 'entries', 'sync_queue', 'cash_days', 'meta', 'shop_profile']

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('customers')) db.createObjectStore('customers', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('entries')) db.createObjectStore('entries', { keyPath: 'id', autoIncrement: true })
      if (!db.objectStoreNames.contains('sync_queue')) db.createObjectStore('sync_queue', { keyPath: 'qid', autoIncrement: true })
      if (!db.objectStoreNames.contains('cash_days')) db.createObjectStore('cash_days', { keyPath: 'date' })
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' })
      if (!db.objectStoreNames.contains('shop_profile')) db.createObjectStore('shop_profile', { keyPath: 'key' })
      // indexes
      try {
        const c = e.target.transaction.objectStore('customers')
        if (!c.indexNames.contains('name')) c.createIndex('name', 'name', { unique: false })
      } catch {}
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx(storeNames, mode, fn) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const t = db.transaction(storeNames, mode)
    const stores = storeNames.map(n => t.objectStore(n))
    let result
    t.oncomplete = () => resolve(result)
    t.onerror = () => reject(t.error)
    Promise.resolve(fn(...stores)).then(r => { result = r }).catch(reject)
  })
}

// ---- Customers ----
export async function saveCustomers(list) {
  const db = await openDB()
  const t = db.transaction('customers', 'readwrite')
  const s = t.objectStore('customers')
  // clear and re-add to keep in sync but keep offline-added ones? Merge strategy
  // We keep local unsynced customers - mark them with _local flag
  // For now, upsert all without clearing locals
  const existing = await new Promise(res => {
    const req = s.getAll()
    req.onsuccess = () => res(req.result || [])
  })
  const localOnly = existing.filter(c => c._offline)
  // clear
  s.clear()
  for (const c of list) s.put(c)
  for (const c of localOnly) {
    // if server already has same name, skip duplicate
    if (!list.find(x => x.name?.toLowerCase() === c.name?.toLowerCase())) s.put(c)
  }
  return new Promise(r => t.oncomplete = r)
}
export async function getCustomers() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('customers', 'readonly').objectStore('customers').getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}
export async function putCustomerLocal(cust) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('customers', 'readwrite').objectStore('customers').put(cust)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
export async function deleteCustomerLocal(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('customers', 'readwrite').objectStore('customers').delete(id)
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}

// ---- Entries (today etc) ----
export async function saveEntries(list) {
  const db = await openDB()
  const t = db.transaction('entries', 'readwrite')
  const s = t.objectStore('entries')
  s.clear()
  for (const e of list) s.put({ ...e, id: e.id || Date.now() + Math.random() })
  return new Promise(r => t.oncomplete = r)
}
export async function getEntries() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('entries', 'readonly').objectStore('entries').getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}
export async function addEntryLocal(entry) {
  const db = await openDB()
  const enriched = { ...entry, id: Date.now() + Math.floor(Math.random()*1000), created_at: new Date().toISOString(), _offline: true }
  return new Promise((resolve, reject) => {
    const req = db.transaction('entries', 'readwrite').objectStore('entries').add(enriched)
    req.onsuccess = () => resolve(enriched)
    req.onerror = () => reject(req.error)
  })
}

// ---- Sync Queue (for entries/customers that failed due to offline) ----
export async function queueAction(action) {
  const db = await openDB()
  const item = { ...action, ts: Date.now(), tries: 0 }
  return new Promise((resolve, reject) => {
    const req = db.transaction('sync_queue', 'readwrite').objectStore('sync_queue').add(item)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
export async function getQueue() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('sync_queue', 'readonly').objectStore('sync_queue').getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}
export async function removeQueueItem(qid) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('sync_queue', 'readwrite').objectStore('sync_queue').delete(qid)
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}
export async function clearQueue() {
  const db = await openDB()
  const t = db.transaction('sync_queue', 'readwrite')
  t.objectStore('sync_queue').clear()
  return new Promise(r => t.oncomplete = r)
}

// ---- Cash Days ----
export async function saveCashDay(dateStr, data) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('cash_days', 'readwrite').objectStore('cash_days').put({ date: dateStr, ...data, updatedAt: Date.now() })
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}
export async function getCashDay(dateStr) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('cash_days', 'readonly').objectStore('cash_days').get(dateStr)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}
export async function getAllCashDays() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('cash_days', 'readonly').objectStore('cash_days').getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

// ---- Meta (plan, lastSync) ----
export async function setMeta(key, value) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('meta', 'readwrite').objectStore('meta').put({ key, value, ts: Date.now() })
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}
export async function getMeta(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('meta', 'readonly').objectStore('meta').get(key)
    req.onsuccess = () => resolve(req.result?.value ?? null)
    req.onerror = () => reject(req.error)
  })
}

// ---- Shop profile offline ----
export async function setShopProfileOffline(profile) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('shop_profile', 'readwrite').objectStore('shop_profile').put({ key: 'shop', ...profile })
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}
export async function getShopProfileOffline() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('shop_profile', 'readonly').objectStore('shop_profile').get('shop')
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

// ---- Helpers ----
export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}
export function onOnlineStatusChange(cb) {
  window.addEventListener('online', () => cb(true))
  window.addEventListener('offline', () => cb(false))
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

// Count pending sync
export async function pendingCount() {
  const q = await getQueue()
  return q.length
}

// Wipe all offline (for logout/reset)
export async function wipeOffline() {
  const db = await openDB()
  const t = db.transaction(['customers','entries','sync_queue','cash_days','meta','shop_profile'], 'readwrite')
  t.objectStore('customers').clear()
  t.objectStore('entries').clear()
  t.objectStore('sync_queue').clear()
  t.objectStore('cash_days').clear()
  t.objectStore('meta').clear()
  t.objectStore('shop_profile').clear()
  return new Promise(r => t.oncomplete = r)
}
