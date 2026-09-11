import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion'
import { Mic, Clock, Shield, Languages, ArrowRight, Check, Sparkles, Coins, BarChart3, Save, Zap } from 'lucide-react'
import Logo from '../components/Logo'
import Button from '../components/Button'
import ThemeToggle from '../components/ThemeToggle'
import LangToggle from '../components/LangToggle'
import { useLang } from '../context/LangContext'
import { api } from '../lib/api'

function TiltCard({ children, className }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rX = useTransform(y, [-0.5, 0.5], [9, -9])
  const rY = useTransform(x, [-0.5, 0.5], [-9, 9])
  const handle = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - r.left) / r.width - 0.5)
    y.set((e.clientY - r.top) / r.height - 0.5)
  }
  const reset = () => { x.set(0); y.set(0) }
  return (
    <motion.div style={{ rotateX: rX, rotateY: rY, transformPerspective: 1000 }} onMouseMove={handle} onMouseLeave={reset} className={className} >
      {children}
    </motion.div>
  )
}

function HeroMock() {
  const { t } = useLang()
  return (
    <div className="relative lg:h-[440px] flex items-center justify-center">
      <motion.div
        animate={{ y: [0, -12, 0], rotateY: [0, 8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full bg-amber-400/20 blur-[90px]"
      />
      <TiltCard className="relative z-10">
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="relative w-[300px] sm:w-[360px] bg-white dark:bg-slate-900 rounded-[28px] shadow-deep border border-slate-200/70 dark:border-slate-700/60 p-6"
          style={{ transformStyle: 'preserve-3d', boxShadow: '0 30px 60px -15px rgba(15,23,42,0.35)' }}
        >
          <div className="absolute -inset-[1px] rounded-[29px] bg-gradient-to-br from-amber-400/40 via-transparent to-slate-900/10 dark:to-amber-500/20 -z-0" />
          <div style={{ transform: 'translateZ(30px)' }} className="relative">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">{t('land_demo_today')}</span>
              <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />{t('land_demo_online')}</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-xs font-bold text-amber-400">RK</div><div><div className="text-sm font-semibold">Ramesh Kumar</div><div className="text-xs text-slate-500">{t('land_demo_udhaar')}</div></div></div>
                <span className="font-mono text-sm font-bold text-amber-600">₹500</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-xs font-bold text-white">SD</div><div><div className="text-sm font-semibold">Sunita Devi</div><div className="text-xs text-amber-700 dark:text-amber-400">{t('land_demo_wapas')}</div></div></div>
                <span className="font-mono text-sm font-bold text-amber-600">₹450</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 opacity-60">
                <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold">MT</div><div><div className="text-sm font-semibold">Manoj</div><div className="text-xs text-slate-500">{t('land_demo_udhaar')}</div></div></div>
                <span className="font-mono text-sm font-bold">₹200</span>
              </div>
            </div>
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ transform: 'translateZ(50px)' }}
            className="absolute -top-4 -right-4 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-500/40 rounded-2xl shadow-medium px-3 py-2 flex items-center gap-2"
          >
            <span className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center"><motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }}><Mic size={14} className="text-amber-400" /></motion.span></span>
            <span className="text-xs font-semibold">{t('land_demo_listening')}</span>
          </motion.div>
        </motion.div>
      </TiltCard>
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} style={{ transform: 'translateZ(40px)' }} className="hidden sm:flex absolute top-4 right-2 lg:top-8 lg:right-8 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3.5 py-2 shadow-soft text-xs font-semibold items-center gap-2">
        <Clock size={13} className="text-amber-600" /> {t('land_8sec')}
      </motion.div>
      <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 3.4, repeat: Infinity, delay: 0.4 }} className="hidden sm:flex absolute bottom-8 left-2 lg:bottom-12 lg:left-6 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3.5 py-2 shadow-soft text-xs font-semibold items-center gap-2">
        <Languages size={13} className="text-amber-600" /> {t('land_hinglish_auto')}
      </motion.div>
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1.2 }} className="hidden sm:flex absolute top-6 left-6 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-soft text-xs font-semibold items-center gap-2">
        <Shield size={13} className="text-amber-600" /> Secure
      </motion.div>
    </div>
  )
}

function Step({ icon: Icon, title, text, idx }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotateX: 40 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay: idx * 0.1, duration: 0.55, ease: [0.16,1,0.3,1] }}
      className="relative text-center group"
    >
      <div className="absolute inset-0 m-auto w-24 h-24 rounded-3xl bg-amber-400/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-amber-400 border border-amber-500/25 flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
        <Icon size={24} />
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center shadow-medium">{idx + 1}</span>
      </div>
      <h3 className="font-semibold text-[16px] mb-1.5 text-slate-900 dark:text-white">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-[240px] mx-auto">{text}</p>
    </motion.div>
  )
}

