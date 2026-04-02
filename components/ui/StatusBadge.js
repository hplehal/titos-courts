import { cn } from '@/lib/utils'

const statusStyles = {
  registration: 'bg-status-info/15 text-status-info border-status-info/30',
  active: 'bg-status-success/15 text-status-success border-status-success/30',
  playoffs: 'bg-titos-gold-muted text-titos-gold border-titos-gold/30',
  completed: 'bg-titos-gray-500/20 text-titos-gray-300 border-titos-gray-500/30',
  live: 'bg-status-live/15 text-status-live border-status-live/30',
  upcoming: 'bg-titos-card text-titos-gray-400 border-titos-border',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border',
        statusStyles[status] || statusStyles.upcoming
      )}
    >
      {status === 'live' && <span className="live-dot" />}
      {status || 'upcoming'}
    </span>
  )
}
