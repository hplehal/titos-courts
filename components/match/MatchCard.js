import { cn, getTierColor } from '@/lib/utils'
import StatusBadge from '@/components/ui/StatusBadge'

export default function MatchCard({ match }) {
  const {
    homeTeam,
    awayTeam,
    refTeam,
    scores,
    status,
    tierNumber,
    courtNumber,
  } = match

  const tierColor = tierNumber ? getTierColor(tierNumber) : null
  const isCompleted = status === 'completed'
  const isLive = status === 'live'
  const hasScores = scores && scores.length > 0

  // Determine set wins from scores array (each score is { home, away })
  const homeSetWins = hasScores
    ? scores.filter((s) => s.home > s.away).length
    : 0
  const awaySetWins = hasScores
    ? scores.filter((s) => s.away > s.home).length
    : 0

  const homeWon = isCompleted && homeSetWins > awaySetWins
  const awayWon = isCompleted && awaySetWins > homeSetWins

  return (
    <div className="card p-4 sm:p-5">
      {/* Top meta row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-titos-gray-400">
          {tierNumber && (
            <span className={cn('font-semibold', tierColor?.text)}>
              Tier {tierNumber}
            </span>
          )}
          {tierNumber && courtNumber && (
            <span className="text-titos-gray-600">|</span>
          )}
          {courtNumber && <span>Court {courtNumber}</span>}
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Team matchup */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Home team */}
        <div className="flex-1 text-right">
          <p
            className={cn(
              'font-display font-bold text-sm sm:text-base',
              homeWon ? 'text-titos-gold' : 'text-titos-white'
            )}
          >
            {homeTeam?.name || 'TBD'}
          </p>
        </div>

        {/* Score or VS */}
        <div className="flex-shrink-0 w-20 sm:w-24 text-center">
          {(isCompleted || isLive) && hasScores ? (
            <div className="flex items-center justify-center gap-2">
              <span
                className={cn(
                  'text-xl sm:text-2xl font-bold font-display',
                  homeWon ? 'text-titos-gold' : 'text-titos-gray-300'
                )}
              >
                {homeSetWins}
              </span>
              <span className="text-titos-gray-500 text-sm">-</span>
              <span
                className={cn(
                  'text-xl sm:text-2xl font-bold font-display',
                  awayWon ? 'text-titos-gold' : 'text-titos-gray-300'
                )}
              >
                {awaySetWins}
              </span>
            </div>
          ) : (
            <span className="text-titos-gray-500 font-bold text-sm uppercase">vs</span>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1">
          <p
            className={cn(
              'font-display font-bold text-sm sm:text-base',
              awayWon ? 'text-titos-gold' : 'text-titos-white'
            )}
          >
            {awayTeam?.name || 'TBD'}
          </p>
        </div>
      </div>

      {/* Set scores detail */}
      {hasScores && (isCompleted || isLive) && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-titos-gray-400">
          {scores.map((set, i) => (
            <span key={i} className="px-2 py-0.5 rounded bg-titos-card">
              <span className={set.home > set.away ? 'text-titos-gold font-bold' : ''}>{set.home}</span>
              <span className="text-titos-gray-600 mx-0.5">-</span>
              <span className={set.away > set.home ? 'text-titos-gold font-bold' : ''}>{set.away}</span>
            </span>
          ))}
        </div>
      )}

      {/* Ref team */}
      {refTeam && (
        <div className="mt-3 text-xs text-titos-gray-500">
          Ref: <span className="text-titos-gray-400">{refTeam.name || refTeam}</span>
        </div>
      )}
    </div>
  )
}
