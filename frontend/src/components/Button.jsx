export default function Button({ variant = "primary", size = "md", className = "", children, disabled, ...props }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-inherit"
  const sizes = {
    sm: "px-3.5 py-2 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-[15px]",
  }
  const variants = {
    primary: "bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-900 border border-slate-900 dark:border-amber-500 hover:bg-slate-800 dark:hover:bg-amber-600 hover:border-slate-800 dark:hover:border-amber-600 active:bg-black dark:active:bg-amber-700 shadow-sm",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 shadow-sm dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
    danger: "bg-white text-red-600 border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700 dark:bg-slate-800 dark:text-red-400 dark:border-slate-700 dark:hover:bg-red-950/40",
  }
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  )
}
