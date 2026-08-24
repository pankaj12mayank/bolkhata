import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

function RoleCard({ to, title, desc, icon, ghost }) {
  return (
    <Link to={to} className="block">
      <div className="bg-surface border border-line rounded-3xl p-9 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-deep hover:border-[var(--gold)]" style={{ transformStyle: 'preserve-3d' }}>
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center bg-[rgba(232,169,59,.14)] text-gold">
          {icon}
        </div>
        <h2 className="font-display font-normal text-2xl mb-2">{title}</h2>
        <p className="text-ink-dim text-sm leading-relaxed mb-5 min-h-[44px]">{desc}</p>
        <span className={`inline-flex w-full items-center justify-center rounded-full font-bold text-[13.5px] px-5 py-2.5 ${ghost ? 'border-[1.5px] border-line text-ink' : 'text-[#1A1206]'}`}
          style={!ghost ? { background: 'linear-gradient(135deg,var(--gold),var(--gold-deep))' } : {}}>
          {title} Login →
        </span>
      </div>
    </Link>
  )
}

export default function LoginGateway() {
  return (
    <div className="min-h-screen bg-app text-ink flex items-center justify-center px-5 py-8 relative">
      <div className="grain" />
      <div className="absolute top-8 left-1/2 -translate-x-1/2"><Logo /></div>
      <div className="max-w-[840px] w-full text-center">
        <div className="font-mono text-xs tracking-[2.5px] uppercase text-maroon mb-3.5 font-semibold">Kaise Login Karna Chahte Hain?</div>
        <h1 className="font-display font-normal text-3xl md:text-4xl mb-11">Apna Panel Chunein</h1>
        <div className="grid sm:grid-cols-2 gap-5">
          <RoleCard
            to="/login/dukaandaar"
            title="Dukaandaar"
            desc="Apni dukaan ka udhaar khata boliye aur turant likhwaein."
            icon={<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" /><path d="M6 11v1a6 6 0 0 0 12 0v-1M12 18v3" /></svg>}
          />
          <RoleCard
            to="/login/admin"
            title="Admin"
            ghost
            desc="Poore BolKhata platform ki shops, billing aur health manage karein."
            icon={<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2L10 21h4l.5-2.6c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z" /></svg>}
          />
        </div>
      </div>
    </div>
  )
}
