import { createContext, useContext, useState, useCallback } from 'react'
import { api } from '../lib/api'

const ShopDataContext = createContext(null)

export function ShopDataProvider({ children }) {
  const [customers, setCustomers] = useState([])
  const [homeEntries, setHomeEntries] = useState([])
  const [plan, setPlan] = useState({ tier: 'Free', used: 0, limit: 15, price: 99 })
  const [loading, setLoading] = useState(false)

  const refreshAll = useCallback(async () => {
    setLoading(true)
    try {
      const [custs, entries, billing] = await Promise.all([
        api.listCustomers(),
        api.todayEntries(),
        api.getBilling(),
      ])
      setCustomers(custs || [])
      setHomeEntries((entries || []).map(e => ({
        name: e.customer_name, type: e.type, amount: e.amount,
        time: new Date(e.created_at).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
      })))
      if (billing) setPlan({ tier: billing.tier, used: billing.used, limit: billing.limit, price: billing.price || 99 })
    } catch(e){
      // keep previous data, let caller handle toast
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = () => { setCustomers([]); setHomeEntries([]); setPlan({ tier: 'Free', used: 0, limit: 15, price: 99 }) }

  const addOrUpdateEntry = async (name, amount, type, raw, source = 'voice') => {
    const result = await api.createEntry({ customer_name: name, amount, type, raw_voice_text: raw, source })
    await refreshAll()
    return result
  }

  const addCustomer = async (name, phone, balance) => {
    const c = await api.createCustomer({ name, phone, balance })
    await refreshAll()
    return c
  }
  const updateCustomer = async (id, patch) => {
    await api.updateCustomer(id, patch)
    await refreshAll()
  }
  const deleteCustomer = async (id) => {
    await api.deleteCustomer(id)
    await refreshAll()
  }
  const upgradePlan = async () => {
    const billing = await api.upgradeBilling()
    setPlan({ tier: billing.tier, used: billing.used, limit: billing.limit, price: billing.price || 99 })
    return billing
  }

  return (
    <ShopDataContext.Provider value={{
      customers, homeEntries, plan, loading,
      refreshAll, reset, addOrUpdateEntry, addCustomer, updateCustomer, deleteCustomer, upgradePlan,
    }}>
      {children}
    </ShopDataContext.Provider>
  )
}

export const useShopData = () => useContext(ShopDataContext)