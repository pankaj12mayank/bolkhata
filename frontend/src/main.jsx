import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { initAutoSync } from './lib/sync.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

// PWA + offline sync init
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      if (import.meta.env.PROD) {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        console.log('SW registered:', registration.scope)
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New content available, refresh to update')
            }
          })
        })
      }
    } catch (e) {
      console.log('SW registration failed:', e)
    }
  })
}
initAutoSync()

window.BolKhataOffline = true
window.BolKhataIsOnline = navigator.onLine
