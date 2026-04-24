// Semantic match card. Renders a pool or bracket match with team names,
// set scores, and status. Uses data-* attributes so styles in the design pass
// can target status/variant without prop drilling.
//
// Ref footer resolution order:
//   1. `match.refTeam` — manual admin assignment (works for any match)
//   2. `poolTeams` rotation — derived from the Captains Package PDF (pool only)
// Bracket matches rely exclusively on (1); there is no automatic rotation.

import { MapPin, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import LiveIndicator from './LiveIndicator'
import { refAssignmentForMatch } from '@/lib/tournament/refRotation'
import { tallySetsWon, setWinnerAt } from '@/lib/tournament/computeMatchStatus'
import { cleanTeamName } from '@/lib/tournament/displayName'

function fmtTime(date) {
  if (!date) return null
  try {
    return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } catch {
    return null
  }
}

export default function MatchCard({ match, variant = 'pool', poolTeams = null, showRound = false }) {
  const home = cleanTeamName(match.homeTeam?.name) || match.homeSeedLabel || 'TBD'
  const away = cleanTeamName(match.awayTeam?.name) || match.awaySeedLabel || 'TBD'

  // Ref assignment: prefer the manually-assigned `refTeam` (works for both
  // pool overrides and bracket matches); otherwise derive from the PDF
  // rotation when we have a pool roster. Falls back to null (no ref line).
  let refName = cleanTeamName(match.refTeam?.name) ?? null
  if (!refName && variant === 'pool' && poolTeams) {
    const derived = refAssignmentForMatch(match, poolTeams)
    refName = cleanTeamName(derived?.ref?.name) ?? null
  }

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
  const courtNumber = match.courtNumber ?? null
  const court = courtNumber ? `Court ${courtNumber}` : null
  // Round chip only renders when caller opts in (showRound). The public
  // hub passes showRound so the single-dropdown pool view keeps R1/R2/…
  // legible without re-introducing per-round accordions.
  const roundLabel = showRound && match.roundNumber ? `R${match.roundNumber}` : null
  // Bracket cards deliberately omit the time — the bracket tree reads
  // round-to-round ("when" is "after the previous match finishes") and
  // the single-day playoff schedule makes per-card timestamps noise more
  // than signal. The "Up next" spotlight above the tree still surfaces
  // the concrete time for whichever slot is next. Court stays in its own
  // badge so the physical location is always visible.
  const metaParts = variant === 'bracket'
    ? [roundLabel]
    : [roundLabel, time, court]
  const meta = metaParts.filter(Boolean).join(' · ')

  return (
    <article
      className="card-flat rounded-lg overflow-hidden"
      data-variant={variant}
      data-status={match.status}
    >
      {/* Meta row — status + court badge for bracket cards (no time),
          status · round · time · court for pool cards.
          The bracket card is 14.5rem wide, so we deliberately DROP the
          per-set column headers (S1/S2/S3) that pool cards show. Set
          numbers are implicit in their left-to-right order and the
          headers were otherwise stealing space in a narrow card. */}
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
        <div className="flex items-center gap-2 shrink-0">
          {/* Pool-card set-column headers (S1/S2/S3) only — keeps a wide
              pool card legible without crowding the narrower bracket one. */}
          {variant === 'pool' && sortedScores.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-titos-gray-500 font-medium uppercase tracking-wider">
              {sortedScores.map(s => (
                <span key={s.setNumber} className="min-w-[1.75rem] sm:min-w-[2.5rem] text-center">
                  S{s.setNumber}
                </span>
              ))}
            </div>
          )}
          {/* Bracket court badge — pulled out so the physical court where
              this match plays is obvious at a glance, not buried in meta. */}
          {variant === 'bracket' && courtNumber && (
            <span
              className="inline-flex items-center gap-1 h-5 px-1.5 rounded-md bg-titos-gold/15 text-titos-gold text-[10px] font-bold tabular-nums"
              aria-label={`Court ${courtNumber}`}
            >
              <MapPin className="w-3 h-3" aria-hidden="true" />
              C{courtNumber}
            </span>
          )}
        </div>
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
      {refName && (
        <div className="px-3 py-1.5 border-t border-titos-border/30 bg-titos-elevated/40 text-[11px] text-titos-gray-400 flex items-center gap-1.5">
          <UserCheck className="w-3 h-3 text-titos-gray-500 shrink-0" aria-hidden="true" />
          <span className="font-semibold uppercase tracking-wider text-titos-gray-500 text-[10px]">Ref</span>
          <span className="text-titos-gray-200 font-medium truncate">{refName}</span>
        </div>
      )}
    </article>
  )
}

function TeamRow({ name, winner, setsWon, perSet, opposingPerSet, showNumbers, mode }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-2 gap-2 sm:gap-3',
        winner && 'bg-titos-gold/10',
      )}
    >
      <span
        className={cn(
          'text-sm truncate flex-1 min-w-0',
          winner ? 'text-titos-gold font-bold' : 'text-titos-white',
        )}
      >
        {name}
      </span>
      {showNumbers && (
        <div className="flex items-center gap-1 shrink-0">
          {perSet.map((pts, i) => {
            // Only emphasise the winner's score once the set is actually
            // complete — a mid-set lead stays neutral. Reconstructing as
            // {homeScore=me, awayScore=them}, a 'home' winner means this side.
            const wonSet =
              setWinnerAt(
                { homeScore: pts, awayScore: opposingPerSet[i] ?? 0 },
                i,
                mode,
              ) === 'home'
            return (
              <span
                key={i}
                className={cn(
                  'min-w-[1.75rem] sm:min-w-[2.5rem] text-center text-sm tabular-nums',
                  // Step up the emphasis for winning scores: bold + full
                  // white; losing scores drop to semibold gray so the set
                  // winner pops at a glance without needing the S1/S2/S3
                  // column headers to parse the readout.
                  wonSet
                    ? 'font-bold text-titos-white'
                    : 'font-medium text-titos-gray-500',
                )}
              >
                {pts}
              </span>
            )
          })}
          {/* Sets-won total — pill-ified with its own bg so the divider
              isn't the only affordance separating "score of set 3" from
              "total sets won". Makes the column read as a clear summary,
              not another set score. */}
          <span
            className={cn(
              'ml-1 sm:ml-1.5 inline-flex items-center justify-center min-w-[1.75rem] sm:min-w-[2rem] h-7 px-1.5 rounded-md text-sm font-black tabular-nums',
              winner
                ? 'bg-titos-gold/25 text-titos-gold ring-1 ring-titos-gold/40'
                : 'bg-titos-elevated/60 text-titos-gray-300',
            )}
            aria-label={`${setsWon} set${setsWon === 1 ? '' : 's'} won`}
          >
            {setsWon}
          </span>
        </div>
      )}
    </div>
  )
}
