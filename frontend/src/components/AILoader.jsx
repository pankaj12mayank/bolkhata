import { motion } from 'framer-motion'

export default function AILoader({ text = "AI soch raha hai...", subtext = "Hinglish • Hindi • English" }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative w-[96px] h-[96px] flex items-center justify-center">
        <motion.div animate={{ scale: [1,1.12,1], opacity: [0.4,0,0.4] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 rounded-full border border-amber-500/25" />
        <motion.div animate={{ scale: [1,1.08,1], opacity: [0.3,0,0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 0.4 }} className="absolute inset-3 rounded-full border border-amber-500/20" />
        <motion.div animate={{ scale: [1,1.04,1] }} transition={{ duration: 1.6, repeat: Infinity }} className="relative w-14 h-14 rounded-2xl bg-slate-900 dark:bg-amber-500 flex items-center justify-center shadow-lg">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" fill="white" className="dark:fill-slate-900" /><path d="M6 10v1a6 6 0 0 0 12 0v-1M12 17v3" stroke="white" className="dark:stroke-slate-900" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </motion.div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm font-medium tracking-wide text-slate-700 dark:text-slate-300 flex items-center gap-2 justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          {text}
        </p>
        <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mt-1">{subtext}</p>
        <div className="flex items-center justify-center gap-1 mt-3 h-5">
          {[0,1,2].map(i=> <motion.span key={i} animate={{ scaleY: [0.5,1.1,0.5] }} transition={{ duration: 0.8, repeat: Infinity, delay: i*0.12 }} className="w-1 h-3 bg-amber-500 rounded-full" />)}
        </div>
      </div>
    </div>
  )
}
