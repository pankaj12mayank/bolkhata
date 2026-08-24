export default function Button({ variant = "primary", size = "md", className = "", children, disabled, ...props }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
  const sizes = { sm: "px-3.5 py-2 text-[12.5px]", md: "px-5 py-2.5 text-[13.5px]" }
  const variants = {
    primary: "text-[#1A1206] shadow-[0_10px_22px_-10px_rgba(232,169,59,.5)] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-10px_rgba(232,169,59,.6)] active:translate-y-0 active:scale-[0.98] active:shadow-none bg-[linear-gradient(135deg,var(--gold),var(--gold-deep))] hover:brightness-110",
    ghost: "border-[1.5px] border-line text-ink bg-transparent hover:border-[var(--gold)] hover:text-gold hover:bg-[rgba(232,169,59,0.08)] active:bg-[rgba(232,169,59,0.15)] active:border-[var(--gold)] active:text-gold",
    danger: "border-[1.5px] border-line text-maroon bg-transparent hover:border-maroon hover:bg-[rgba(229,83,61,0.08)] active:bg-[rgba(229,83,61,0.15)]",
  }
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  )
}