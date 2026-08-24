export default function StatCard({ icon, delta, deltaTone = 'up', value, label }) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-soft">
      <div className="flex justify-between items-start">
        <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center bg-[rgba(232,169,59,.14)] text-gold">
          {icon}
        </div>
        {delta && (
          <span className={`text-[11.5px] font-bold px-2.5 py-1 rounded-full ${deltaTone === 'up' ? 'text-green bg-[rgba(79,163,122,.14)]' : 'text-maroon bg-[rgba(229,83,61,.14)]'}`}>
            {delta}
          </span>
        )}
      </div>
      <div className="font-mono text-[28px] font-semibold mt-3.5">{value}</div>
      <div className="text-[13px] text-ink-dim mt-0.5">{label}</div>
    </div>
  )
}
