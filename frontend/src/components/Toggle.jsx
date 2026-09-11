export default function Toggle({ on, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-11 h-6 rounded-full relative flex-shrink-0 border transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${
        on ? 'bg-[rgba(79,163,122,.2)] border-green' : 'bg-surface-2 border-line'
      }`}
    >
      <div
        className={`absolute top-0.5 w-[18px] h-[18px] rounded-full transition-transform ${
          on ? 'translate-x-5 bg-green' : 'translate-x-0.5 bg-ink-dim'
        }`}
      />
    </button>
  )
}