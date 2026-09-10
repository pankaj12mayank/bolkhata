export default function Card({ children, hover = false, padding = "p-6", className = "", tilt = false, ...props }) {
  const base = `bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-soft dark:shadow-none ${padding} ${className}`
  const hoverCls = hover ? 'hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-colors duration-150' : ''
  if (tilt) {
    // 3D tilt subtle - no jump, only on desktop hover
    return (
      <div className={`${base} ${hoverCls}`} style={{ transformStyle: 'preserve-3d' }} {...props}>
        {children}
      </div>
    )
  }
  return <div className={`${base} ${hoverCls}`} {...props}>{children}</div>
}
