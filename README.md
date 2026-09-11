# BolKhata — Voice-First Udhaar & Khata Tracker for Bharat 🇮🇳

> **Bas boliye, hisaab ho jayega.** Kirana dukaandaron ke liye Hinglish/Hindi/English voice se udhaar track karo — type karne ki zaroorat nahi. **100% Offline-ready PWA**, Dynamic Plans System, Automated Reminders & Razorpay Payments.

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
- 🗣️ **Native Voice Commands & Responses**: Bol ke pucho — *"Total kitna hua"*, *"Kitne user hain"*, *"User ka detail"*, *"Balance batao"*. Device/Browser's native TTS (`hi-IN` Hindi & `en-IN` English) audio feedback — 100% free, 100% offline, zero server load.
- 📲 **100% Offline-First PWA**: Full ServiceWorker PWA support (`sw.js`). **Frontend works WITHOUT backend.** Data stored in IndexedDB automatically. Background sync queue syncs pending entries when connectivity returns.
- 💰 **Voice Query System (Offline+Online)**: Offline mein bhi Total, Customer count, Details, Balance pooch sakte ho. Online pe backend se accurate data milta hai.
- 👑 **Dynamic Admin Plans Management**: Centrally manage Free, Standard (Pro), and Paid tiers from Admin (`/admin/plans`). Configure price, entry limits (-1 for unlimited), featured badges, and Hindi/English feature lists in real-time.
- 💳 **Razorpay & Mock Payment Gateway**: Complete subscription checkout integration with Razorpay Webhook signatures and zero-charge Mock Mode for testing.
- ⏰ **Scheduled Auto-Reminders & UPI Pay Links**: Background scheduler for weekly WhatsApp & SMS reminders. Automatically generates `upi://pay?pa=...` links pre-filled with customer balance.
- 📊 **Cash Counter & Daily Reconciliation**: End-of-day denomination counter with expected cash variance calculations and 7-day history.
- 📑 **CSV Ledger Export**: Standard and Paid tier gated CSV exports.
- 🔐 **Hidden Admin Access & Eye Password Toggles**: Admin login accessible only via `/admin` or `/bolkhata`. Includes reusable `SecretInput` eye-toggle components.
- 🛡️ **Primary Key Data Protection**: Email and Phone numbers are immutable primary keys across user and admin profiles.
- 🎨 **Modern Full-Width Responsive Design**: Clean dark/light mode toggle, custom iOS-style toggle rows, and 100% language key parity (628 keys Hindi/English).

---

## 🧱 Tech Stack

### Frontend
- **Framework**: `React 18` + `Vite 5` (PWA with `vite-plugin-pwa` / Workbox)
- **Offline Storage**: IndexedDB (`offline.js`) + Background Sync Queue (`sync.js`)
- **Service Worker**: Auto-registered PWA with NetworkFirst caching
- **TTS**: Native Web Speech API (`window.speechSynthesis`) — 100% offline Hindi (`hi-IN`) & English (`en-IN`) voice output with zero server footprint.
- **STT**: Browser Web Speech API + `@xenova/transformers` local Whisper Tiny
- **Styling**: Vanilla CSS + Tailwind utilities, HSL CSS variables
- **Icons & Motion**: `lucide-react`, `framer-motion`
- **Localization**: Custom `LangContext` — complete Hindi/English dictionary parity (628 keys)

