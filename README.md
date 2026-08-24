# BolKhata — Voice-First Udhaar Tracker for Bharat

> **Bas boliye, hisaab ho jayega.** Kirana dukaandaron ke liye Hinglish/Hindi/English voice se udhaar track karo — type karne ki zaroorat nahi.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688)]()
[![React](https://img.shields.io/badge/React-18-61DAFB)]()
[![Vite](https://img.shields.io/badge/Vite-5-646CFF)]()
[![Postgres](https://img.shields.io/badge/Postgres-ready-336791)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

Two panels, one database, production-ready:

```
bolkhata/
├── backend/   FastAPI + SQLAlchemy + Postgres/SQLite + JWT + Razorpay + Whisper + AI
└── frontend/  React + Vite + Tailwind — Landing + Dukaandaar (Hindi) + Admin (English)
```

---

## ✨ Features — 100% Configurable from Admin

| Area | How it works | Free vs Paid |
|------|--------------|--------------|
| **Voice (STT)** | Browser **Web Speech API** (free, no key, Chrome) tries first → fallback to **OpenAI Whisper** (`whisper-1`) or custom endpoint | Browser = free, Whisper ≈ $0.006/min |
| **AI Parsing** | **Generic OpenAI-compatible** — Groq (cheap/fast), OpenAI, OpenRouter, Anthropic Claude, Ollama local, or Custom. Set `Base URL + Key + Model` in Admin → Test | `local` = rule-based Hinglish parser (no key), paid = 95% accuracy |
| **Auth (OTP)** | `dev` → `1234` always (free) | `MSG91 / Twilio / Custom` → real SMS via `Base URL + Key + Template` |
| **WhatsApp** | `wa.me` link (free) — button opens WhatsApp pre-filled, shopkeeper taps Send | `Twilio / Interakt / Custom` → auto-send via API |
| **Billing** | Razorpay Orders + signature verify + webhook | Mock mode without keys (no charge), live with keys |
| **Shops** | Active/Inactive toggle + permanent delete (global popup, theme-aware) | Admin controls |
| **Reset** | **Demo-safe** — deletes user shops only, keeps `9876543210` + `9998887771-74` + Settings |  |

All toggles live in **Admin → Settings** (`Admin English`): Business Rules, Razorpay, AI, STT, WhatsApp, OTP, Danger Zone — **Save → instant** across app. No `.env` edit needed. Every key shows `****` after save, `Test →` verifies in-app.

---

## 🧱 Tech Stack

**Backend:** `FastAPI 0.111` · `SQLAlchemy 2` · `Pydantic 2` · `python-jose JWT` · `psycopg2-binary` · `requests/httpx` · `openai/anthropic` (optional)
**Frontend:** `React 18` · `Vite 5` · `Tailwind 3` · `react-router-dom 6` · `Manrope / Yatra One / IBM Plex Mono / Kalam`
**DB:** `SQLite` (dev, `backend/bolkhata.db`) ↔ `Postgres` (prod via `DATABASE_URL=postgresql+psycopg2://...`)
**Design:** CSS vars `var(--gold), --surface, --ink, --line)` — `html.light / html.dark` — grain, shimmer, 3D `floatBook / orbBreathe / pulseRing`, page `cinematicIn`, toast right-bottom.

---

## 📂 Project Structure

```
backend/
  app/
    main.py              # lifespan, CORS, seed_demo_data (5 shops)
    config.py            # env + fallback
    database.py          # SQLite check_same_thread / Postgres pooling
    models.py            # Shop, Customer, Entry, Reminder, Subscription, PlatformSettings (is_active, ai_provider, stt_provider, whatsapp_provider, otp_provider ...)
    schemas.py           # Pydantic v2
    security.py          # JWT, in-memory OTP + rate-limit (3/10min, 5 attempts)
    routers/
      auth.py            # /api/auth/otp/send, /verify, /admin/login, /me
      customers.py       # CRUD + wa.me link + auto-send
      entries.py         # POST /api/entries (limit check, Saade handling, atomic balance) + GET /today
      billing.py         # /billing, /create-order, /verify, /webhook
      admin.py           # /admin/overview, /shops, /shops/{id}/status, DELETE, /subscriptions, /logs
      shop.py            # PUT /api/shop
      settings.py        # GET/PUT /api/admin/settings + /test/{ai,stt,whatsapp,otp,razorpay} + /reset
      voice.py           # /voice/transcribe, /parse, /transcribe-and-parse
    services/
      settings_service.py # singleton id=1, env fallback, mask_secret
      parse_service.py    # Hindi numbers (paanch sau=500, saade chaar sau=450), to→John, generic_ai_parse
      voice_service.py    # Whisper via base_url
      razorpay_service.py # order, verify_signature
      whatsapp_service.py # wa.me + Twilio/Interakt/custom
      otp_service.py      # dev / msg91 / twilio / custom
frontend/
  src/
    App.jsx              # Theme > Toast > Auth > ShopData > Routes + PageLoader 180ms + ScrollToTop + 404
    components/ Logo.jsx (header=favicon=loader same SVG), GlobalPopup.jsx (theme, danger/primary), PageLoader.jsx (logo only, 3D), AILoader.jsx (cinematic), Button.jsx, Badge.jsx, Sidebar.jsx, Topbar.jsx, ProtectedRoute.jsx, ...
    context/ AuthContext.jsx, ShopDataContext.jsx (refreshAll), ThemeContext.jsx (localStorage), ToastContext.jsx (right-6 bottom-6 Hindi)
    pages/ Landing.jsx (responsive hero, mobile nav), LoginGateway.jsx, DukaandaarLogin.jsx, AdminLogin.jsx, Onboarding.jsx, user/Home.jsx, NewEntry.jsx (Browser Speech → MediaRecorder → Whisper), CustomerList.jsx (cards+table), CustomerDetail.jsx, Billing.jsx, Profile.jsx, admin/Overview.jsx, Shops.jsx (Active/Inactive/Delete + popup), ShopDetail.jsx, Subscriptions.jsx, Logs.jsx, Settings.jsx (w-full, Simple/Advanced, 1 Save top)
    lib/ api.js, format.js
  public/favicon.svg     # same as header Logo
  index.html             # <link rel="icon" href="/favicon.svg">
```

---

## 🚀 Quick Start

**1. Backend — Terminal 1**
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit JWT_SECRET, ADMIN_EMAIL, DATABASE_URL if needed
uvicorn app.main:app --reload --port 8000
# → creates backend/bolkhata.db + 5 demo shops
# → PlatformSettings id=1 auto-created
```

**2. Frontend — Terminal 2**
```bash
cd frontend
cp .env.example .env   # VITE_API_BASE=http://localhost:8000/api
npm install
npm run dev            # http://localhost:5173
```

---

## 🔑 Demo Credentials

| Role | Login | OTP / Password |
|------|-------|---------------|
| **Dukaandaar (demo, pre-filled)** | `9876543210` → Login tab | `1234` (dev mode) — 4 customers, 6 entries |
| **Dukaandaar (new)** | Any 10-digit → Nayi Dukaan | `1234` → shop name/owner → empty dashboard |
| **Admin** | `admin@bolkhata.in` | `admin123` — Overview/Shops/Settings/Logs live |

Demo phones kept safe on **Reset**: `9876543210`, `9998887771-74` are never deleted.

---

## ⚙️ Admin → Settings — What you can configure

* **Business:** `free_entries_limit` (15), `paid_price_inr` (99), `paid_entries_limit` (-1=unlimited), `default_language`, `jwt_expire`, `wa_template`, `auto_reminder`, `maintenance`
* **Razorpay:** `razorpay_key_id/secret/webhook_secret/test_mode` — Test creates ₹1 order
* **AI:** `ai_provider` (local/groq/openai/openrouter/anthropic/ollama/custom) + `ai_base_url/api_key/model` — Test via `chat/completions`
* **STT:** `stt_provider` (browser=free Web Speech / openai / custom) + `stt_base_url/api_key/model` — Browser needs no key
* **WhatsApp:** `whatsapp_provider` (wa_me=free link / twilio/interakt/custom) + `base_url/api_key/phone_id`
* **OTP:** `otp_provider` (dev=1234 / msg91/twilio/custom) + `base_url/api_key/template_id` + `otp_expiry`
* **Danger:** `RESET` → deletes user shops only, demo + Settings remain

All masked `****` after save, `Test →` buttons verify in-app.

---

## 🔌 API (prefix `/api`)

* `POST /auth/otp/send` `{phone}` → `{dev_otp?}` (rate 3/10min)
* `POST /auth/otp/verify` `{phone,otp,is_register,shop_name}` → `{token,role}`
* `POST /auth/admin/login` `{email,password}` → `{token,role:admin}`
* `GET /auth/me` (Bearer) → shop or admin
* `GET /customers`, `POST /customers`, `GET/PUT/DELETE /customers/{id}`, `POST /customers/{id}/remind` → `{wa_link, auto_sent}`
* `POST /entries` `{customer_name,amount,type,raw_voice_text}` + `GET /entries/today` — inactive shops 403, `Saade` handled, `amount>0`, atomic `entries_used`
* `GET /billing`, `POST /billing/create-order`, `POST /billing/verify`, `POST /billing/webhook` (HMAC)
* `GET /admin/overview|/shops|/shops/{id}|/subscriptions|/logs` + `PUT /shops/{id}/status` + `DELETE /shops/{id}`
* `GET/PUT /admin/settings` + `POST /test/{ai,stt,whatsapp,otp,razorpay,claude}` + `POST /reset`
* `POST /voice/transcribe` (multipart `file,language`) + `POST /voice/parse` `{text,language}` + `POST /voice/transcribe-and-parse` — browser vs Whisper

---

## 🌗 UI/UX

* **Global:** Logo = favicon = loader (rounded square gold mic), `PageLoader` logo-only 3D (`floatBook` 110px), `AILoader` cinematic 12 waves, `GlobalPopup` theme-aware (gold/danger), `Toast` right-6 bottom-6 Hindi with `✓/!`
* **Responsive:** Every page `w-full` `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` `p-4 sm:p-6` `text-[24px] sm:text-[28px]` + mobile cards (`md:hidden`) + tables (`hidden md:block overflow-x-auto`) + bottom nav `lg:hidden`
* **Language:** **Admin** pure English, **Dukaandaar** Hinglish/Hindi (`Namaste, Kul udhaar, Naya Entry Bolein`) — `default_language` controls hint
* **Theme:** `var(--gold/surface/ink/line)` + `html.light` toggle `localStorage`, grain `.035`, scrollbar `ink-dim`

---

## 🐘 Postgres

```bash
# .env
DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/bolkhata
# or
DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/bolkhata?sslmode=require
```

`database.py` auto pooling `pool_pre_ping, size 5`. Migrations in `main.py:_migrate_sqlite` add `period_start, is_active, razorpay_order_id, ai_provider...` if missing. No `alembic` needed for demo; production add `alembic` if you want.

---

## 🚢 Deployment

* **Backend:** Render / Railway / Fly.io — set `DATABASE_URL` (Postgres), `JWT_SECRET` (long random), `FRONTEND_ORIGIN` (your Vercel URL), `ADMIN_EMAIL/PASSWORD`
* **Frontend:** Vercel / Netlify — set `VITE_API_BASE=https://your-backend/api` → `npm run build` (`dist/` → `favicon.svg` included)
* **Webhooks:** Razorpay Dashboard → `https://your-backend/api/billing/webhook` + set `razorpay_webhook_secret` in Settings

---

## 🔒 Going to Production — Checklist

1. Change `JWT_SECRET` to 32+ random chars
2. Create real `admins` table (hashed) or keep env but strong password
3. Set real SMS provider (`otp_provider=msg91`, Base URL, Key) — stop leaking `dev_otp`
4. Set real AI/STT if you want cloud (Groq cheap, or keep `local`/`browser` free)
5. Set `whatsapp_provider` if you want auto-send (else `wa.me` free)
6. Add `OPENAI_API_KEY` / `RAZORPAY_KEY` via Settings (not `.env`) + Test
7. `DATABASE_URL` → Postgres

---

## 📜 License

MIT — for Bharat ke dukaandaron ke liye.

**Made with ❤️ — BolKhata, Bas Boliye, Hisaab Ho Jayega.**
