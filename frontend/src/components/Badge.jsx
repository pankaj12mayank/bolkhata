const styles = {
  green: 'bg-[rgba(79,163,122,.15)] text-green',
  gold: 'bg-[rgba(232,169,59,.16)] text-gold',
  red: 'bg-[rgba(229,83,61,.15)] text-maroon',
}
export default function Badge({ tone = 'gold', children }) {
  return <span className={`px-2.5 py-1 rounded-full text-[11.5px] font-bold whitespace-nowrap ${styles[tone]}`}>{children}</span>
}
