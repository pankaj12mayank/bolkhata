# BolKhata — Deployment Guide (Free to Paid 🚀)

> Step-by-step guide to deploy BolKhata on any platform. **Fully functional offline + online.** Starts from **FREE**, scales to **PAID** with zero code changes.

---

## 📋 Table of Contents

1. [Architecture Overview](#-architecture-overview)
2. [Offline + Online Capabilities](#-offline--online-capabilities)
3. [Prerequisites](#-prerequisites)
4. [Option A: FREE Deployment (Railway)](#-option-a-free-deployment)
5. [Option B: FREE Deployment (Render + Vercel)](#-option-b-free-deployment)
6. [Option C: Local Setup](#-option-c-local-setup)
7. [Paid Deployment (Production)](#-paid-deployment-production)
8. [Domain & SSL Setup](#-domain--ssl-setup)
9. [Troubleshooting](#-troubleshooting)

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite PWA)        │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  Browser  │→ │Service   │→ │  IndexedDB (Local) │  │
│  │  (React)  │  │Worker    │  │  (Offline Storage) │  │
│  │           │  │(PWA)     │  │                    │  │
│  │           │  │          │  │  ┌──────────────┐  │  │
│  │           │  │          │  │  │ Sync Queue   │  │  │
│  │           │  │          │  │  │ (Offline     │  │  │
│  │           │  │          │  │  │  Operations) │  │  │
│  │           │  │          │  │  └──────────────┘  │  │
│  │           │  │          │  │                    │  │
│  │           │  │          │  │  ┌──────────────┐  │  │
│  │           │  │          │  │  │ Voice Query  │  │  │
│  │           │  │          │  │  │ (Offline)    │  │  │
│  │           │  │          │  │  │ (Online)     │  │  │
│  │           │  │          │  │  └──────────────┘  │  │
│  │           │  │          │  │                    │  │
│  │           │  │          │  │  ┌──────────────┐  │  │
│  │           │  │          │  │  │ TTS (Text-   │  │  │
│  │           │  │          │  │  │  to-Speech)  │  │  │
│  │           │  │          │  │  │ Native Web   │  │  │
│  │           │  │          │  │  │ (Browser)    │  │  │
│  │           │  │          │  │  └──────────────┘  │  │
│  └─────┬─────┘  └─────┬────┘  └───────────────────┘  │
│        │              │                               │
│        │    Online    │         Offline               │
│        ▼              ▼                               │
│  ┌────────────────────────────┐                       │
│  │      BACKEND (FastAPI)     │                       │
│  │  ┌──────────────────────┐  │                       │
│  │  │ SQLite (Local)       │  │                       │
│  │  │ PostgreSQL (Prod)    │  │                       │
│  │  └──────────────────────┘  │                       │
│  └────────────────────────────┘                       │
└──────────────────────────────────────────────────────┘
```

---

## 🔄 Offline + Online Capabilities

| Feature | Offline | Online |
|---------|---------|--------|
| **Voice Entry** (STT) | ✅ Local Whisper Tiny | ✅ Browser Web Speech + Server Whisper |
| **Voice Command** (TTS) | ✅ XTTS v2 cloned voice | ✅ Backend Query + XTTS v2 |
| **Voice Query** | ✅ Local data processing | ✅ Backend `/api/voice/query` |
| **Customer CRUD** | ✅ IndexedDB + Queue | ✅ Backend API |
| **Entry Creation** | ✅ IndexedDB + Queue | ✅ Backend API |
| **Session/Auth** | ✅ localStorage persist | ✅ JWT + Backend |
| **Dashboard** | ✅ Cached from IndexedDB | ✅ Real-time from backend |
| **PWA Install** | ✅ Works offline | ✅ Works online |
| **Service Worker** | ✅ Cached pages | ✅ NetworkFirst caching |
| **Auto-Sync** | ✅ Queued in IndexedDB | ✅ Auto-sync on connect |
| **TTS Responses** | ✅ XTTS v2 cloned voice (offline) | ✅ XTTS v2 cloned voice |

**Data Isolation**: All queries are filtered by `shop_id` from JWT. No data leaking between shops.

---

## 📋 Prerequisites

### For Backend
- Python 3.10+
- pip (Python package manager)
- Git
- ~2GB disk + ~3GB RAM for XTTS v2 TTS model (see TTS section below)
- GPU (optional) — ~10x faster TTS, see TTS section below

### For Frontend
- Node.js 18+
- npm (comes with Node.js)
- Git

### Check Your Environment
```bash
# Check Python
python --version  # Should show: Python 3.10+

# Check pip
pip --version

# Check Node.js
node --version  # Should show: v18.0.0+

# Check npm
npm --version
```

---

## 🗣️ XTTS v2 TTS — CPU vs GPU Guidance

BolKhata TTS **Coqui XTTS v2** model use karta hai — admin ka cloned voice, backend pe running. Model size ~1.9GB, first-time download hota hai.

### CPU (default)
- Model load: ~100s (first request after restart)
- Sentence synthesis: ~30–45s per short sentence
- RAM: ~3GB required
- **Use for**: Vercel free / Railway / Render / local dev / small user base
- No extra setup needed — `TTS==0.22.0` + `torch` CPU automatically

### GPU (fast, ~10x improvement)
- Model load: ~5–8s (first request)
- Sentence synthesis: ~2–4s per short sentence
- RAM: ~3GB VRAM needed (NVIDIA)
- **Use for**: Production with many users, responsive voice experience
- Steps (for a GPU VPS, e.g. RunPod, AWS G5, Lambda):
  1. Install CUDA:
  ```bash
  # Ubuntu/Debian
  sudo apt install -y nvidia-cuda-toolkit
  # Verify
  nvidia-smi
  ```
  2. Reinstall torch with CUDA support:
  ```bash
  pip uninstall torch -y
  pip install torch --index-url https://download.pytorch.org/whl/cu121 --no-cache-dir
  ```
  3. Restart backend — `gpu=False` in `_get_model()` auto-detects CUDA:
  ```python
  # Change line in backend/app/routers/tts.py:
  _tts_model = _TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=True)
  ```
  4. Backend will use GPU automatically on first TTS request

### First-Time Model Download
- XTTS v2 model (~1.9GB) downloads to `~/.local/share/tts/` on first clone or first speak
- First-time download + CPML license consent required — server will prompt for `y` confirmation
- After download, subsequent restarts skip download
- On Railway/Render free tier: storage wipes on redeploy → model re-downloads each time (add ~30s to cold start)

### CPU vs GPU Quick Comparison
| Metric | CPU (default) | GPU (NVIDIA) |
|--------|---------------|--------------|
| Model load | ~100s | ~5–8s |
| Synthesis/sentence | ~30–45s | ~2–4s |
| RAM needed | ~3GB | ~3GB VRAM |
| Free tier? | Yes | No (GPU VPS ~$0.50/hr) |
| Recommended for | <50 users | 50+ users |

---

## 🆓 Option A: FREE Deployment (Railway)

### Step 1: Fork the Repository
```bash
git clone https://github.com/YOUR_USERNAME/bolkhata.git
cd bolkhata
```

### Step 2: Backend on Railway (FREE $5/month credit)

1. **Go to [Railway.app](https://railway.app)** and sign up with GitHub
2. **Click "New Project" → "Deploy from GitHub Repo"**
3. **Select the `bolkhata` repository**
4. **Select the `backend` directory** as the deploy root
5. Railway auto-detects Python — reads `requirements.txt`
6. **Set Environment Variables**:
   ```
   DATABASE_URL=postgresql://autogenerated-url
   JWT_SECRET=your-random-secret-key-here
   FRONTEND_ORIGIN=https://your-frontend-url.vercel.app
   ADMIN_EMAIL=admin@bolkhata.in
   ADMIN_PASSWORD=your-secure-password
   DEV_OTP=1234
   ```
7. **Deploy!** Backend URL: `https://your-project-name.up.railway.app`

### Step 3: Frontend on Vercel (FREE)

1. **Go to [Vercel.com](https://vercel.com)** and sign up with GitHub
2. **Click "Add New Project"**
3. **Import the `bolkhata` repository**
4. **Set root directory to `frontend`**
5. **Set Environment Variable**:
   ```
   VITE_API_BASE=https://your-railway-backend-url.up.railway.app/api
   ```
6. **Click "Deploy"**
7. Your frontend URL: `https://bolkhata.vercel.app`

### Step 4: Verify
```bash
# Check backend health
curl https://your-project-name.up.railway.app/api/health
# Should return: {"status":"ok","message":"BolKhata API chal rahi hai"}
```

---

## 🆓 Option B: FREE Deployment (Render + Vercel)

### Step 1: Backend on Render (FREE)

1. **Go to [Render.com](https://render.com)** and sign up with GitHub
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure**:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free
   - **Root Directory**: `backend`
5. **Set Environment Variables** (same as Railway section)
6. **Deploy!** (~5-10 min) → URL: `https://your-service-name.onrender.com`

### Step 2: Frontend on Vercel (FREE)
Same as **Step 3** in Option A, but set:
```
VITE_API_BASE=https://your-service-name.onrender.com/api
```

---

## 🖥️ Option C: Local Setup (No Cost)

### Step 1: Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
✅ Backend running at `http://localhost:8000`

### Step 2: Frontend
```bash
cd frontend
npm install
npm run dev
```
✅ Frontend running at `http://localhost:5173`

### Step 3: Build Production Frontend
```bash
cd frontend
npm run build
```
Output goes to `frontend/dist/` — ready for any static hosting.

---

## 💰 Paid Deployment (Production)

### Backend Upgrades

| Platform | Free → Paid | Cost | Benefit |
|----------|-------------|------|---------|
| **Railway** | Free → $5+/month | ~$5/mo | Persistent DB, more RAM |
| **Render** | Free → $7+/month | ~$7/mo | Private DB, auto-scaling |
| **AWS EC2** | $3.50+/month | ~$3.50/mo | Full control |
| **DigitalOcean** | $4+/month | ~$4/mo | Simple, reliable |

### Database Upgrade (SQLite → PostgreSQL)

In `.env`:
```env
# OLD (SQLite)
DATABASE_URL=sqlite:///./bolkhata.db

# NEW (PostgreSQL)
DATABASE_URL=postgresql+psycopg2://user:password@host:5432/bolkhata
```

### Frontend Upgrades

| Platform | Free → Paid | Cost | Benefit |
|----------|-------------|------|---------|
| **Vercel** | Free → Pro | $20/mo | Faster builds, analytics |
| **Netlify** | Free → Pro | $19/mo | Custom domains included |
| **Cloudflare Pages** | Free tier is generous | $0 | Global CDN |

---

## 🌐 Domain & SSL Setup

### Custom Domain (FREE on Vercel/Railway)

1. **Buy a domain** (₹100-500/year from Namecheap/GoDaddy)
2. **On Vercel/Railway Dashboard** → Add custom domain
3. **Update DNS records**:
   ```
   Type    Name          Value
   CNAME   www           your-app.vercel.app
   CNAME   @             your-app.vercel.app
   ```
4. **SSL is automatic!** Vercel/Railway provision free SSL certificates.

---

## 🔧 Environment Variables Checklist

- [ ] `DATABASE_URL` — PostgreSQL for production
- [ ] `JWT_SECRET` — Strong random string (`openssl rand -hex 32`)
- [ ] `ADMIN_EMAIL` — Your admin email
- [ ] `ADMIN_PASSWORD` — Strong admin password
- [ ] `FRONTEND_ORIGIN` — Frontend URL
- [ ] `DEV_OTP` — OTP for testing
- [ ] `VITE_API_BASE` — Frontend's backend API URL
- [ ] `OPENAI_API_KEY` — Only if using OpenAI Whisper
- [ ] `RAZORPAY_KEY_ID` — Only for payments
- [ ] `RAZORPAY_KEY_SECRET` — Only for payments

---

## 🐛 Troubleshooting

### Backend won't start
```bash
python --version  # Need 3.10+
pip list
python -c "from app.main import app; print('OK')"
```

### Frontend won't connect
```bash
echo $VITE_API_BASE  # Check frontend .env
```

### Service Worker not working
```bash
# Chrome: DevTools → Application → Service Workers → Unregister → Reload
```

### PWA not installing
```bash
# Ensure HTTPS, add manifest.webmanifest, service worker registered
```

### Voice Command not working
```bash
# Check backend /api/tts/status returns cloned: true, active: true
# Admin → Voice Clone — upload sample, clone, Test Voice, then Active
# First call is slow (~2 min) — XTTS v2 model loads on first request
# Check microphone permission: chrome://settings/content/microphone
```

### Offline mode issues
```bash
# Clear IndexedDB: DevTools → Application → IndexedDB → Clear
# Check network status: window.navigator.onLine
```

### Common Error Messages
| Error | Fix |
|-------|-----|
| `ModuleNotFoundError: No module named 'fastapi'` | `pip install -r requirements.txt` |
| `VITE_API_BASE is not defined` | Create `.env` in `frontend/` |
| `CORS error` | Update `FRONTEND_ORIGIN` in backend `.env` |
| `JWT expired` | Set `JWT_EXPIRE_MINUTES=10080` in `.env` |
| `TTS 503 - Voice clone active nahi hai` | Admin → Voice Clone → upload sample + activate |
| `Offline mode` | Check IndexedDB has data |

---

## 📊 Monitoring & Maintenance

### Free Monitoring Tools
- **UptimeRobot** — Free uptime monitoring (5 min intervals)
- **BetterStack** — Free status pages
- **Sentry** — Free error tracking (up to 5k errors/month)

### Regular Maintenance
1. **Weekly**: Check logs for errors
2. **Monthly**: Update dependencies (`pip install --upgrade -r requirements.txt`)
3. **Quarterly**: Backup database (especially PostgreSQL)
4. **Annually**: Renew domain and SSL certificates

---

## 🎯 Deployment Summary

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   FRONTEND   │────▶│   BACKEND    │────▶│   DATABASE   │
│   (Vercel)   │     │  (Railway)   │     │  (PostgreSQL)│
│   FREE       │     │  FREE $5/mo  │     │  Included    │
└──────────────┘     └──────────────┘     └──────────────┘
     │                    │                    │
     ▼                    ▼                    ▼
  Your App             API Calls            All Data
  runs anywhere        JSON responses       Persists
  works offline        Voice Query         IndexedDB
  works online         TTS Responses       Sync Queue
```

---

## 📜 License

MIT License — Created for Bharat's Kirana Dukaandaars.

**Made with ❤️ — BolKhata: Bas Boliye, Hisaab Ho Jayega.**
