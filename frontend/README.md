# BolKhata — Frontend (React + Vite + Tailwind PWA)

Voice-first udhaar (credit) tracker for Indian shopkeepers.

This is the frontend documentation. See the root `README.md` for full project overview and backend integration.

## Run locally
```bash
cp .env.example .env
npm install
npm run dev
```
Open `http://localhost:5173`

## Production Build
```bash
npm run build
```
Outputs static bundle to `dist/` ready for Vercel/Netlify/PWA deployment.

## Key Features & UI Components
- **Siri/Google Style AI Voice Orb**: Interactive voice floating widget with soundwave aura animations (`VoiceCommand.jsx` & `AdminVoiceCommand.jsx`).
- **Icon-Only Guidance**: Sleek `HelpCircle` icon button with "Question kaise poochhen" guidance card.
- **Language Sync**: Portal language toggle syncs interface text and TTS speech language (`en` vs `hi`).
- **Offline PWA**: Full ServiceWorker PWA support (`sw.js`) with IndexedDB local storage (`offline.js`) and background sync queue (`sync.js`).

## Structure
- `/` — Landing page
- `/login` — Choose Dukaandaar or Admin gateway
- `/login/dukaandaar` — Phone + OTP login, or "Nayi Dukaan" registration
- `/login/admin` — Email + password login with eye-toggle secret inputs
- `/onboarding` — First-time shop setup
- `/app/*` — Merchant panel (Home, New Entry, Customers, Ledger, Billing, Profile, Cash Counter) — protected, role "user"
- `/admin/*` — Admin panel (Overview, Shops, Dynamic Plans, Payments, Logs, Settings) — protected, role "admin"

## Design System
- Fonts: Yatra One (display/headings), Manrope (body), IBM Plex Mono (data/currency)
- Colors: Dark "night bazaar" theme with light "ledger paper" mode toggle
- Custom CSS & Tailwind utilities in `src/index.css` & `tailwind.config.js`