### Backend
- **Framework**: `FastAPI 0.111.0`
- **Database**: `SQLAlchemy 2.0` (SQLite for local dev, PostgreSQL for production)
- **Security & Auth**: `python-jose` (JWT), Passlib/PBKDF2 password hashing, rate-limited OTP
- **Payments**: Razorpay SDK & HMAC Webhook verification
- **Scheduler**: Background threading worker for automated weekly reminders
- **Exports**: Native streaming CSV export module
- **Voice Query**: `/api/voice/query` endpoint — processes text queries with shop_id data isolation

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
│   │   │   ├── query.py         # Voice query endpoint — shop_id isolated
│   │   │   ├── tts.py           # TTS Router — XTTS v2 voice clone (speak/status/clone/toggle/test)
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
│   │   │   ├── VoiceCommand.jsx # 🎤 Voice Command + Cloned-voice TTS (offline+online)
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
└── README.md                    # This file
```

---

## 🔄 How Offline + Online Works (100% Functional)

### Architecture

```
┌──────────────────────────────────────────────────┐
│           FRONTEND (React + Vite PWA)           │
│                                                   │
│  ┌──────────┐    ┌──────────────────┐            │
│  │  Browser  │───▶│ Service Worker   │            │
│  │  (React)  │    │ (NetworkFirst)   │            │
│  └────┬─────┘    └────────┬─────────┘            │
│       │                   │                       │
│  Online│            Offline│                       │
│       ▼                   ▼                       │
│  ┌──────────┐    ┌──────────────────┐            │
│  │  Backend  │    │  IndexedDB       │            │
│  │  (API)    │    │  (Local Storage) │            │
│  └──────────┘    └────────┬─────────┘            │
│                           │                       │
│                    ┌──────▼──────┐                │
│                    │ Sync Queue  │                │
│                    │ (pending    │                │
│                    │  operations)│                │
│                    └─────────────┘                │
│                           │                       │
│                    Network returns               │
│                           ▼                       │
│                    Auto-Sync ✅                  │
│                                                   │
│  ┌───────────────────────────────────┐           │
│  │  TTS (Text-to-Speech)             │           │
│  │  XTTS v2 cloned voice (Backend)   │           │
│  │  Admin ki awaz — 100% offline!     │           │
│  └───────────────────────────────────┘           │
└──────────────────────────────────────────────────┘
```

### Online Mode
1. All operations go through the API → Backend → Response
2. Voice commands use backend `/api/voice/query` for accurate data
3. Service Worker caches API responses for fast loading
4. Background sync keeps queue empty

### Offline Mode
1. **GET requests**: Load from IndexedDB, no network needed
2. **POST/PUT/DELETE**: Queued in IndexedDB sync queue, auto-sync when online
3. **Voice Commands**: Processed locally from IndexedDB data — Total, Customer count, Details, Balance all work offline!
4. **TTS**: Works 100% offline using the backend XTTS v2 cloned voice (admin ki awaaz) — zero API dependency after clone
5. **STT**: Works offline using local Whisper Tiny model
6. **Session**: Auth tokens persist in localStorage, profile restored from cache
7. **Service Worker**: Serves cached pages, app loads instantly

### Voice Command Flow
```
Shopkeeper speaks → STT (Browser Web Speech) → Text → Offline? → Local Data Processing → TTS (XTTS v2 cloned voice) → Answer spoken aloud
                                              → Online? → Backend /api/voice/query → TTS (XTTS v2 cloned voice) → Answer spoken aloud
```

**Data Isolation**: Every backend query filters by `shop.id` from JWT token. Shopkeeper can ONLY hear about their own shop's data. Zero data leaking.

---

## ⚡ Quick Start Guide

### Option A: FULLY OFFLINE — No Backend Needed! 🆓

The frontend works **completely standalone** without any backend. All data is stored in the browser's IndexedDB.

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

# Run FastAPI backend server (Auto port fallback & Windows socket fix)
python run_backend.py
# Or using uvicorn directly:
# uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
> Server starts at `http://127.0.0.1:8000`. Note: Binding to `127.0.0.1` prevents Windows socket permission error `[WinError 10013]`.

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```
> Frontend opens at `http://localhost:5173`.

### Option C: Deploy for FREE (Cloud) ☁️

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for complete step-by-step guide.

---

## 🔑 Demo Access & Login Credentials

| Role | Access URL | Credentials | Demo Data |
|------|------------|-------------|-----------|
| **Dukaandaar (Merchant)** | `http://localhost:5173/login` | Phone: `9876543210` → OTP: `1234` | Pre-loaded with 4 customers & entries |
| **New Merchant** | `http://localhost:5173/login` | Any 10-digit phone → OTP: `1234` | Creates brand new shop account |
| **Admin Panel** | `http://localhost:5173/admin` | Email: `admin@bolkhata.in`<br>Password: `admin123` | Full administrative control |

---

## ⚙️ Admin Control & Platform Configuration

Access `/admin/settings`, `/admin/plans`, `/admin/payments`, and `/admin/configuration` to configure:

