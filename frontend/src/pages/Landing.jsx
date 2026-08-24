import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Logo from '../components/Logo'
import Button from '../components/Button'
import ThemeToggle from '../components/ThemeToggle'

function Step({ num, title, text }) {
  return (
    <div className="text-center px-4">
      <div className="w-[68px] h-[68px] mx-auto mb-5 rounded-full bg-surface border border-line flex items-center justify-center font-mono text-xl font-semibold shadow-soft transition-transform duration-300 hover:-translate-y-1.5">
        {num}
      </div>
      <h3 className="font-bold text-[17px] mb-2">{title}</h3>
      <p className="text-ink-dim text-[14.5px] leading-relaxed">{text}</p>
    </div>
  )
}

function PriceCard({ tag, name, price, features, featured }) {
  return (
    <div className={`relative overflow-hidden bg-surface border rounded-3xl p-6 sm:p-9 transition-transform duration-300 hover:-translate-y-1 ${featured ? 'border-[var(--gold)] shadow-soft' : 'border-line'}`}>
      {tag && (
        <div className="absolute top-[18px] -right-8 rotate-45 bg-[var(--gold)] text-[#1A1206] text-[10px] font-extrabold px-8 py-1 tracking-wide">
          {tag}
        </div>
      )}
      <div className="font-mono text-[12px] sm:text-[13px] uppercase tracking-widest text-ink-dim">{name}</div>
      <div className="font-display text-[36px] sm:text-[44px] mt-3 mb-1 break-words">
        {price}<span className="text-[14px] sm:text-base font-body font-semibold text-ink-dim"> / mahina</span>
      </div>
      <ul className="my-5 sm:my-6 flex flex-col gap-2.5 sm:gap-3">
        {features.map((f, i) => (
          <li key={i} className="flex gap-2.5 text-[13.5px] sm:text-[14.5px] text-ink-dim items-start">
            <span className="text-green font-extrabold flex-shrink-0 mt-0.5">✓</span><span className="leading-snug">{f}</span>
          </li>
        ))}
      </ul>
      <Link to="/login/dukaandaar">
        <Button variant={featured ? 'primary' : 'ghost'} className="w-full justify-center">{featured ? 'Upgrade Karein' : 'Free Shuru Karein'}</Button>
      </Link>
    </div>
  )
}

