# 🔄 BolKhata — Complete Offline + Online Working Guide

> The application works **100% both offline and online**. This document explains exactly how.

---

## 📐 How It Works

### Online Mode (Backend Available)
```
User speaks → STT (Browser) → Text → POST /api/voice/query → Backend processes → Text answer → TTS (Native Browser SpeechSynthesis) → Voice response
```
- All data comes from the backend database
- Voice queries use `/api/voice/query` endpoint
- Service Worker caches API responses for speed
- Background sync keeps the queue empty

### Offline Mode (No Backend)
```
User speaks → STT (Browser or Local Whisper) → Text → Local Processing → Voice response (Native Browser SpeechSynthesis)
```
- Customer data, entries, and balances come from IndexedDB
- Voice queries are processed locally from cached data
- TTS (`window.speechSynthesis`) speaks using native device Hindi (`hi-IN`) & English (`en-IN`) voice with **zero server dependency**
- Any POST operations are queued in IndexedDB
- When back online, Service Worker auto-syncs all queued operations

---

## 🎤 Voice Commands (Work Both Offline & Online)

### How to Use
1. Tap the **mic button** (bottom-right corner)
2. **Speak** your query (Hinglish, Hindi, or English)
3. The app listens → processes → **speaks back the answer**

### Supported Commands

| Say This | What Happens | Offline? |
|-----------|-------------|----------|
| "Total kitna hua" | Total earnings, received, balance | ✅ Yes |
| "Kitne user hain" | Customer count | ✅ Yes |
| "User ka detail" | All customer names & balances | ✅ Yes |
| "Balance batao" | Total balance across all customers | ✅ Yes |
| "Kitne entry hain" | Total transaction count | ✅ Yes |
| "Hello" / "Namaste" | Greeting with help menu | ✅ Yes |
| "Help" | Lists available commands | ✅ Yes |

### Quick Buttons
Three quick-tap buttons below the mic:
- **💰 Total** — Quick total query
- **👥 Users** — Customer count
- **📋 Details** — Customer list

> Buttons sirf examples hain — mic dabakar **koi bhi sawaal** poochho, jawab milta hai.

### Admin Voice Assistant (Quick Ask)
Admin panel ka mic **4 saal tak limited nahi** — speech se koi bhi sawaal poochho aur pura platform data milega:
- "Total kitne shops" → total/active/inactive dukaanein
- "MRR batao" → monthly recurring revenue
- "Aaj ki entries" → aaj ka entry count
- "Voice parse safalta" → parse success %
- "Kitne paid dukaanein" → paid vs free + conversion
- "Overview full" ya kuch bhi → pura platform summary (fallback)

---

## 🔒 Data Isolation (Zero Data Leaking)

**Every query is filtered by `shop_id` from the JWT token.**

```python
# Backend query.py example
db.query(models.Customer).filter(models.Customer.shop_id == shop.id)
# Only returns customers belonging to THIS shop
```

- Shop A can NEVER see Shop B's data
- The JWT token contains the shop ID
- All SQL queries include `shop_id == shop.id` filter
- Admin panel can see all shops (admin role), shopkeeper cannot

---

## 🗣️ TTS (Text-to-Speech) — Admin's Cloned Voice (XTTS v2)

### How It Works
- **No browser speechSynthesis, no edge-tts, no cloud API** — only one local neural model: **Coqui XTTS v2** running on the backend
- Admin records a short voice sample (Hindi or English), clones it in **Admin → Voice Clone**
- Once cloned and **Active**, the whole system (user + admin sides) speaks in the **admin's own voice**
- After cloning, TTS is **100% offline with zero API dependency**
- Frontend `tts.js` simply POSTs text to `/api/tts/speak` and plays the returned WAV

### Admin Voice Clone Flow
1. Go to **Admin → Voice Clone**
2. Upload a clear WAV/MP3 sample (6–30 seconds, Hinglish works great)
3. Pick the language (Hindi `hi` / English `en`)
4. Click **Clone Voice** (first run downloads the ~1.9GB XTTS v2 model once; needs CPML license consent)
5. Click **Test Voice** to hear the cloned voice
6. Toggle **Active** on

### What Happens Later
- `/api/tts/speak` (public) → speaks in admin's cloned voice
- Active hai → `/api/tts/status` shows `cloned: true, active: true`
- Speaker sample stored at `backend/tts_data/speaker.wav`, config at `backend/tts_data/config.json`

### Requirements
- Coqui `TTS==0.22.0` + `torch` on backend (`requirements.txt`)
- CPU inference: model load ~100s (first call), then short sentences ~30-45s each
- Server needs ~3GB RAM and ~2GB disk for the model

---

## 📦 Offline Storage (IndexedDB)

### What's Stored Offline
| Store | Data | Purpose |
|-------|------|---------|
| `customers` | Customer list with balances | Offline customer view |
| `entries` | Transaction entries | Offline ledger |
| `sync_queue` | Pending operations | Background sync |
| `cash_days` | Cash reconciliation data | Offline cash view |
| `meta` | Plan info, last sync | Offline plan view |
| `shop_profile` | Shop details | Offline profile |

### Sync Queue
When offline, POST/PUT/DELETE operations are stored in `sync_queue`. When the device comes online:
1. Service Worker detects network change
2. `sync.js` automatically processes the queue
3. Each queued operation is sent to the backend
4. On success, item is removed from queue
5. On failure, item stays for retry

