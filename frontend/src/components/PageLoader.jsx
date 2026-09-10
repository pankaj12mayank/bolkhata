import { motion } from 'framer-motion'
import { useLang } from '../context/LangContext'

export default function PageLoader({ fullScreen = false }) {
  const { t } = useLang()
  const Wrapper = fullScreen ? motion.div : 'div'
  const props = fullScreen
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        className: 'fixed inset-0 z-[100] bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl flex items-center justify-center',
      }
    : { className: 'py-16 flex items-center justify-center' }

  return (
    <Wrapper {...props}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-[88px] h-[88px] flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full border border-amber-400/30"
          />
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }}
            className="absolute inset-3 rounded-full border border-amber-500/20"
          />
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-14 h-14 rounded-2xl bg-slate-900 dark:bg-amber-500 flex items-center justify-center shadow-lg"
          >
            <motion.svg
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" fill="white" className="dark:fill-slate-900" />
              <path d="M6 10v1a6 6 0 0 0 12 0v-1M12 17v3" stroke="white" className="dark:stroke-slate-900" strokeWidth="1.6" strokeLinecap="round" />
            </motion.svg>
          </motion.div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-medium tracking-wide text-slate-600 dark:text-slate-400">{t('loader_msg')}</span>
          </div>
          <div className="flex items-center gap-1 h-4">
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                animate={{ scaleY: [0.5, 1.2, 0.5], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12 }}
                className="w-1 h-3 bg-amber-500 rounded-full"
                style={{ originY: 0.5 }}
              />
            ))}
          </div>
        </div>
      </div>
    </Wrapper>
  )
}
