import { cn } from '@/lib/utils'

export default function LiveBadge({ className = '' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 bg-status-live/15 text-status-live rounded-full text-xs font-bold uppercase tracking-wider border border-status-live/30',
        className
      )}
    >
      <span className="live-dot" />
      LIVE
    </span>
  )
}
