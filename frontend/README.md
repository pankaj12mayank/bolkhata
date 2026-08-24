# BolKhata — Frontend (React + Vite + Tailwind)

Voice-first udhaar (credit) tracker for Indian shopkeepers.

This is the frontend only. See the root `README.md` for running it together with the backend.

## Run locally (needs the backend running on :8000)
```
cp .env.example .env
npm install
npm run dev
```
Open http://localhost:5173

## Structure
- `/` — Landing page
- `/login` — choose Dukaandaar or Admin
- `/login/dukaandaar` — phone + OTP login, or "Nayi Dukaan" register flow
- `/login/admin` — email + password login
- `/onboarding` — first-time shop setup (new Dukaandaar only)
- `/app/*` — Dukaandaar panel (Home, Naya Entry, Grahak List/Detail, Billing, Profile) — protected, role "user"
- `/admin/*` — Admin panel (Overview, Shops/Shop Detail, Subscriptions, Logs, Settings) — protected, role "admin"

## Design system
All colors, fonts, spacing are defined once in `src/index.css` (CSS variables) and `tailwind.config.js`
(fontFamily + keyframes), so both panels and the landing page share one source of truth.

- Fonts: Yatra One (display/headings), Manrope (body), IBM Plex Mono (numbers/data), Kalam (voice transcript)
- Colors: gold/maroon/green accents on a dark "night bazaar" theme, with a light "ledger paper" theme — toggle top-right
- Logo: `src/components/Logo.jsx` — reusable, used in header, sidebar, auth screens

## Data
`src/lib/api.js` is the only place that talks to the backend. `AuthContext` and `ShopDataContext` call it
and expose simple functions (`addCustomer`, `addOrUpdateEntry`, etc.) to the pages — no page talks to
`fetch` directly. Auth token is stored in `localStorage` under `bolkhata_token`.
