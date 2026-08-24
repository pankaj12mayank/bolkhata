import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('bolkhata_theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') } catch { return 'dark' }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try { localStorage.setItem('bolkhata_theme', theme) } catch {}
  }, [theme])

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)