import { useRef } from 'react'

export default function OtpInput({ values, onChange, length = 4 }) {
  const refs = useRef([])

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...values]
    next[i] = val
    onChange(next)
    if (val && i < length - 1) refs.current[i + 1]?.focus()
  }
  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !values[i] && i > 0) refs.current[i - 1]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center my-3.5">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={values[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          maxLength={1}
          inputMode="numeric"
          className="w-11 h-[52px] text-center text-xl font-extrabold rounded-xl border-[1.5px] border-line bg-surface-2 text-ink font-mono outline-none focus:border-[var(--gold)]"
        />
      ))}
    </div>
  )
}