1. **Dynamic Plans (`/admin/plans`)**: Custom pricing, entry limits, tags, and Hindi/English feature bullets
2. **Payment Gateway (`/admin/payments`)**: Razorpay Key ID, Secret, Webhook Secret, Test Mode toggle
3. **AI & Speech Providers (`/admin/configuration`)**: OpenAI, Groq, OpenRouter, Anthropic, Ollama, or Local Hinglish parser
4. **Automated Reminders & WhatsApp (`/admin/settings`)**: Reminder day, time, message templates, WhatsApp settings
5. **Danger Zone (`/admin/settings`)**: Safe database reset (preserves demo accounts)

---

## 📡 API Overview (Prefix `/api`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/otp/send` | `POST` | Send OTP to merchant phone |
| `/auth/otp/verify` | `POST` | Verify OTP & issue JWT token |
| `/auth/admin/login` | `POST` | Admin login authentication |
| `/customers` | `GET / POST` | List or create shop customers |
| `/customers/{id}` | `GET / PUT / DELETE` | Customer ledger details |
| `/entries` | `POST / GET` | Add voice/manual entry |
| `/cash/today` | `GET / POST` | Get or save cash denominations |
| `/billing/create-order` | `POST` | Create Razorpay order |
| `/export/csv` | `GET` | Export shop ledger to CSV |
| `/admin/plans` | `GET / PUT` | Manage plan tiers |
| `/admin/shops` | `GET / PUT / DELETE` | Manage shops |
| `/api/voice/query` | `POST` | Voice query endpoint (answers spoken via XTTS v2) |
| `/api/tts/speak` | `POST` | Public — speak text with admin's cloned voice (WAV) |
| `/api/tts/status` | `GET` | Admin — TTS clone/active status |
| `/api/tts/clone` | `POST` | Admin — upload voice sample (multipart) |
| `/api/tts/toggle` | `PUT` | Admin — activate/deactivate cloned voice |
| `/api/tts/test` | `POST` | Admin — test cloned voice (returns WAV) |
| `/api/health` | `GET` | Backend health check |

---

## 🗣️ Voice Command Reference

The shopkeeper can say or tap these commands:

| Command (Hinglish/Hindi/English) | What happens | Offline? |
|----------------------------------|-------------|----------|
| "Total kitna hua" | Total earnings and customer balance | ✅ Yes |
| "Kitne user hain" | Customer count | ✅ Yes |
| "User ka detail" | All customer names and balances | ✅ Yes |
| "Balance batao" | Total balance across all customers | ✅ Yes |
| "Entry count" | Total number of transactions | ✅ Yes |
| "Hello" / "Hi" / "Namaste" | Greeting with help menu | ✅ Yes |
| "Help" | Shows available commands | ✅ Yes |
| Any other query | Sent to backend for accurate answer | Online only |

**All queries are automatically filtered by shop_id** — shopkeeper only hears about their own shop's data.

### Admin Voice Assistant (Quick Ask — koi bhi sawaal)
Admin panel ka mic button kisi bhi 4 button tak limited nahi hai — speech se **koi bhi sawaal poochho** aur pura platform data milega:

| Bol Sakte Ho | Jawab milega |
|---|---|
| "Total kitne shops hain" | Total / Active / Inactive dukaanein |
| "MRR batao" | Monthly recurring revenue |
| "Aaj ki entries" | Aaj ki voice entries count |
| "Voice parse safalta" | Parse success % |
| "Kitne paid dukaanein" | Paid vs Free count + conversion % |
| "Overview full batao" | Full platform summary (sab kuch ek saath) |
| Kuch bhi aur | Poora data summary (fallback) |

Quick Ask widget ke button (Full Report, Shops, MRR, Entries, Paid, Parse %) sirf examples hain — mic dabakar kuch bhi bolo, sab jawab milega.

---

## 🚢 Production Deployment

### Backend Deployment (Railway / Render / AWS)
- Set `DATABASE_URL` to production PostgreSQL
- Set `JWT_SECRET` to a strong random key
- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD`
- Command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

### Frontend Deployment (Vercel / Netlify)
- Set `VITE_API_BASE=https://your-backend-api.com/api`
- Command: `npm run build` (outputs to `dist/`)

> **Full guide with FREE hosting step-by-step: See [DEPLOYMENT.md](DEPLOYMENT.md)**

---

## 📜 License

MIT License — Created for Bharat's Kirana Dukaandaars.

**Made with ❤️ — BolKhata: Bas Boliye, Hisaab Ho Jayega.**
