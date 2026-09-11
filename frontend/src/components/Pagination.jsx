import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, totalItems, pageSize, onPageChange, className = '' }) {
  if (!totalPages || totalPages <= 1) return null

  const startItem = totalItems ? (page - 1) * pageSize + 1 : 0
  const endItem = totalItems ? Math.min(page * pageSize, totalItems) : 0

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-line bg-surface-2/60 transition-colors ${className}`}>
      <div className="text-xs text-ink-dim font-mono">
        Showing <span className="font-bold text-ink">{startItem}</span> - <span className="font-bold text-ink">{endItem}</span> of <span className="font-bold text-ink">{totalItems}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3.5 py-1.5 rounded-xl border border-line bg-surface text-ink text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all flex items-center gap-1 shadow-soft"
        >
          <ChevronLeft size={14} /> Prev
        </button>

        <div className="flex items-center gap-1 px-3 font-mono text-xs text-ink-dim">
          <span className="font-extrabold text-ink px-2 py-0.5 rounded-lg bg-surface border border-line">{page}</span> / {totalPages}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3.5 py-1.5 rounded-xl border border-line bg-surface text-ink text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all flex items-center gap-1 shadow-soft"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
