const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

function getToken() {
  return localStorage.getItem('bolkhata_token') || ''
}

export async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let data = null
  try { data = await res.json() } catch { /* empty body */ }
  if (!res.ok) {
    const message = data?.detail || 'Kuch galat ho gaya. Dobara try karein.'
    throw new Error(message)
  }
  return data
}

export const api = {
  sendOtp: (phone) => apiFetch('/auth/otp/send', { method: 'POST', body: { phone }, auth: false }),
  verifyOtp: (payload) => apiFetch('/auth/otp/verify', { method: 'POST', body: payload, auth: false }),
  adminLogin: (email, password) => apiFetch('/auth/admin/login', { method: 'POST', body: { email, password }, auth: false }),
  me: () => apiFetch('/auth/me'),
  updateShop: (payload) => apiFetch('/shop', { method: 'PUT', body: payload }),

  listCustomers: () => apiFetch('/customers'),
  createCustomer: (payload) => apiFetch('/customers', { method: 'POST', body: payload }),
  getCustomer: (id) => apiFetch(`/customers/${id}`),
  updateCustomer: (id, payload) => apiFetch(`/customers/${id}`, { method: 'PUT', body: payload }),
  deleteCustomer: (id) => apiFetch(`/customers/${id}`, { method: 'DELETE' }),
  remindCustomer: (id) => apiFetch(`/customers/${id}/remind`, { method: 'POST' }),

  createEntry: (payload) => apiFetch('/entries', { method: 'POST', body: payload }),
  todayEntries: () => apiFetch('/entries/today'),

  getBilling: () => apiFetch('/billing'),
  upgradeBilling: () => apiFetch('/billing/upgrade', { method: 'POST' }),
  createBillingOrder: () => apiFetch('/billing/create-order', { method: 'POST' }),
  verifyBilling: (payload) => apiFetch('/billing/verify', { method: 'POST', body: payload }),

  // voice
  transcribeVoice: (file, language = 'Hinglish') => {
    const token = getToken()
    const fd = new FormData()
    fd.append('file', file)
    fd.append('language', language)
    return fetch(`${API_BASE}/voice/transcribe`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    }).then(async r => {
      const data = await r.json().catch(() => null)
      if (!r.ok) throw new Error(data?.detail || 'Transcribe fail')
      return data
    })
  },
  parseVoice: (text, language) => apiFetch('/voice/parse', { method: 'POST', body: { text, language } }),
  transcribeAndParse: (file, language = 'Hinglish') => {
    const token = getToken()
    const fd = new FormData()
    fd.append('file', file)
    fd.append('language', language)
    return fetch(`${API_BASE}/voice/transcribe-and-parse`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    }).then(async r => {
      const data = await r.json().catch(() => null)
      if (!r.ok) throw new Error(data?.detail || 'Voice parse fail')
      return data
    })
  },

  adminOverview: () => apiFetch('/admin/overview'),
  adminShops: (status) => apiFetch(`/admin/shops${status && status !== 'all' ? `?status=${status}` : ''}`),
  adminShopDetail: (id) => apiFetch(`/admin/shops/${id}`),
  adminSubscriptions: (status) => apiFetch(`/admin/subscriptions${status && status !== 'all' ? `?status=${status}` : ''}`),
  adminLogs: (status) => apiFetch(`/admin/logs${status && status !== 'all' ? `?status=${status}` : ''}`),
  toggleShopStatus: (id, is_active) => apiFetch(`/admin/shops/${id}/status`, { method: 'PUT', body: { is_active } }),
  deleteShop: (id) => apiFetch(`/admin/shops/${id}`, { method: 'DELETE' }),

  // admin settings
  getSettings: () => apiFetch('/admin/settings'),
  getSettingsRaw: () => apiFetch('/admin/settings/raw'),
  updateSettings: (payload) => apiFetch('/admin/settings', { method: 'PUT', body: payload }),
  testRazorpay: () => apiFetch('/admin/settings/test/razorpay', { method: 'POST' }),
  testRazorpayCustom: (payload) => apiFetch('/admin/settings/test/razorpay-custom', { method: 'POST', body: payload }),
  testWhisper: () => apiFetch('/admin/settings/test/whisper', { method: 'POST' }),
  testClaude: () => apiFetch('/admin/settings/test/claude', { method: 'POST' }),
  testAi: () => apiFetch('/admin/settings/test/ai', { method: 'POST' }),
  testWhatsapp: () => apiFetch('/admin/settings/test/whatsapp', { method: 'POST' }),
  testOtp: () => apiFetch('/admin/settings/test/otp', { method: 'POST' }),
  resetAllData: (payload) => apiFetch('/admin/settings/reset', { method: 'POST', body: payload }),
}

export function setToken(token) {
  if (token) localStorage.setItem('bolkhata_token', token)
}
export function clearToken() {
  localStorage.removeItem('bolkhata_token')
}
export function hasToken() {
  return Boolean(getToken())
}
