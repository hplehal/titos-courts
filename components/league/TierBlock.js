import { cn, getTierColor, getMovementIcon } from '@/lib/utils'

export default function TierBlock({ tier, teams = [], matches = [], showMovement = false }) {
  const { tierNumber, courtNumber, timeSlot } = tier
  const color = getTierColor(tierNumber)

  // Group matches by round if they have a roundNumber property
  const hasRounds = matches.length > 0 && matches[0].roundNumber != null
  const matchesByRound = hasRounds
    ? matches.reduce((acc, match) => {
        const round = match.roundNumber
        if (!acc[round]) acc[round] = []
        acc[round].push(match)
        return acc
      }, {})
    : null

  return (
    <div
      className={cn(
        'card-glass rounded-xl overflow-hidden',
        'border border-titos-border hover:border-titos-gold/25',
        'transition-all duration-200'
      )}
      style={{ borderTop: `3px solid var(--color-${color.accent})` }}
    >
      {/* ── Header ── */}
      <div className="bg-titos-elevated px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={cn('font-display font-bold text-xl tracking-tight', color.text)}>
            Tier {tierNumber}
          </span>
          {timeSlot && (
            <span className="text-titos-gray-400 text-xs font-medium px-2 py-0.5 rounded-full bg-titos-surface">
              {timeSlot}
            </span>
          )}
        </div>
        {courtNumber && (
          <span className="text-titos-gray-500 text-sm font-medium">
            Court {courtNumber}
          </span>
        )}
      </div>

      {/* ── Teams ── */}
      {teams.length > 0 && (
        <div className="divide-y divide-titos-border/20">
          {teams.map((team, i) => {
            const position = team.finishPosition ?? i + 1
            const isFirst = position === 1
            const isLast = position === 3

            return (
              <div
                key={team.id || team.name || i}
                className={cn(
                  'flex items-center justify-between px-5 py-3 transition-all duration-200',
                  isFirst && 'bg-titos-gold/[0.04]',
                  isLast && 'bg-red-500/[0.04]'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Position badge */}
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0',
                      isFirst && 'bg-titos-gold/20 text-titos-gold ring-1 ring-titos-gold/30',
                      position === 2 && 'bg-titos-gray-500/15 text-titos-gray-300',
                      isLast && 'bg-red-500/15 text-red-400'
                    )}
                  >
                    {position}
                  </span>

                  {/* Team name */}
                  <span className="text-titos-white text-sm font-semibold truncate">
                    {team.name}
                  </span>
                </div>

                {/* Movement indicator */}
                {showMovement && team.movement && (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ml-2',
                      team.movement === 'up' && 'bg-emerald-500/15 text-emerald-400',
                      team.movement === 'down' && 'bg-red-500/15 text-red-400',
                      team.movement === 'stay' && 'bg-titos-gray-500/10 text-titos-gray-500'
                    )}
                  >
                    {getMovementIcon(team.movement)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Matches ── */}
      {matches.length > 0 && (
        <div className="border-t border-titos-border/20 px-5 py-3">
          {hasRounds ? (
            Object.entries(matchesByRound).map(([round, roundMatches]) => (
              <div key={round}>
                <p className="text-titos-gray-500 text-[11px] font-semibold uppercase tracking-widest mb-1.5 mt-1 first:mt-0">
                  Round {round}
                </p>
                <div className="space-y-0">
                  {roundMatches.map((match, i) => (
                    <MatchRow key={match.id || i} match={match} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-0">
              {matches.map((match, i) => (
                <MatchRow key={match.id || i} match={match} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Match row sub-component ── */
function MatchRow({ match }) {
  const { homeTeam, awayTeam, scores, refTeam } = match

  // Determine winner from scores (e.g. "25-21" or "25-21, 25-18")
  let homeWon = null
  if (scores) {
    const sets = String(scores).split(',').map(s => s.trim())
    let homeWins = 0
    let awayWins = 0

    for (const set of sets) {
      const parts = set.split('-').map(Number)
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        if (parts[0] > parts[1]) homeWins++
        else if (parts[1] > parts[0]) awayWins++
      }
    }

    if (homeWins !== awayWins) {
      homeWon = homeWins > awayWins
    }
  }

  return (
    <div className="flex items-center justify-between text-sm py-2 border-b border-titos-border/10 last:border-0">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Home team */}
        <span
          className={cn(
            'truncate font-medium',
            homeWon === true ? 'text-titos-gold' : 'text-titos-gray-400'
          )}
        >
          {homeTeam}
        </span>

        {/* Score */}
        {scores ? (
          <span className="text-titos-gray-500 text-xs font-mono shrink-0 px-1.5">
            {formatScoreDisplay(scores, homeWon)}
          </span>
        ) : (
          <span className="text-titos-gray-500 text-xs shrink-0 px-1.5">vs</span>
        )}

        {/* Away team */}
        <span
          className={cn(
            'truncate font-medium',
            homeWon === false ? 'text-titos-gold' : 'text-titos-gray-400'
          )}
        >
          {awayTeam}
        </span>
      </div>

      {refTeam && (
        <span className="text-titos-gray-500 text-[11px] ml-3 shrink-0">
          Ref: {refTeam}
        </span>
      )}
    </div>
  )
}

/* ── Score formatting helper ── */
function formatScoreDisplay(scores, homeWon) {
  const sets = String(scores).split(',').map(s => s.trim())

  // If it's a single score string like "25-21", return it directly
  if (sets.length === 1) return sets[0]

  // Multiple sets: join with thin space separator
  return sets.join(' \u00B7 ')
}
