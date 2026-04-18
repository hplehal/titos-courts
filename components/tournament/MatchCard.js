// Semantic match card. Renders a pool or bracket match with team names,
// set scores, and status. Uses data-* attributes so styles in the design pass
// can target status/variant without prop drilling.
//
// When `poolTeams` is passed for a pool match, a "Ref" footer is rendered
// showing the single team on whistle duty (per the April 25 Captains Package
// schedule — one ref per match, not a lead+line pair).

import { cn } from '@/lib/utils'
import LiveIndicator from './LiveIndicator'
import { refAssignmentForMatch } from '@/lib/tournament/refRotation'
import { tallySetsWon, setWinnerAt } from '@/lib/tournament/computeMatchStatus'

function fmtTime(date) {
  if (!date) return null
  try {
    return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } catch {
    return null
  }
}

export default function MatchCard({ match, variant = 'pool', poolTeams = null }) {
  const home = match.homeTeam?.name || match.homeSeedLabel || 'TBD'
  const away = match.awayTeam?.name || match.awaySeedLabel || 'TBD'

  // Ref assignment (pool matches only — brackets don't auto-rotate refs).
  const refs = variant === 'pool' && poolTeams
    ? refAssignmentForMatch(match, poolTeams)
    : null

  // Normalize scores once; we render per-set columns for richer live display.
  const sortedScores = (match.scores || [])
    .slice()
    .sort((a, b) => (a.setNumber ?? 0) - (b.setNumber ?? 0))

  // Only count a set toward setsWon once it is actually COMPLETE (25 with
  // a 2-point lead, or cap 27 — or 15/cap 17 in a deciding bracket set). A
  // mid-set lead does not earn a set win.
  const mode = variant === 'pool' ? 'pool' : 'bracket'
  const { setsHome, setsAway } = tallySetsWon(sortedScores, mode)

  const homeWon = match.status === 'completed' && match.winnerId && match.winnerId === match.homeTeamId
  const awayWon = match.status === 'completed' && match.winnerId && match.winnerId === match.awayTeamId

  const time = fmtTime(match.scheduledTime)
  const court = match.courtNumber ? `Court ${match.courtNumber}` : null
  const meta = [time, court].filter(Boolean).join(' · ')

  return (
    <article
      className="card-flat rounded-lg overflow-hidden"
      data-variant={variant}
      data-status={match.status}
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-titos-border/30 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {match.status === 'live' ? (
            <LiveIndicator />
          ) : (
            <span className={cn('text-[10px] font-bold uppercase tracking-wider shrink-0',
              match.status === 'completed' ? 'text-titos-gray-500' : 'text-titos-gray-600',
            )}>{match.status === 'completed' ? 'Final' : 'Scheduled'}</span>
          )}
          {meta && <span className="text-[10px] text-titos-gray-500 truncate">{meta}</span>}
        </div>
        {sortedScores.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-titos-gray-500 font-medium uppercase tracking-wider shrink-0">
            {sortedScores.map(s => (
              <span key={s.setNumber} className="min-w-[1.75rem] sm:min-w-[2.5rem] text-center">S{s.setNumber}</span>
            ))}
          </div>
        )}
      </div>
      <div className="divide-y divide-titos-border/20">
        <TeamRow
          name={home}
          winner={homeWon}
          setsWon={setsHome}
          perSet={sortedScores.map(s => s.homeScore)}
          opposingPerSet={sortedScores.map(s => s.awayScore)}
          showNumbers={match.status !== 'scheduled'}
          mode={mode}
        />
        <TeamRow
          name={away}
          winner={awayWon}
          setsWon={setsAway}
          perSet={sortedScores.map(s => s.awayScore)}
          opposingPerSet={sortedScores.map(s => s.homeScore)}
          showNumbers={match.status !== 'scheduled'}
          mode={mode}
        />
      </div>
      {refs?.ref && (
        <div className="px-3 py-1.5 border-t border-titos-border/30 bg-titos-elevated/40 text-[11px] text-titos-gray-400 flex items-center gap-1.5">
          <span className="font-semibold uppercase tracking-wider text-titos-gray-500">Ref</span>
          <span className="text-titos-gray-300 truncate">{refs.ref.name}</span>
        </div>
      )}
    </article>
  )
}

function TeamRow({ name, winner, setsWon, perSet, opposingPerSet, showNumbers, mode }) {
  return (
    <div className={cn('flex items-center justify-between px-3 py-2 gap-2 sm:gap-3', winner && 'bg-titos-gold/10')}>
      <span className={cn('text-sm truncate flex-1 min-w-0', winner ? 'text-titos-gold font-bold' : 'text-titos-white')}>
        {name}
      </span>
      {showNumbers && (
        <div className="flex items-center gap-1 shrink-0">
          {perSet.map((pts, i) => {
            // Only emphasise the winner's score once the set is actually
            // complete — a mid-set lead stays neutral. Reconstructing as
            // {homeScore=me, awayScore=them}, a 'home' winner means this side.
            const wonSet = setWinnerAt(
              { homeScore: pts, awayScore: opposingPerSet[i] ?? 0 },
              i,
              mode,
            ) === 'home'
            return (
              <span
                key={i}
                className={cn('min-w-[1.75rem] sm:min-w-[2.5rem] text-center text-sm tabular-nums font-semibold',
                  wonSet ? 'text-titos-white' : 'text-titos-gray-500',
                )}
              >
                {pts}
              </span>
            )
          })}
          <span className={cn('min-w-[1.5rem] sm:min-w-[2rem] text-center text-sm font-bold tabular-nums pl-1.5 sm:pl-2 border-l border-titos-border/40',
            winner ? 'text-titos-gold' : 'text-titos-gray-300',
          )}>
            {setsWon}
          </span>
        </div>
      )}
    </div>
  )
}
