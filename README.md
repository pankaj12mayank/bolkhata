# BolKhata — Voice-First Udhaar & Khata Tracker for Bharat 🇮🇳

> **Bas boliye, hisaab ho jayega.** Kirana dukaandaron ke liye Hinglish/Hindi/English voice se udhaar track karo — type karne ki zaroorat nahi. **100% Offline-ready PWA**, Dynamic Plans System, Automated Reminders, AI Voice Assistant & Razorpay Payments.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688)]()
[![React](https://img.shields.io/badge/React-18-61DAFB)]()
[![Vite](https://img.shields.io/badge/Vite-5-646CFF)]()
[![PWA](https://img.shields.io/badge/PWA-Ready-4A90E2)]()
[![Offline-First](https://img.shields.io/badge/Offline--First-100%25-green)]()
[![TTS](https://img.shields.io/badge/TTS-Voice-Command-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

---

## 🚀 Key Highlights

- 🎙️ **Voice-First AI Udhaar Entry**: Speech-to-Text via **Browser Web Speech API** (Free/Offline), **In-Browser Local Whisper Tiny** (Offline PWA), or **OpenAI Whisper API**. Automatically extracts Customer Name, Amount, Type (`credit_given` / `payment_received`), and Hinglish numbers (*"Ramesh ko paanch sau udhaar diya"* → ₹500).
- 🗣️ **Native Voice Assistant & Voice Orbs**: Bol ke pucho — *"Total kitna hua"*, *"Kitne user hain"*, *"User ka detail"*, *"Balance batao"*. Device/Browser's native Web Speech API & TTS (`hi-IN` Hindi & `en-IN` English) audio feedback — 100% free, 100% offline, zero server load, deadlock-free (`speechSynthesis.resume()`).
- 🤖 **Devanagari + Roman Script Recognition**: Recognizes both spoken Devanagari Hindi text (`"टोटल कितना हुआ"`, `"एमआरआर कितना है"`, `"कितने ग्राहक हैं"`) and Roman script. Smart fallback returns Full Platform Overview for Admin and Full Shop Summary for Merchants.
- 🔮 **Interactive AI Voice Orb UI**: Siri/Google-style animated voice orb with expanding soundwave aura rings. No cluttered text popups on main screen when speaking (`dikhana nahi h data`).
- 💡 **Icon-Only Guidance Button**: Compact icon-only help button (`HelpCircle`) showing a guidance card on how to ask questions ("Question kaise poochhen").
- 📲 **100% Offline-First PWA**: Full ServiceWorker PWA support (`sw.js`). **Frontend works WITHOUT backend.** Data stored in IndexedDB automatically. Background sync queue syncs pending entries when connectivity returns.
- 👑 **Dynamic Admin Plans Management**: Centrally manage Free, Standard (Pro), and Paid tiers from Admin (`/admin/plans`). Configure price, entry limits (-1 for unlimited), featured badges, and Hindi/English feature lists in real-time.
- 💳 **Razorpay & Mock Payment Gateway**: Complete subscription checkout integration with Razorpay Webhook signatures and zero-charge Mock Mode for testing.
- ⏰ **Scheduled Auto-Reminders & UPI Pay Links**: Background scheduler for weekly WhatsApp & SMS reminders. Automatically generates `upi://pay?pa=...` links pre-filled with customer balance.
- 📊 **Cash Counter & Daily Reconciliation**: End-of-day denomination counter with expected cash variance calculations and 7-day history.
- 📑 **CSV Ledger Export**: Standard and Paid tier gated CSV exports.
- 🔐 **Hidden Admin Access & Eye Password Toggles**: Admin login accessible via `/admin` or `/bolkhata`. Includes reusable `SecretInput` eye-toggle components.
- 🛡️ **Primary Key Data Protection**: Email and Phone numbers are immutable primary keys across user and admin profiles.
- 🎨 **Modern Full-Width Responsive Design**: Clean dark/light mode toggle, custom iOS-style toggle rows, and 100% language key parity (Hindi/English).

---

## 🧱 Tech Stack

### Frontend
- **Framework**: `React 18` + `Vite 5` (PWA with `vite-plugin-pwa` / Workbox)
- **Offline Storage**: IndexedDB (`offline.js`) + Background Sync Queue (`sync.js`)
- **Service Worker**: Auto-registered PWA with NetworkFirst caching
- **TTS Engine**: Native Web Speech API (`window.speechSynthesis`) — 100% offline Hindi (`hi-IN`) & English (`en-IN`) voice output with zero server footprint and automatic deadlock recovery (`resume()`).
- **STT**: Browser Web Speech API + `@xenova/transformers` local Whisper Tiny
- **Styling**: Vanilla CSS + Tailwind utilities, HSL CSS variables
- **Icons & Motion**: `lucide-react`, `framer-motion`
- **Localization**: Custom `LangContext` — complete Hindi/English dictionary parity

### Backend
- **Framework**: `FastAPI 0.111.0`
- **Database**: `SQLAlchemy 2.0` (SQLite for local dev, PostgreSQL for production)
- **Security & Auth**: `python-jose` (JWT), Passlib/PBKDF2 password hashing, rate-limited OTP
- **Payments**: Razorpay SDK & HMAC Webhook verification
- **Scheduler**: Background threading worker for automated weekly reminders
- **Exports**: Native streaming CSV export module
- **Voice Query**: `/api/voice/query` endpoint — processes Devanagari & Roman text queries with shop_id data isolation

---

## 📂 Codebase Structure

```
bolkhata/
├── backend/
│   ├── app/
│   │   ├── main.py              # Application lifespan, CORS, seed demo data
│   │   ├── config.py            # Environment variables & system defaults
│   │   ├── database.py          # Database session pooling (SQLite/Postgres)
│   │   ├── models.py            # SQLAlchemy models (Shop, Customer, Entry, Subscription, PlatformSettings)
│   │   ├── schemas.py           # Pydantic v2 validation schemas
│   │   ├── security.py          # JWT creation/verification & OTP rate limiting
│   │   ├── routers/
│   │   │   ├── auth.py          # OTP login, Admin login, Profile endpoints
│   │   │   ├── customers.py     # Customer CRUD, WhatsApp link generator & reminders
│   │   │   ├── entries.py       # Voice/Manual entry creation & daily transaction logs
│   │   │   ├── billing.py       # Order creation, Razorpay checkout & webhook handler
│   │   │   ├── admin.py         # Admin dashboard analytics, Shops, Subscriptions, Plans, Logs
│   │   │   ├── settings.py      # Platform configuration settings, Test endpoints & Reset
│   │   │   ├── voice.py         # Voice transcription & AI Hinglish parser routes
│   │   │   ├── query.py         # Voice query endpoint — shop_id isolated with Devanagari matching
│   │   │   ├── cash.py          # Cash counter & daily reconciliation
│   │   │   ├── insights.py      # Dashboard insights & analytics
│   │   │   ├── export.py        # CSV data export for shop ledgers
│   │   │   └── password_reset.py# Password reset functionality
│   │   └── services/
│   │       ├── parse_service.py # Hinglish number parsing
│   │       ├── voice_service.py # Whisper API integration
│   │       ├── razorpay_service.py
│   │       ├── remind_service.py # Automated reminder builder
│   │       ├── settings_service.py
│   │       └── reminder_job.py  # Background scheduler worker
│   ├── bolkhata.db             # Local SQLite database
│   ├── requirements.txt        # Python backend dependencies
│   ├── .env.example            # Environment template
│   └── .env                    # Environment variables (create from .env.example)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main router & application providers
│   │   ├── components/          # Reusable UI components
│   │   │   ├── VoiceCommand.jsx # 🎤 Voice Command + Siri-style AI Voice Orb (Merchant)
│   │   │   ├── AdminVoiceCommand.jsx # 👑 Voice Command + Siri-style AI Voice Orb (Admin)
│   │   │   ├── OfflineBadge.jsx # Offline status indicator
│   │   │   └── ...
│   │   ├── context/             # AuthContext, ShopDataContext, LangContext, ThemeContext
│   │   ├── lib/                 # api.js, offline.js (IndexedDB), sync.js (Background Queue), tts.js (Voice), stt.js (Speech)
│   │   └── pages/
│   │       ├── Landing.jsx, LoginGateway.jsx, DukaandaarLogin.jsx, AdminLogin.jsx, Onboarding.jsx
│   │       ├── user/            # Merchant portal (Home, NewEntry, CustomerList, Billing, Profile, CashCounter)
│   │       └── admin/           # Admin panel (Overview, Shops, Plans, Payments, Settings, Logs, etc.)
│   ├── public/                  # Static assets (favicon, manifest, PWA icons)
│   ├── index.html               # Main HTML entry point with PWA manifest link
│   ├── vite.config.js           # Vite & PWA ServiceWorker configuration
│   ├── package.json             # Frontend dependencies
│   └── check-lang.js            # Translation key parity verification script
│
├── DEPLOYMENT.md                # 🚀 Complete deployment guide (Free to Paid)
├── OFFLINE_ONLINE.md            # 🔄 Offline + Online technical guide
└── README.md                    # Project Documentation
```

---

## 🔄 How Offline + Online Works

### Online Mode
1. All operations go through API → Backend → Response
2. Voice commands use backend `/api/voice/query` for accurate data
3. Service Worker caches API responses for fast loading
4. Background sync keeps queue empty

### Offline Mode
1. **GET requests**: Load from IndexedDB, no network needed
2. **POST/PUT/DELETE**: Queued in IndexedDB sync queue, auto-sync when online
3. **Voice Commands**: Processed locally from IndexedDB data — Total, Customer count, Details, Balance all work offline!
4. **TTS**: Native Web Speech API speaks using device `hi-IN` & `en-IN` voices with zero server dependency
5. **STT**: Works offline using local Web Speech API / Whisper Tiny model
6. **Session**: Auth tokens persist in localStorage, profile restored from cache

---

## ⚡ Quick Start Guide

### Option A: FULLY OFFLINE — No Backend Needed! 🆓

```bash
cd frontend

# Install dependencies
npm install

# Run Vite development server
npm run dev
```
> Frontend opens at `http://localhost:5173`. **Fully functional offline!**

### Option B: With Backend 🐍

**Terminal 1 — Backend:**
```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Run FastAPI backend server
python run_backend.py
```
> Server starts at `http://127.0.0.1:8000`.

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```
> Frontend opens at `http://localhost:5173`.

---

## 🔑 Demo Access & Credentials

| Role | Access URL | Credentials | Demo Data |
|------|------------|-------------|-----------|
| **Dukaandaar (Merchant)** | `http://localhost:5173/login` | Phone: `9876543210` → OTP: `1234` | Pre-loaded with customers & entries |
| **New Merchant** | `http://localhost:5173/login` | Any 10-digit phone → OTP: `1234` | Creates brand new shop account |
| **Admin Panel** | `http://localhost:5173/admin` | Email: `admin@bolkhata.in`<br>Password: `admin123` | Full administrative control |

---

## 🗣️ Voice Command Reference

### Merchant Voice Assistant
| Bol Sakte Ho (Devanagari / Roman / English) | Jawab Milega | Offline? |
|---------------------------------------------|--------------|----------|
| "Total kitna hua" / "टोटल कितना हुआ" | Total credit given, received & balance | ✅ Yes |
| "Kitne customer" / "कितने ग्राहक हैं" | Total customer count | ✅ Yes |
| "Customer list" / "ग्राहक विवरण" | All customer names and balances | ✅ Yes |
| "Ramesh ka balance" / "रमेश का बैलेंस" | Specific customer balance & latest entry | ✅ Yes |
| "Balance batao" / "बैलेंस कितना बचा" | Total remaining balance | ✅ Yes |
| General Shop Query | Full shop summary fallback | ✅ Yes |

### Admin Voice Assistant
| Bol Sakte Ho (Devanagari / Roman / English) | Jawab Milega |
|---------------------------------------------|--------------|
| "Total shops kitne" / "कुल दुकानें कितनी हैं" | Total, active, inactive shop count |
| "MRR batao" / "एमआरआर कितना है" | Monthly Recurring Revenue |
| "Aaj ki entries" / "आज की एंट्रियां" | Today's voice entries count |
| "Voice parse safalta" / "पार्स सफलता" | Parse success % |
| "Paid shops count" / "पेड दुकानें कितनी" | Paid vs free count + conversion % |
| General Platform Query / Full Report | Full platform overview summary report |

---

## 📜 License

MIT License — Created for Bharat's Kirana Dukaandaars.

**Made with ❤️ — BolKhata: Bas Boliye, Hisaab Ho Jayega.**
