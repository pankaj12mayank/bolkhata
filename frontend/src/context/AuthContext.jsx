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
      try {
        const me = await api.me()
        if (me.role === 'admin') {
          setRole('admin')
          setAdminProfileState({ name: me.name || 'Admin', email: me.email || '' })
        } else {
          setRole('user')
          setShopProfileState({
            shopName: me.shop.shop_name,
            ownerName: me.shop.owner_name,
            phone: me.shop.phone,
            language: me.shop.language,
          })
        }
      } catch {
        clearToken()
      } finally {
        setBooting(false)
      }
    }
    restore()
  }, [])

  const loginWithToken = (token, r) => {
    setToken(token)
    setRole(r)
  }

  const setShopProfile = (profile) => setShopProfileState(profile)
  const setAdminProfile = (profile) => setAdminProfileState(profile)

  const logout = () => {
    clearToken()
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
