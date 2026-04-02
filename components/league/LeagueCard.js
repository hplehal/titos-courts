import Link from 'next/link'
import { Calendar, Users } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import StatusBadge from '@/components/ui/StatusBadge'

export default function LeagueCard({ league }) {
  const { name, slug, dayOfWeek, description, registrationFee, currentSeason } = league
  const season = currentSeason || {}

  return (
    <div className="card p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display text-xl font-bold text-titos-white mb-1">{name}</h3>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-titos-gold-muted text-titos-gold border border-titos-gold/20">
            {dayOfWeek}
          </span>
        </div>
        {season.status && <StatusBadge status={season.status} />}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {league.flagship && (
          <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-titos-gold/20 text-titos-gold">
            Flagship
          </span>
        )}
        {league.beginnerFriendly && (
          <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-status-success/15 text-status-success">
            Beginner Friendly
          </span>
        )}
      </div>

      {/* Season name */}
      {season.name && (
        <p className="text-titos-gray-300 text-sm font-medium mb-2">{season.name}</p>
      )}

      {/* Description */}
      {description && (
        <p className="text-titos-gray-400 text-sm leading-relaxed mb-4 flex-1">
          {description}
        </p>
      )}

      {/* Meta */}
      <div className="space-y-2 mb-5 text-sm text-titos-gray-300">
        {season.teamCount != null && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-titos-gray-400" />
            <span>{season.teamCount} Teams</span>
          </div>
        )}
        {(season.startDate || season.endDate) && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-titos-gray-400" />
            <span>
              {season.startDate ? formatDate(season.startDate) : ''}
              {season.startDate && season.endDate ? ' - ' : ''}
              {season.endDate ? formatDate(season.endDate) : ''}
            </span>
          </div>
        )}
      </div>

      {/* CTA */}
      <Link
        href={`/leagues/${slug}`}
        className="block text-center px-4 py-2.5 rounded-lg bg-titos-gold/10 text-titos-gold font-semibold text-sm border border-titos-gold/20 hover:bg-titos-gold/20 hover:border-titos-gold/40 transition-all duration-200"
      >
        View Details
      </Link>
    </div>
  )
}
