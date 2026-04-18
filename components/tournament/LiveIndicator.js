// Pulsing dot for a live-status signal. Pure presentational — used in
// tournament list items, match cards, and live spotlights.

export default function LiveIndicator({ label = 'LIVE', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-titos-gold ${className}`}
      aria-label="Live"
    >
      <span
        className="relative inline-flex h-2 w-2 items-center justify-center"
        aria-hidden="true"
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-titos-gold opacity-60"></span>
        <span className="relative inline-flex h-2 w-2 rounded-full bg-titos-gold"></span>
      </span>
      {label}
    </span>
  )
}