---

## 🌐 Service Worker (PWA)

### Caching Strategy
| Resource | Strategy | Why |
|----------|----------|-----|
| `index.html` | NetworkFirst | Always fresh |
| `/api/*` | NetworkFirst | Fresh data, fallback to cache |
| Google Fonts | CacheFirst | Rarely changes |
| HuggingFace Models | CacheFirst | Large files, rarely change |
| CDN JS | CacheFirst | Stable libraries |

### How It Helps Offline
1. **First load online**: All assets cached by Service Worker
2. **Subsequent offline loads**: Service Worker serves cached assets instantly
3. **API calls offline**: NetworkFirst → falls back to cached response after timeout
4. **App shell**: Always loads from cache, never fails

---

## 🔐 Auth & Session (Offline Capable)

### How Auth Works Offline
1. Login creates JWT token stored in `localStorage`
2. `AuthContext` restores session from `localStorage`
3. If backend is unreachable, **session is preserved**
4. Profile data is cached from `localStorage`
5. When online, `api.me()` validates token with backend

### Session Restoration Flow
```
Page load → Check localStorage → Has token?
  → Yes → api.me()
    → Success → Full profile loaded from backend
    → Offline → Restore from localStorage cache
  → No → Show login page
```

---

## 📱 PWA Installation

### Install as App (Mobile/Desktop)
1. Open in Chrome/Edge on Android/Windows
2. Browser shows "Install BolKhata" prompt
3. Or: Menu → "Install BolKhata"
4. App opens as standalone PWA
5. **Works fully offline** after first load

### Requirements for PWA
- HTTPS (except localhost)
- Valid `manifest.webmanifest`
- Registered Service Worker
- Proper icons (192px, 512px)

---

## 🔄 Auto-Sync Behavior

### When Online Returns
```
Network detected → trySyncAll() called
  → Sort queue by timestamp
  → Process each item sequentially
  → On success → Remove from queue
  → On network failure → Stop, retry later
  → On server error → Keep for retry
```

### Sync Interval
- **Online**: Auto-sync every 30 seconds
- **Network change**: Sync after 800ms delay
- **Manual**: Sync button available in OfflineBadge

---

## 🧪 Testing Offline Mode

### Manual Testing Steps
1. Start the app with internet
2. Log in as a shopkeeper
3. Open DevTools → Application → Service Workers
4. Check "Offline" checkbox in Network tab
5. Try voice commands: "Total kitna hua" → Should get offline answer
6. Try creating a new entry → Should queue in IndexedDB
7. Uncheck "Offline" → Auto-sync should process queue
8. Verify all data synced correctly

### What to Verify Offline
- [ ] App loads without internet (Service Worker cached)
- [ ] Voice commands work (local data processing)
- [ ] TTS responds (Native Browser SpeechSynthesis offline)
- [ ] Customer list shows cached data
- [ ] New entries queue in IndexedDB
- [ ] Session persists (JWT in localStorage)
- [ ] Auto-sync works when back online

---

## 📋 File Summary

### New/Modified Files
| File | Purpose |
|------|---------|
| `frontend/src/lib/tts.js` | Native Browser SpeechSynthesis client (100% offline, zero server load) |
| `frontend/src/components/VoiceCommand.jsx` | Voice command UI + offline processing |
| `frontend/src/lib/offline.js` | IndexedDB offline storage (updated) |
| `frontend/src/lib/sync.js` | Background sync queue (updated) |
| `frontend/src/lib/api.js` | API client with offline queue (updated) |
| `frontend/src/context/AuthContext.jsx` | Offline session restore (updated) |
| `frontend/src/context/ShopDataContext.jsx` | OFFLINE_QUEUED handling (updated) |
| `frontend/src/layouts/UserLayout.jsx` | VoiceCommand integration |
| `frontend/src/main.jsx` | Service worker registration |
| `frontend/vite.config.js` | PWA + Workbox config |
| `frontend/index.html` | PWA manifest link |
| `backend/app/routers/query.py` | Voice query endpoint (shop_id isolated) |
| `backend/app/schemas.py` | VoiceQueryIn/Out schemas |
| `backend/app/main.py` | Updated imports |
| `backend/requirements.txt` | Updated dependencies |
| `frontend/public/pwa-192.png` | PWA icon |
| `frontend/public/pwa-512.png` | PWA icon |
| `frontend/public/favicon.svg` | App icon (existing) |

### Documentation
| File | Purpose |
|------|---------|
| `README.md` | Complete project documentation |
| `DEPLOYMENT.md` | Free to Paid deployment guide |
| `OFFLINE_ONLINE.md` | This file — offline/online guide |

---

## 🎯 Quick Reference

```
ONLINE:  User speaks → Backend processes → TTS responds (Native Browser Speech) → Data accurate
OFFLINE: User speaks → Local IndexedDB processes → TTS responds (Native Browser Speech) → Data from cache
SYNC:    When online → All queued operations sync automatically
ISOLATION: Every query filtered by shop_id from JWT — zero data leak
TTS:     Native Web Speech API (`window.speechSynthesis`) — 100% offline Hindi (`hi-IN`) & English (`en-IN`)
```

---

## 📜 License

MIT License — Created for Bharat's Kirana Dukaandaars.

**Made with ❤️ — BolKhata: Bas Boliye, Hisaab Ho Jayega.**
