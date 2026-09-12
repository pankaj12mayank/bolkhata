# 🔄 BolKhata — Complete Offline + Online Technical Guide

> The application works **100% both offline and online**. This document explains the complete technical flow.

---

## 📐 System Architecture

### Online Mode (Backend Active)
```
User speaks → STT (Browser Web Speech API) → Text (Devanagari/Roman) → POST /api/voice/query → Backend query.py → Text answer → TTS Engine (speechSynthesis.resume()) → Voice response
```
- All data is fetched live from database with `shop_id` isolation
- Voice queries process via `/api/voice/query` endpoint
- Service Worker caches API responses for fast load times
- Background sync queue auto-flushes pending offline transactions when online

### Offline Mode (No Backend Connection)
```
User speaks → STT (Browser Web Speech API / Local Whisper) → Text → Local Data Processing (IndexedDB) → TTS Engine (speechSynthesis.resume()) → Native Device Voice (`hi-IN` / `en-IN`)
```
- Customer data, entries, and balances load directly from IndexedDB
- Voice queries process locally via `processOffline` in `VoiceCommand.jsx`
- Device native Web Speech Synthesis (`window.speechSynthesis`) speaks in `hi-IN` (Hindi) or `en-IN` (English) with **zero server dependency**
- POST operations (new entries, customer updates) queue in IndexedDB
- Service Worker auto-syncs queued operations when connection restores

---

## 🎤 Voice Assistant & Siri/Google-Style AI Voice Orb

### User Interface Design
1. **Interactive AI Voice Orb**:
   - Replaces static popups with an animated floating voice orb (bottom right).
   - Features animated expanding aura rings when listening (red) or speaking (green).
   - Zero text popups blocking the main screen (`dikhana nahi h data`).

2. **Icon-Only Guidance Button**:
   - Replaces text buttons with a sleek `HelpCircle` icon button.
   - Clicking displays a dark glassmorphism popover card ("Question kaise poochhen / How to ask questions").

---

## 🗣️ Devanagari & Roman Keyword Matching

When users speak in Hindi via Web Speech API, Chrome outputs Devanagari text (e.g. `"टोटल कितना हुआ"`, `"एमआरआर कितना है"`, `"रमेश का बैलेंस"`). 

### Voice Recognition Engine Handles:
- **Devanagari Script**: `उधार`, `दिया`, `जमा`, `वसूल`, `बैलेंस`, `बाकी`, `कुल`, `ग्राहक`, `एंट्री`, `आज`, `कमाई`, `दुकान`
- **Roman Script**: `udhaar`, `diya`, `jama`, `vasool`, `balance`, `baki`, `total`, `grahak`, `entry`, `aaj`, `kamai`, `shop`
- **Merchant Fallback**: General queries about shop data return **Full Shop Summary** (total credit given, payment received, remaining balance).
- **Admin Fallback**: General queries about platform status return **Full Platform Overview** (total shops, active count, MRR, entries today, parse rate, conversion rate).

---

## 🔒 Data Isolation & Security

**Every query is strictly filtered by `shop_id` extracted from the verified JWT token.**

```python
# backend/app/routers/query.py
db.query(models.Customer).filter(models.Customer.shop_id == shop.id)
```

- Merchant A can NEVER view or hear Merchant B's ledger data.
- Admin role can access aggregate platform metrics without exposing raw merchant balances.

---

## 🚀 Native Speech Synthesis Engine (`tts.js`)

- Includes automatic Chrome deadlock prevention (`window.speechSynthesis.resume()`).
- Language syncing with active portal language (`en` -> `en-IN`, `hi` -> `hi-IN`).
- Text normalization (cleans special symbols, formats currency values as "Rupaye" or "Rupees" for natural spoken Hindi/English).
- Single playback callback mechanism to prevent duplicate speech playback.

---

## 📜 Summary of Offline vs Online Feature Matrix

| Feature | Offline PWA | Online API |
|---------|-------------|------------|
| **Speech Recognition** | ✅ Browser Web Speech / Local Whisper | ✅ Web Speech API / OpenAI Whisper |
| **Voice Feedback (TTS)** | ✅ Native `hi-IN` & `en-IN` Synthesis | ✅ Native `hi-IN` & `en-IN` Synthesis |
| **Voice Queries** | ✅ IndexedDB Local Processing | ✅ Backend `/api/voice/query` |
| **Customer Management** | ✅ IndexedDB + Sync Queue | ✅ Backend FastAPI Router |
| **Transaction Logs** | ✅ IndexedDB + Sync Queue | ✅ Backend FastAPI Router |
| **Admin Dashboard** | ⚠️ Cached metrics | ✅ Real-time platform stats |
