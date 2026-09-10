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
  // vite-plugin-pwa auto registers, but ensure
}
initAutoSync()

// expose for debug
window.BolKhataOffline = true
