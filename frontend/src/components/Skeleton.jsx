export function Skeleton({ className = "", height = "h-4", width = "w-full" }) {
  return <div className={`animate-pulse bg-slate-200 rounded-lg ${height} ${width} ${className}`} />
}
export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-2xl p-6 shadow-soft animate-pulse">
      <div className="flex gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded" />
        <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded w-5/6" />
      </div>
    </div>
  )
}
export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded-lg flex-1 animate-pulse" />)}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex gap-3 border-b border-slate-100 last:border-0">
          <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse" />
            <div className="h-3 bg-slate-100 rounded w-1/4 animate-pulse" />
          </div>
          <div className="h-8 w-20 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  )
}
