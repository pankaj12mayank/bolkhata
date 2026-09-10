import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api } from '../lib/api'
import * as offline from '../lib/offline'
import { trySyncAll } from '../lib/sync'

const ShopDataContext = createContext(null)

export function ShopDataProvider({ children }) {
  const [customers, setCustomers] = useState([])
  const [homeEntries, setHomeEntries] = useState([])
  const [plan, setPlan] = useState({ tier: 'Free', used: 0, limit: 100, price: 99 })
  const [loading, setLoading] = useState(false)
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false)
  const [pendingSync, setPendingSync] = useState(0)

  useEffect(() => {
    const upd = () => setIsOffline(!navigator.onLine)
    window.addEventListener('online', upd)
    window.addEventListener('offline', upd)
    // load pending count
    offline.pendingCount().then(setPendingSync)
    const iv = setInterval(()=> offline.pendingCount().then(setPendingSync), 3000)
    return () => { window.removeEventListener('online', upd); window.removeEventListener('offline', upd); clearInterval(iv) }
  }, [])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    try {
      const [custs, entries, billing] = await Promise.all([
        api.listCustomers().catch(e=>{ if(e.message==='OFFLINE') throw e; throw e}),
        api.todayEntries().catch(e=>{ if(e.message==='OFFLINE') throw e; return []}),
        api.getBilling().catch(e=>{ if(e.message==='OFFLINE') throw e; return null}),
      ])
      setCustomers(custs || [])
      setHomeEntries((entries || []).map(e => ({
        name: e.customer_name, type: e.type, amount: e.amount,
        time: new Date(e.created_at).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
      })))
      if (billing) {
        const p = { tier: billing.tier, used: billing.used, limit: billing.limit, price: billing.price || 99 }
        setPlan(p)
        await offline.setMeta('plan', p)
      }
      // persist to offline
      if (custs) await offline.saveCustomers(custs)
      if (entries) await offline.saveEntries(entries)
      // try sync queue after refresh
      trySyncAll().then(r=> setPendingSync(r.pending))
    } catch(e){
      if (e.message === 'OFFLINE') {
        // load from offline DB
        const [c, en, p] = await Promise.all([offline.getCustomers(), offline.getEntries(), offline.getMeta('plan')])
        if (c && c.length) setCustomers(c)
        if (en) setHomeEntries(en.map(x=>({ name: x.customer_name || x.name, type: x.type, amount: x.amount, time: x.time || new Date(x.created_at||Date.now()).toLocaleTimeString('hi-IN',{hour:'2-digit',minute:'2-digit'}) })))
        if (p) setPlan(p)
        else setPlan(prev=>prev)
        const pend = await offline.pendingCount()
        setPendingSync(pend)
      }
      // else keep previous data, let caller handle toast
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = async () => { setCustomers([]); setHomeEntries([]); setPlan({ tier: 'Free', used: 0, limit: 100, price: 99 }); await offline.wipeOffline().catch(()=>{}) }

  const addOrUpdateEntry = async (name, amount, type, raw, source = 'voice', customer_id = null, phone_hint = null) => {
    const payload = { customer_name: name, amount, type, raw_voice_text: raw, source, customer_id: customer_id || undefined, phone_hint: phone_hint || undefined }
    try {
      const result = await api.createEntry(payload)
      await refreshAll()
      return result
    } catch (e) {
      // Handle 409 multiple candidates - bubble up with candidates attached
      if (e.message && (e.message.includes('candidates') || e.message.includes('mile') || e.status===409)) {
        // try to parse candidates from detail
        let cands = null
        try {
          // apiFetch throws with detail as stringified JSON if backend sent object
          const m = e.message.match(/candidates/);
          if (m && e.detail && e.detail.candidates) cands = e.detail.candidates
        } catch {}
        if (e.detail && e.detail.candidates) cands = e.detail.candidates
        if (cands) {
          const err = new Error('Multiple candidates')
          err.candidates = cands
          err.detail = e.detail
          throw err
        }
        throw e
      }
      if (e.message === 'OFFLINE' || e.message.includes('Failed to fetch') || e.message.includes('Network') || e.message.includes('OFFLINE')) {
        // offline with candidate check: if name ambiguous offline, we should not auto-create new, need picker handled before call
        // But if we are here with customer_id, respect it
        if (customer_id) {
          const cust = customers.find(c=> String(c.id)===String(customer_id))
          if (cust) {
            const delta = type==='credit_given' ? amount : -amount
            const updated = { ...cust, balance: Number(cust.balance||0)+delta }
            setCustomers(prev=> prev.map(x=> String(x.id)===String(customer_id)? updated : x))
            await offline.putCustomerLocal(updated)
            const entryLocal = { customer_name: cust.name, amount, type, raw_voice_text: raw, source, created_at: new Date().toISOString() }
            await offline.addEntryLocal(entryLocal)
            setHomeEntries(prev=> [{ name: cust.name, type, amount, time: new Date().toLocaleTimeString('hi-IN',{hour:'2-digit',minute:'2-digit'}) }, ...prev])
            await offline.queueAction({ type: 'create_entry', payload })
            setPlan(p=>{ const np={...p, used: (p.used||0)+1}; offline.setMeta('plan', np); return np})
            setPendingSync(await offline.pendingCount())
            return { entry: entryLocal, customer: updated, is_new_customer: false, _offline: true }
          }
        }
        // fallback original logic if no id
        await offline.queueAction({ type: 'create_entry', payload })
        let cust = customers.find(c=> c.name.toLowerCase()===name.toLowerCase())
        // also try partial
        if (!cust) {
          const partials = customers.filter(c=> c.name.toLowerCase().includes(name.toLowerCase()))
          if (partials.length===1) cust = partials[0]
          else if (partials.length>1 && phone_hint) {
            const f = partials.filter(c=> (c.phone||'').includes(phone_hint))
            if (f.length===1) cust = f[0]
          }
        }
        const isNew = !cust
        const delta = type==='credit_given' ? amount : -amount
        if (cust) {
          const updated = { ...cust, balance: Number(cust.balance||0)+delta }
          setCustomers(prev=> prev.map(x=> x.id===cust.id? updated : x))
          await offline.putCustomerLocal(updated)
        } else {
          const newCust = { id: Date.now(), name, phone:'', balance: delta, _offline: true }
          setCustomers(prev=> [...prev, newCust])
          await offline.putCustomerLocal(newCust)
        }
        const entryLocal = { customer_name: name, amount, type, raw_voice_text: raw, source, created_at: new Date().toISOString() }
        await offline.addEntryLocal(entryLocal)
        setHomeEntries(prev=> [{ name, type, amount, time: new Date().toLocaleTimeString('hi-IN',{hour:'2-digit',minute:'2-digit'}) }, ...prev])
        setPlan(p=>{ const np={...p, used: (p.used||0)+1}; offline.setMeta('plan', np); return np})
        setPendingSync(await offline.pendingCount())
        return { entry: entryLocal, customer: cust||{name}, is_new_customer: isNew, _offline: true }
      }
      throw e
    }
  }

  const addCustomer = async (name, phone, balance) => {
    const payload = { name, phone, balance }
    try {
      const c = await api.createCustomer(payload)
      await refreshAll()
      return c
    } catch (e) {
      if (e.message==='OFFLINE' || e.message.includes('Failed to fetch')) {
        const local = { id: Date.now(), name, phone, balance: balance||0, _offline: true }
        await offline.putCustomerLocal(local)
        await offline.queueAction({ type: 'create_customer', payload })
        setCustomers(prev=> [...prev, local])
        setPendingSync(await offline.pendingCount())
        return local
      }
      throw e
    }
  }
  const updateCustomer = async (id, patch) => {
    try {
      await api.updateCustomer(id, patch)
      await refreshAll()
    } catch (e) {
      if (e.message==='OFFLINE' || e.message.includes('Failed to fetch')) {
        // local update
        const cust = customers.find(c=>c.id===id)
        if (cust) {
          const upd = { ...cust, ...patch }
          await offline.putCustomerLocal(upd)
          setCustomers(prev=> prev.map(x=> x.id===id? upd: x))
          await offline.queueAction({ type: 'update_customer', id, payload: patch })
          setPendingSync(await offline.pendingCount())
          return
        }
      }
      throw e
    }
  }
  const deleteCustomer = async (id) => {
    try {
      await api.deleteCustomer(id)
      await refreshAll()
    } catch (e) {
      if (e.message==='OFFLINE' || e.message.includes('Failed to fetch')) {
        await offline.deleteCustomerLocal(id)
        await offline.queueAction({ type: 'delete_customer', id })
        setCustomers(prev=> prev.filter(x=> x.id!==id))
        setPendingSync(await offline.pendingCount())
        return
      }
      throw e
    }
  }
  const upgradePlan = async () => {
    const billing = await api.upgradeBilling()
    setPlan({ tier: billing.tier, used: billing.used, limit: billing.limit, price: billing.price || 99 })
    await offline.setMeta('plan', { tier: billing.tier, used: billing.used, limit: billing.limit, price: billing.price || 99 })
    return billing
  }

  return (
    <ShopDataContext.Provider value={{
      customers, homeEntries, plan, loading, isOffline, pendingSync,
      refreshAll, reset, addOrUpdateEntry, addCustomer, updateCustomer, deleteCustomer, upgradePlan,
    }}>
      {children}
    </ShopDataContext.Provider>
  )
}

export const useShopData = () => useContext(ShopDataContext)