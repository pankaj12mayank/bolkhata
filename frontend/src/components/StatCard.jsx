import { motion } from 'framer-motion'
export default function StatCard({ icon, delta, deltaTone = 'up', value, label }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-soft hover:shadow-medium transition-all">
      <div className="flex justify-between items-start">
        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400">
          {icon}
        </div>
        {delta && <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${deltaTone==='up'?'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900':'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900'}`}>{delta}</span>}
      </div>
      <div className="font-mono text-2xl font-bold mt-3 dark:text-slate-100">{value}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
    </motion.div>
  )
}
