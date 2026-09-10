import { createContext, useContext, useEffect, useState } from 'react'
import { api, setToken, clearToken, hasToken } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [role, setRole] = useState(null) // 'user' | 'admin' | null
  const [shopProfile, setShopProfileState] = useState(null)
  const [adminProfile, setAdminProfileState] = useState(null)
  const [booting, setBooting] = useState(true)

  // Restore session on page load if a token already exists
  useEffect(() => {
    async function restore() {
      if (!hasToken()) { setBooting(false); return }
      const cachedRole = localStorage.getItem('bolkhata_role')
      const cachedShopProf = localStorage.getItem('bolkhata_shop_profile')
      const cachedAdminProf = localStorage.getItem('bolkhata_admin_profile')

      if (cachedRole === 'admin' && cachedAdminProf) {
        try { setAdminProfileState(JSON.parse(cachedAdminProf)) } catch {}
        setRole('admin')
      } else if (cachedRole === 'user' && cachedShopProf) {
        try { setShopProfileState(JSON.parse(cachedShopProf)) } catch {}
        setRole('user')
      }

      try {
        const me = await api.me()
        if (me.role === 'admin') {
          setRole('admin')
          const prof = { name: me.name || 'Admin', email: me.email || '' }
          setAdminProfileState(prof)
          localStorage.setItem('bolkhata_role', 'admin')
          localStorage.setItem('bolkhata_admin_profile', JSON.stringify(prof))
        } else {
          setRole('user')
          const prof = {
            shopName: me.shop.shop_name,
            ownerName: me.shop.owner_name,
            phone: me.shop.phone,
            language: me.shop.language,
            upi_id: me.shop.upi_id || '',
          }
          setShopProfileState(prof)
          localStorage.setItem('bolkhata_role', 'user')
          localStorage.setItem('bolkhata_shop_profile', JSON.stringify(prof))
        }
      } catch (e) {
        // If 401/403 unauthorized, clear token. If offline/network error, keep session!
        if (e.status === 401 || e.status === 403) {
          clearToken()
          localStorage.removeItem('bolkhata_role')
          localStorage.removeItem('bolkhata_shop_profile')
          localStorage.removeItem('bolkhata_admin_profile')
          setRole(null)
          setShopProfileState(null)
          setAdminProfileState(null)
        }
      } finally {
        setBooting(false)
      }
    }
    restore()
  }, [])

  const loginWithToken = (token, r) => {
    setToken(token)
    setRole(r)
    localStorage.setItem('bolkhata_role', r)
  }

  const setShopProfile = (profile) => {
    setShopProfileState(profile)
    if (profile) localStorage.setItem('bolkhata_shop_profile', JSON.stringify(profile))
  }
  const setAdminProfile = (profile) => {
    setAdminProfileState(profile)
    if (profile) localStorage.setItem('bolkhata_admin_profile', JSON.stringify(profile))
  }

  const logout = () => {
    clearToken()
    localStorage.removeItem('bolkhata_role')
    localStorage.removeItem('bolkhata_shop_profile')
    localStorage.removeItem('bolkhata_admin_profile')
    setRole(null)
    setShopProfileState(null)
    setAdminProfileState(null)
  }

  return (
    <AuthContext.Provider value={{ role, booting, loginWithToken, logout, shopProfile, setShopProfile, adminProfile, setAdminProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
