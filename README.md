# BolKhata — Voice-First Udhaar & Khata Tracker for Bharat 🇮🇳

> **Bas boliye, hisaab ho jayega.** Kirana dukaandaron ke liye Hinglish/Hindi/English voice se udhaar track karo — type karne ki zaroorat nahi. 100% Offline-ready PWA, Dynamic Plans System, Automated Reminders & Razorpay Payments.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688)]()
[![React](https://img.shields.io/badge/React-18-61DAFB)]()
[![Vite](https://img.shields.io/badge/Vite-5-646CFF)]()
[![PWA](https://img.shields.io/badge/PWA-Ready-4A90E2)]()
[![Postgres](https://img.shields.io/badge/Postgres-ready-336791)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

---

## 🚀 Key Highlights & Available System Features

- 🎙️ **Voice-First AI Udhaar Entry**: Speech-to-Text recognition via **Browser Web Speech API** (Free/Offline), **In-Browser Local Whisper Tiny** (Offline PWA), or **OpenAI Whisper API**. Automatically extracts Customer Name, Amount, Type (`credit_given` / `payment_received`), and Hinglish numbers (*"Ramesh ko paanch sau udhaar diya"* → ₹500).
- 📲 **100% Offline PWA & Queue Sync**: Full ServiceWorker PWA support (`sw.js`). Includes offline local voice parsing, offline customer ledger, and an IndexedDB action queue that automatically syncs pending entries when connectivity returns.
- 👑 **Dynamic Admin Plans Management**: Centrally manage Free, Standard (Pro), and Paid tiers from Admin (`/admin/plans`). Configure price, entry limits (-1 for unlimited), featured badges, and Hindi/English feature lists in real-time.
- 💳 **Razorpay & Mock Payment Gateway**: Complete subscription checkout integration with Razorpay Webhook signatures (`payment.captured` & `payment.failed`) and zero-charge Mock Mode for testing.
- ⏰ **Scheduled Auto-Reminders & UPI Pay Links**: Background scheduler for weekly WhatsApp & SMS reminders. Automatically generates `upi://pay?pa=...` links pre-filled with customer balance.
- 📊 **Cash Counter & Daily Reconciliation**: End-of-day denomination counter (₹2000, ₹500, ₹200, ₹100, ₹50, ₹20, ₹10, ₹5, ₹2, ₹1) with expected cash variance calculations and 7-day history.
- 📑 **CSV Ledger Export**: Standard and Paid tier gated CSV exports for complete customer transaction histories and shop records.
- 🔐 **Hidden Admin Access & Eye Password Toggles**: Admin login is completely hidden from public UI landing pages (accessible only via `/admin` or `/bolkhata`). Includes reusable `SecretInput` eye-toggle components across all API keys, secrets, and password fields.
- 🛡️ **Primary Key Data Protection**: Email and Phone numbers are strictly protected as immutable primary keys across user and admin profiles.
- 🎨 **Modern Full-Width Responsive Design**: Clean 100% full-width stacked card design, high-contrast dark/light mode toggle, custom iOS-style toggle rows, and 100% language key parity across Hindi and English (628 keys).

---

## 🧱 Tech Stack

### Backend
- **Framework**: `FastAPI 0.111.0`
- **Database**: `SQLAlchemy 2.0` (SQLite for local dev `backend/bolkhata.db`, PostgreSQL for production)
- **Security & Auth**: `python-jose` (JWT authentication), Passlib/PBKDF2 password hashing, rate-limited OTP handler
- **Payments**: Razorpay SDK & HMAC Webhook verification
- **Scheduler**: Background threading worker for automated weekly reminders
- **Exports**: Native streaming CSV export module

### Frontend
- **Framework**: `React 18` + `Vite 5` (PWA with `vite-plugin-pwa` / Workbox)
- **Styling**: Vanilla CSS + Tailwind utilities, HSL CSS variables, custom glassmorphism & grain overlays
- **Icons & Motion**: `lucide-react`, `framer-motion`
- **Offline ML & STT**: `@xenova/transformers` (In-browser local Whisper model) + Web Speech API fallback + IndexedDB storage
- **Localization**: Custom `LangContext` with complete Hindi (`hi`) and English (`en`) dictionary parity (628 keys)

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
│   │   │   ├── auth.py          # OTP login, Admin login (/admin/login), Profile endpoints
│   │   │   ├── customers.py     # Customer CRUD, WhatsApp link generator & reminders
│   │   │   ├── entries.py       # Voice/Manual entry creation & daily transaction logs
│   │   │   ├── billing.py       # Order creation, Razorpay checkout & webhook handler
│   │   │   ├── admin.py         # Admin dashboard analytics, Shops, Subscriptions, Plans, Logs
│   │   │   ├── settings.py      # Platform configuration settings, Test endpoints & Reset
│   │   │   ├── voice.py         # Voice transcription & AI Hinglish parser routes
│   │   │   └── export.py        # CSV data export for shop ledgers
│   │   └── services/
│   │       ├── parse_service.py # Hinglish number parsing (paanch sau → 500, saade chaar sau → 450)
│   │       ├── voice_service.py # Whisper API integration
│   │       ├── razorpay_service.py # Razorpay order creation & signature validation
│   │       ├── remind_service.py # Automated reminder builder with UPI pay link generator
│   │       └── reminder_job.py # Background scheduler worker for scheduled reminders
│   ├── bolkhata.db             # Local SQLite database
│   ├── requirements.txt        # Python backend dependencies
│   └── .env.example            # Environment template
│
└── frontend/
    ├── src/
    │   ├── App.jsx              # Main router & application providers
    │   ├── components/          # Reusable UI components (Button, Badge, SecretInput, Sidebar, Logo, etc.)
    │   ├── context/             # AuthContext, ShopDataContext, LangContext, ThemeContext, ToastContext
    │   ├── lib/                 # API client (api.js), Offline IndexedDB queue (offline.js), Local STT (stt.js)
    │   └── pages/
    │       ├── Landing.jsx          # Public marketing page
    │       ├── DukaandaarLogin.jsx  # Merchant OTP login & registration
    │       ├── AdminLogin.jsx      # Secret Admin login (/admin or /bolkhata)
    │       ├── user/                # Merchant portal (Home, NewEntry, CustomerList, CustomerDetail, CashCounter, Billing, Profile)
    │       └── admin/               # Admin panel (Overview, Shops, ShopDetail, Subscriptions, Plans, Payments, Settings, Logs, Configuration, AdminProfile)
    ├── check-lang.js            # Translation key parity verification script
    ├── vite.config.js           # Vite & PWA ServiceWorker configuration
    └── package.json             # Frontend dependencies
```

---

## ⚡ Quick Start Guide

### 1. Backend Setup (Terminal 1)
```bash
cd backend

# Create & activate virtual environment
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Run FastAPI backend server
uvicorn app.main:app --reload --port 8000
```
> Server starts at `http://localhost:8000`. Auto-initializes SQLite database with demo shops and platform settings.

### 2. Frontend Setup (Terminal 2)
```bash
cd frontend

# Install dependencies
npm install

# Run Vite development server
npm run dev
```
> Frontend application opens at `http://localhost:5173`.

---

## 🔑 Demo Access & Login Credentials

| Role | Access URL | Credentials | Demo Data |
|------|------------|-------------|-----------|
| **Dukaandaar (Merchant)** | `http://localhost:5173/login` | Phone: `9876543210` → OTP: `1234` | Pre-loaded with 4 customers & entries |
| **New Merchant** | `http://localhost:5173/login` | Any 10-digit phone → OTP: `1234` | Creates brand new shop account |
| **Admin Panel** | `http://localhost:5173/admin` | Email: `admin@bolkhata.in`<br>Password: `admin123` | Full administrative control & analytics |

---

## ⚙️ Admin Control & Platform Configuration

Access `/admin/settings`, `/admin/plans`, `/admin/payments`, and `/admin/configuration` to configure:
1. **Dynamic Plans (`/admin/plans`)**: Custom pricing, entry limits (-1 for unlimited), tags, and Hindi/English feature bullets.
2. **Payment Gateway (`/admin/payments`)**: Razorpay Key ID, Secret, Webhook Secret, and Test Mode toggle.
3. **AI & Speech Providers (`/admin/configuration`)**: OpenAI, Groq, OpenRouter, Anthropic, Ollama, or Local Hinglish parser setup with in-app test buttons.
4. **Automated Reminders & WhatsApp (`/admin/settings`)**: Reminder day, time, message templates, and automated WhatsApp settings.
5. **Danger Zone (`/admin/settings`)**: Safe database reset (preserves demo accounts `9876543210`, `9998887771-74` and platform settings).

---

## 📡 API Overview (Prefix `/api`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/otp/send` | `POST` | Send OTP to merchant phone (rate-limited) |
| `/auth/otp/verify` | `POST` | Verify OTP & issue JWT token |
| `/auth/admin/login` | `POST` | Admin login authentication |
| `/customers` | `GET / POST` | List or create shop customers |
| `/customers/{id}` | `GET / PUT / DELETE` | Customer ledger details & management |
| `/customers/{id}/remind` | `POST` | Generate WhatsApp reminder & UPI link |
| `/entries` | `POST / GET` | Add voice/manual entry (atomic balance update) |
| `/cash/today` | `GET / POST` | Get or save end-of-day cash denominations |
| `/billing/create-order` | `POST` | Create Razorpay subscription order |
| `/billing/verify` | `POST` | Verify Razorpay payment signature |
| `/export/csv` | `GET` | Export shop ledger transactions to CSV |
| `/admin/plans` | `GET / PUT` | Manage dynamic plan tiers & limits |
| `/admin/shops` | `GET / PUT / DELETE` | Manage merchant shop status & accounts |

---

## 🚢 Production Deployment

1. **Backend Deployment (Render / Railway / AWS)**:
   - Set `DATABASE_URL` to production PostgreSQL (`postgresql+psycopg2://...`).
   - Set `JWT_SECRET` to a strong random key.
   - Set `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
   - Command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

2. **Frontend Deployment (Vercel / Netlify)**:
   - Set `VITE_API_BASE=https://your-backend-api.com/api`.
   - Command: `npm run build` (outputs optimized production bundle to `dist/`).

---

## 📜 License

MIT License — Created for Bharat's Kirana Dukaandaars.

**Made with ❤️ — BolKhata: Bas Boliye, Hisaab Ho Jayega.**
