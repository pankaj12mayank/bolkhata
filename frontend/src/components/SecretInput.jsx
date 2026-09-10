import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function SecretInput({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  autoComplete = "off",
  id,
}) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative w-full">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className={
          className ||
          'w-full px-3.5 py-3 pr-10 rounded-xl border border-line bg-surface-2 text-ink text-[14.5px] outline-none focus:border-[var(--gold)] transition-colors'
        }
      />
      <button
        type="button"
        onClick={() => setShow((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink transition-colors p-1 rounded-lg focus:outline-none"
        title={show ? 'Hide secret' : 'Show secret'}
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}
