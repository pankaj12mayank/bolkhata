import { motion } from 'framer-motion'

export function TopProgress({ loading }) {
  if (!loading) return null
  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[100] overflow-hidden pointer-events-none bg-transparent">
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        className="h-full w-1/3 bg-amber-500"
      />
    </div>
  )
}

function Cube3D() {
  const face = {
    position: 'absolute', inset: 0, borderRadius: 12,
    background: 'linear-gradient(135deg,#1E293B,#0F172A)',
    border: '1px solid rgba(245,158,11,0.35)',
    boxShadow: '0 0 18px rgba(245,158,11,0.15)',
  }
  return (
    <div style={{ perspective: 700 }}>
      <motion.div
        style={{ transformStyle: 'preserve-3d', position: 'relative', width: 52, height: 52 }}
        animate={{ rotateX: 360, rotateY: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      >
        {[0, 90, 180, 270].map(deg => (
          <div key={deg} style={{ ...face, transform: `rotateY(${deg}deg) translateZ(26px)` }} />
        ))}
        <div style={{ ...face, transform: 'rotateX(90deg) translateZ(26px)', background: 'linear-gradient(135deg,#F59E0B,#B45309)', border: 'none', boxShadow: '0 0 30px rgba(245,158,11,0.55)' }} />
        <div style={{ ...face, transform: 'rotateX(-90deg) translateZ(26px)' }} />
        <div style={{ position: 'absolute', inset: -6, borderRadius: 18, border: '1px solid rgba(245,158,11,0.2)', transform: 'translateZ(0)' }} />
      </motion.div>
    </div>
  )
}

function Grainies() {
  const particles = Array.from({ length: 9 }, (_, i) => ({
    left: 10 + ((i * 37) % 80),
    bottom: -6,
    delay: i * 0.35,
    size: 2 + (i % 3),
  }))
  return (
    <div style={{ perspective: 700 }} className="absolute inset-0">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-amber-500"
          style={{ left: `${p.left}%`, bottom: p.bottom, width: p.size * 2, height: p.size, opacity: 0 }}
          animate={{ y: [-10, -130], opacity: [0, 0.9, 0], scale: [0.6, 1.3, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

export function FullOverlay({ message = "Soch raha hai..." }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-hidden bg-white/80 dark:bg-[#0F172A]/85 backdrop-blur-2xl">
      <div className="absolute w-[420px] h-[420px] rounded-full bg-amber-500/10 dark:bg-amber-500/10 blur-3xl" />
      <div className="absolute w-[280px] h-[280px] rounded-full bg-slate-900/5 dark:bg-white/5 blur-3xl" />
      <div className="relative">
        <Grainies />
        <div className="relative w-[130px] h-[130px] flex items-center justify-center">
          <motion.div animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.15, 0.5] }} transition={{ duration: 2.2, repeat: Infinity }} className="absolute inset-0 rounded-full border border-amber-500/30" />
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 2.2, repeat: Infinity, delay: 0.5 }} className="absolute inset-3 rounded-full border border-amber-500/20" />
          {[0, 1].map(ring => (
            <motion.div
              key={ring}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 5 + ring * 2.5, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div style={{ transform: ring ? 'rotateX(70deg) rotateZ(30deg)' : 'rotateX(-65deg) rotateZ(-30deg)' }} className="relative h-16 w-[118px]">
                <div style={{ transform: `translateZ(26px)` }} className="absolute left-1/2 top-1/2 -ml-[4px] -mt-[4px] w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.9)]" />
              </div>
            </motion.div>
          ))}
          <Cube3D />
          <div className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 0 40px rgba(245,158,11,0.08)' }} />
        </div>
      </div>
      <p className="relative mt-7 text-sm font-semibold tracking-wide text-slate-600 dark:text-slate-300 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        {message}
      </p>
      <div className="relative flex gap-1 mt-4 items-end h-4">
        {[0,1,2,3,4].map(i=> <motion.span key={i} animate={{ scaleY: [0.4,1,0.4] }} transition={{ duration: 0.6, repeat: Infinity, delay: i*0.08 }} className="w-1 rounded-full bg-gradient-to-t from-amber-600 to-amber-400" style={{ height: 14 }} />)}
      </div>
      <div className="relative mt-6 w-44 h-1.5 rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden">
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '400%' }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="h-full w-1/4 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent"
        />
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.6 }}
        className="relative mt-2 text-[10px] uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500"
      >
        BolKhata
      </motion.p>
    </motion.div>
  )
}

export function PageSkeleton() {
  return (
    <div className="w-full py-8 space-y-6">
      <div className="space-y-3">
        <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-xl w-48 animate-pulse" />
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-96 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i=> <div key={i} className="h-28 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl animate-pulse" />)}
      </div>
      <div className="h-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl animate-pulse" />
    </div>
  )
}