export default function Landing() {
  const [mobileNav, setMobileNav] = useState(false)
  const [planMap, setPlanMap] = useState({ free: { price: 0 }, standard: { price: 49 }, paid: { price: 99 } })
  const { lang, t } = useLang()
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.12], [0, -40])

  useEffect(() => {
    api.getPlans().then(d => {
      if (d?.plans?.length) {
        const m = {}
        d.plans.forEach(p => { m[p.id] = p })
        setPlanMap(m)
      }
    }).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-white overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0F172A]/75 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
          <Logo size={28} />
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#kaam" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">{t('land_nav_how')}</a>
            <a href="#pricing" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">{t('land_nav_pricing')}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
            <Link to="/login/dukaandaar" className="hidden lg:inline-flex"><Button variant="ghost">{t('login')}</Button></Link>
            <Link to="/login/dukaandaar"><Button>{t('landing_cta_dukaandaar')} <ArrowRight size={14} /></Button></Link>
            <button onClick={() => setMobileNav(o=>!o)} className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
          </div>
        </div>
        {mobileNav && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3">
            <a href="#kaam" onClick={()=>setMobileNav(false)} className="block py-2 text-sm font-medium">{t('land_nav_how')}</a>
            <a href="#pricing" onClick={()=>setMobileNav(false)} className="block py-2 text-sm font-medium">{t('land_nav_pricing')}</a>
            <Link to="/login/dukaandaar" onClick={()=>setMobileNav(false)}><Button variant="secondary" className="w-full justify-center">{t('login')}</Button></Link>
          </motion.div>
        )}
      </header>

      <section className="relative overflow-hidden">
        <motion.div style={{ y: heroY }} className="pointer-events-none absolute inset-0">
          <motion.div animate={{ x: [0, 50, 0], y: [0, 30, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} className="absolute -top-32 -left-24 w-[480px] h-[480px] rounded-full bg-amber-400/15 dark:bg-amber-500/10 blur-[110px]" />
          <motion.div animate={{ x: [0, -40, 0], y: [0, -25, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-1/3 -right-32 w-[420px] h-[420px] rounded-full bg-slate-900/10 dark:bg-white/10 blur-[110px]" />
          <motion.div animate={{ x: [0, 30, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }} className="absolute bottom-0 left-1/3 w-[340px] h-[340px] rounded-full bg-amber-400/10 blur-[100px]" />
        </motion.div>
        <div className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(15,23,42,0.12) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24 grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}>
            <div className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-xs font-semibold text-amber-700 dark:text-amber-400 mb-5 overflow-hidden">
              <Sparkles size={12} /> {t('landing_badge')}
            </div>
            <h1 className="text-[34px] sm:text-[44px] lg:text-[54px] font-bold tracking-tight leading-[1.04] text-slate-900 dark:text-white">
              {t('landing_title1')}<br />
              <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text text-transparent">{t('landing_title2')}</span>
            </h1>
            <p className="mt-4 text-[16px] sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-[520px]">
              {t('landing_desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link to="/login/dukaandaar" className="w-full sm:w-auto"><Button size="lg" className="w-full justify-center"><Mic size={16} /> {t('landing_cta_dukaandaar')}</Button></Link>
            </div>
            <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
              <motion.div whileHover={{ y: -3 }} className="text-left">
                <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1"><Zap size={16} />&lt;10 sec</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('land_stat_entries')}</div>
              </motion.div>
              <motion.div whileHover={{ y: -3 }} className="text-left">
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-1"><Mic size={16} />0 typing</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('land_stat_voice')}</div>
              </motion.div>
              <motion.div whileHover={{ y: -3 }} className="text-left">
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-1"><Languages size={16} />हिंदी+</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('land_stat_hinglish')}</div>
              </motion.div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7, ease: [0.16,1,0.3,1] }}>
            <HeroMock />
          </motion.div>
        </div>

        <div className="relative flex justify-center gap-3 pb-6">
          {[0,1,2].map(i => <motion.span key={i} animate={{ y: [0, -12, 0], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25 }} className="w-1.5 h-1.5 rounded-full bg-amber-500" />)}
        </div>
      </section>

      <section className="relative py-16 sm:py-24 bg-white dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-800/60 overflow-hidden" id="kaam">
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[360px] bg-amber-400/10 blur-[110px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-xs font-semibold tracking-widest uppercase text-amber-600 dark:text-amber-400 mb-2">{t('land_steps_badge')}</motion.div>
            <motion.h2 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }} className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">{t('landing_how')}</motion.h2>
            <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="mt-3 text-slate-600 dark:text-slate-400">{t('landing_how_sub')}</motion.p>
          </div>
          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
            <motion.div
              animate={{ left: ['8%', '92%', '8%'] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
              className="hidden lg:block absolute top-[30px] -mt-[3px] ml-0 w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.9)]"
              style={{ left: '8%' }}
            />
            <Step icon={Mic} idx={0} title={t('step1_t')} text={t('step1_d')} />
            <Step icon={Save} idx={1} title={t('step2_t')} text={t('step2_d')} />
            <Step icon={Coins} idx={2} title={t('step3_t')} text={t('step3_d')} />
            <Step icon={BarChart3} idx={3} title={t('step4_t')} text={t('step4_d')} />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-slate-50 dark:bg-[#0F172A] relative overflow-hidden" id="pricing">
        <div className="pointer-events-none absolute -top-24 right-0 w-[420px] h-[420px] bg-amber-400/10 blur-[120px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <div className="text-xs font-semibold tracking-widest uppercase text-amber-600 dark:text-amber-400 mb-2">{t('land_pricing_badge')}</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">{t('pricing_title')}</h2>
          </div>
          {(() => {
              const allPlans = [
                {
                  id: 'free', name: 'Free', note: 'price_note', cta: 'price_cta_free',
                  defaultFeaturesHi: ["हर महीने 100 एंट्री तक", "मैन्युअल व वॉइस उधार एंट्री", "ग्राहक व बाकी की बही", "व्हाट्सऐप payment रिमाइंडर (wa.me)"],
                  defaultFeaturesEn: ["100 entries every month", "Manual & voice udhaar entry", "Customers & baaki ledger", "WhatsApp payment reminders (wa.me)"]
                },
                {
                  id: 'standard', name: 'Standard', note: 'price_note', tag: 'price_tag_starter', cta: 'price_cta_std',
                  defaultFeaturesHi: ["Free के सब कुछ, plus:", "हर महीने 500 एंट्री", "अनलिमिटेड ग्राहक व पुरानी बही", "बही व एंट्री का CSV निर्यात (export)", "शेड्यूल्ड auto WhatsApp रिमाइंडर"],
                  defaultFeaturesEn: ["Everything in Free, plus:", "500 entries every month", "Unlimited customers & old ledger", "CSV export of ledger & entries", "Scheduled auto WhatsApp reminders"]
                },
                {
                  id: 'paid', name: 'Paid', note: 'price_note', tag: 'price_tag_popular', cta: 'price_cta_paid',
                  defaultFeaturesHi: ["Standard के सब कुछ, plus:", "अनलिमिटेड एंट्री", "रिमाइंडर में UPI payment लिंक", "Priority सपोर्ट", "आने वाले Pro फीचर का access"],
                  defaultFeaturesEn: ["Everything in Standard, plus:", "Unlimited entries", "UPI payment links in reminders", "Priority support", "Access to upcoming pro features"]
                },
              ]
              const plans = allPlans.filter(p => (planMap[p.id] ?? p).active !== false)
              const gridCols = plans.length <= 1 ? 'md:grid-cols-1' : plans.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
              return (
              <div className={`grid ${gridCols} gap-6 lg:gap-8 max-w-5xl mx-auto`}>
                {plans.map((p,i) => {
                  const live = planMap[p.id]
                  const price = live?.price ?? (p.id==='free'?0:p.id==='standard'?49:99)
                  const features = (lang === 'hi' ? (live?.features_hi || live?.features) : (live?.features_en || live?.features)) ||
                    (lang === 'hi' ? p.defaultFeaturesHi : p.defaultFeaturesEn) || []
                  return (
                  <TiltCard key={i} className="h-full">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i*0.08 }} whileHover={{ y: -6 }} className={`relative h-full rounded-3xl border p-6 sm:p-7 flex flex-col bg-white dark:bg-slate-900 ${live?.highlight ? 'border-amber-500/70 shadow-[0_25px_60px_-18px_rgba(245,158,11,0.45)] ring-1 ring-amber-500' : 'border-slate-200 dark:border-slate-700 shadow-soft'}`}>
                      {live?.highlight && <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-amber-500/30 via-transparent to-amber-500/10 -z-0 pointer-events-none" />}
                      {(live?.tag || p.tag) && <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold shadow-medium">{t(live?.tag || p.tag)}</div>}
                      <div className="text-xs font-semibold tracking-widest uppercase text-slate-500 dark:text-slate-400">{live?.name || p.name}</div>
                      <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">₹{price}<span className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-0.5">{t(p.note)}</span></div>
                      <ul className="mt-6 space-y-2.5 flex-1">
                        {features.map((f,j)=> <li key={j} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300"><span className="mt-0.5 w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0"><Check size={13} className="text-amber-600 dark:text-amber-400" /></span>{f}</li>)}
                      </ul>
                      <Link to="/login/dukaandaar" className="block mt-7"><Button variant={live?.highlight ? 'primary' : 'secondary'} className="w-full justify-center">{t(p.cta)}</Button></Link>
                    </motion.div>
                  </TiltCard>
                  )
                })}
              </div>
              )
            })()}
        </div>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Logo size={22} />
          <span className="text-sm text-slate-500 dark:text-slate-400">{t('land_footer')}</span>
        </div>
      </footer>
    </div>
  )
}