export default function Landing() {
  const [mobileNav, setMobileNav] = useState(false)

  return (
    <div className="min-h-screen bg-app text-ink overflow-x-hidden">
      <div className="grain" />

      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-line" style={{ background: 'color-mix(in srgb, var(--bg) 82%, transparent)' }}>
        <div className="max-w-[1180px] mx-auto flex items-center justify-between px-4 sm:px-7 py-3.5 sm:py-4">
          <Logo />
          <nav className="hidden md:flex gap-8 text-[15px] font-semibold text-ink-dim">
            <a href="#kaam" className="hover:text-ink transition-colors">Kaise Kaam Karta Hai</a>
            <a href="#pricing" className="hover:text-ink transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3.5">
            <ThemeToggle />
            <Link to="/login" className="hidden sm:inline-flex"><Button>Login Karein</Button></Link>
            <button onClick={() => setMobileNav(o => !o)} className="md:hidden w-9 h-9 rounded-full bg-surface border border-line flex items-center justify-center text-ink" aria-label="Menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
          </div>
        </div>
        {mobileNav && (
          <div className="md:hidden border-t border-line bg-surface px-4 py-4 flex flex-col gap-3">
            <a href="#kaam" onClick={() => setMobileNav(false)} className="py-2 font-semibold text-ink-dim">Kaise Kaam Karta Hai</a>
            <a href="#pricing" onClick={() => setMobileNav(false)} className="py-2 font-semibold text-ink-dim">Pricing</a>
            <Link to="/login" onClick={() => setMobileNav(false)}><Button className="w-full justify-center">Login Karein</Button></Link>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative pt-10 sm:pt-24 pb-10 sm:pb-16 overflow-hidden" style={{ perspective: '1400px' }}>
        <div className="max-w-[1180px] mx-auto px-4 sm:px-7 grid lg:grid-cols-2 gap-8 sm:gap-10 items-center">
          <div className="min-w-0">
            <div className="font-mono text-[11px] sm:text-[12.5px] tracking-[2px] sm:tracking-[3px] uppercase text-maroon flex items-center gap-2.5 mb-4 sm:mb-5 font-semibold">
              <span className="w-6 h-px bg-maroon hidden sm:block" />Voice-First Udhaar Tracker
            </div>
            <h1 className="font-display font-normal text-[32px] sm:text-[42px] lg:text-[64px] leading-[1.08] break-words">
              Aapki Awaaz,<br />Aapka <span className="text-gold">Khata</span>.
            </h1>
            <p className="mt-4 sm:mt-6 text-[15px] sm:text-lg leading-relaxed text-ink-dim max-w-[480px]">
              Type karne ki zaroorat nahi. Bas mic dabaiye, boliye — "Ramesh ko paanch sau udhaar diya" — aur BolKhata baaki sab sambhal lega.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-7 sm:mt-9">
              <Link to="/login/dukaandaar" className="w-full sm:w-auto"><Button className="w-full sm:w-auto justify-center">🎙 Dukaandaar Shuru Karein</Button></Link>
              <Link to="/login/admin" className="w-full sm:w-auto"><Button variant="ghost" className="w-full sm:w-auto justify-center">Admin Login</Button></Link>
            </div>
            <div className="grid grid-cols-3 gap-4 sm:flex sm:gap-7 flex-wrap mt-8 sm:mt-11">
              <div className="font-mono text-[11px] sm:text-[13px] text-ink-dim"><b className="block font-body text-[18px] sm:text-[22px] text-ink font-extrabold">&lt;10 sec</b>Ek entry ka time</div>
              <div className="font-mono text-[11px] sm:text-[13px] text-ink-dim"><b className="block font-body text-[18px] sm:text-[22px] text-ink font-extrabold">0</b>Typing zaroori</div>
              <div className="font-mono text-[11px] sm:text-[13px] text-ink-dim"><b className="block font-body text-[18px] sm:text-[22px] text-ink font-extrabold">हिंदी+हिंग्लिश</b>Dono samajhta hai</div>
            </div>
          </div>

          <div className="relative h-[320px] sm:h-[420px] flex items-center justify-center overflow-hidden sm:overflow-visible px-4" style={{ transformStyle: 'preserve-3d' }}>
            <div className="absolute w-[200px] sm:w-[260px] h-[260px] sm:h-[320px] rounded-2xl bg-surface shadow-deep animate-floatBook" style={{ transformStyle: 'preserve-3d' }}>
              <div className="absolute left-0 top-3.5 bottom-3.5 w-1.5 rounded" style={{ background: 'linear-gradient(var(--maroon),var(--gold-deep))' }} />
              {[60, 90, 120, 150, 180, 210, 240].map(top => (
                <div key={top} className="absolute left-7 right-5 h-px bg-line hidden sm:block" style={{ top }} />
              ))}
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="absolute w-[130px] sm:w-[170px] h-[130px] sm:h-[170px] rounded-full border border-[var(--gold)] opacity-0 animate-pulseRing left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: `${(i - 1)}s` }} />
            ))}
            <div className="absolute w-[100px] h-[100px] sm:w-[124px] sm:h-[124px] rounded-full flex items-center justify-center animate-orbBreathe z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ background: 'radial-gradient(circle at 35% 30%, var(--gold), var(--gold-deep) 70%)', boxShadow: '0 20px 50px -14px rgba(232,169,59,.55)' }}>
              <svg viewBox="0 0 24 24" fill="none" width="36" height="36" className="sm:w-[42px] sm:h-[42px]">
                <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" fill="#1A1206" />
                <path d="M6 11v1a6 6 0 0 0 12 0v-1M12 18v3" stroke="#1A1206" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="absolute top-2 sm:top-4 right-2 sm:right-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-surface border border-line font-mono text-[11px] sm:text-[13px] shadow-soft flex items-center gap-2 max-w-[150px] sm:max-w-none truncate">
              <span className="w-2 h-2 rounded-full bg-maroon flex-shrink-0" />Ramesh · ₹500 udhaar
            </div>
            <div className="absolute bottom-6 sm:bottom-10 left-2 sm:-left-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-surface border border-line font-mono text-[11px] sm:text-[13px] shadow-soft flex items-center gap-2 max-w-[150px] sm:max-w-none truncate">
              <span className="w-2 h-2 rounded-full bg-green flex-shrink-0" />Sunita · ₹200 mila
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 sm:py-24" id="kaam">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-7">
          <div className="max-w-[640px] mx-auto text-center mb-10 sm:mb-14">
            <div className="font-mono text-[11px] sm:text-xs tracking-[2.5px] uppercase text-maroon mb-3 font-semibold">Chaar Aasaan Kadam</div>
            <h2 className="font-display font-normal text-[26px] sm:text-[32px] md:text-[42px]">Ye kaam kaise karta hai</h2>
            <p className="mt-3 text-ink-dim text-[15px] sm:text-[16.5px] px-2 sm:px-0">Dukaan par khada-khada, ek saans mein poora hisaab likh dein.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-9">
            <Step num="01" title="Bolo" text="Mic dabaiye aur naturally boliye, jaise grahak se baat kar rahe ho." />
            <Step num="02" title="Suno" text="BolKhata turant naam, amount aur type samajh leta hai." />
            <Step num="03" title="Confirm Karo" text="Ek card dikhega — sahi lage to ek tap mein confirm kar dijiye." />
            <Step num="04" title="Ho Gaya" text="Grahak ka balance apne aap update, register mein kuch likhna nahi." />
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-16 sm:py-24" id="pricing">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-7">
          <div className="max-w-[640px] mx-auto text-center mb-10 sm:mb-14">
            <div className="font-mono text-[11px] sm:text-xs tracking-[2.5px] uppercase text-maroon mb-3 font-semibold">Simple Pricing</div>
            <h2 className="font-display font-normal text-[26px] sm:text-[32px] md:text-[42px]">Jab zaroorat badhe, tab upgrade karein</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-[820px] mx-auto">
            <PriceCard name="Free" price="₹0" features={['15 voice entries / mahina', 'Grahak list aur balance', 'Manual WhatsApp reminder', 'Unlimited grahak']} />
            <PriceCard name="Paid" price="₹99" tag="Popular" featured features={['Unlimited voice entries', 'Grahak list aur balance', 'Manual WhatsApp reminder', 'Priority Hindi/Hinglish accuracy']} />
          </div>
        </div>
      </section>

      <footer className="border-t border-line py-8 sm:py-10">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-7 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <Logo size={24} />
          <span className="text-ink-dim text-[13px] sm:text-sm">Bharat ke dukaandaron ke liye, awaaz se banaya khata.</span>
        </div>
      </footer>
    </div>
  )
}
