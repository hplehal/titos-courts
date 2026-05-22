'use client'

// Oversized "Live now" card for the hub spotlight. Optimised for
// spectators glancing across the room: dominant scoreline, leader badge,
// per-set breakdown underneath. Leading team row is accented in gold.

import { cn } from '@/lib/utils'
import LiveIndicator from './LiveIndicator'
import { tallySetsWon, expectedSetCount } from '@/lib/tournament/computeMatchStatus'
import { cleanTeamName } from '@/lib/tournament/displayName'

// Pick the scoring mode + total set count from the match's explicit
// matchFormat field. Falls back to the legacy "poolId → pool" heuristic so
// older tournaments without matchFormat keep the 2-set/3-set behaviour.
function resolveMode(match) {
  const fmt = match.matchFormat
  if (fmt === 'pool-1set-25-cap-27' || fmt === 'pool-1set') return 'pool-1set'
  if (fmt === 'pool-2set-25-cap-27' || fmt === 'pool') return 'pool'
  if (fmt === 'bo3-25-15-no-cap' || fmt === 'bracket-no-cap') return 'bracket-no-cap'
  if (fmt === 'bo3-25-15-cap-17' || fmt === 'bracket') return 'bracket'
  return match.poolId ? 'pool' : 'bracket'
}

function fmtTime(date) {
  if (!date) return null
  try {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return null
  }
}

export default function LiveMatchCard({ match, poolName }) {
  const home = cleanTeamName(match.homeTeam?.name) || match.homeSeedLabel || 'Home'
  const away = cleanTeamName(match.awayTeam?.name) || match.awaySeedLabel || 'Away'

  const sortedScores = (match.scores || [])
    .slice()
    .sort((a, b) => (a.setNumber ?? 0) - (b.setNumber ?? 0))

  // The "current set" is the first one where neither side has hit the target,
  // or otherwise the highest-numbered set with entries.
  const currentSet = sortedScores[sortedScores.length - 1] || null
  const homeCurrent = currentSet?.homeScore ?? 0
  const awayCurrent = currentSet?.awayScore ?? 0

  // Resolve scoring mode from matchFormat (with legacy poolId fallback).
  // For pool-1set tournaments (May 23 REC), there's only ever one set —
  // the per-set row and "Sets won" line are noise, so we hide them.
  const mode = resolveMode(match)
  const totalSets = expectedSetCount(mode)
  const { setsHome, setsAway } = tallySetsWon(sortedScores, mode)
  const isSingleSet = totalSets === 1

  const homeLeading = homeCurrent > awayCurrent
  const awayLeading = awayCurrent > homeCurrent

  // Strapline: who's ahead in the current set.
  let strap = null
  if (!currentSet) {
    strap = 'Waiting for first point'
  } else if (homeCurrent === awayCurrent) {
    strap = `Tied at ${homeCurrent}`
  } else if (homeLeading) {
    strap = `${home} leads by ${homeCurrent - awayCurrent}`
  } else {
    strap = `${away} leads by ${awayCurrent - homeCurrent}`
  }

  const time = fmtTime(match.scheduledTime)
  const court = match.courtNumber ? `Court ${match.courtNumber}` : null
  const meta = [court, time, poolName].filter(Boolean).join(' · ')

  return (
    <article
      className="card-flat rounded-xl overflow-hidden border border-status-live/30"
      data-status="live"
      aria-label={`Live match: ${home} vs ${away}. ${strap}`}
    >
      <div className="px-4 py-2 flex items-center justify-between gap-2 border-b border-titos-border/30 bg-titos-elevated/40">
        <div className="flex items-center gap-2 min-w-0">
          <LiveIndicator />
          <span className="text-[11px] text-titos-gray-400 truncate">{meta}</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-status-live">
          {isSingleSet ? 'Race to 25' : `Set ${currentSet?.setNumber ?? 1}`}
        </span>
      </div>

      <div className="px-4 py-4 space-y-2">
        <TeamRow
          name={home}
          score={homeCurrent}
          leading={homeLeading}
          setsWon={setsHome}
          showSetsWon={!isSingleSet}
        />
        <TeamRow
          name={away}
          score={awayCurrent}
          leading={awayLeading}
          setsWon={setsAway}
          showSetsWon={!isSingleSet}
        />
      </div>

      <div
        className="px-4 py-2 text-center text-sm font-semibold text-titos-gold border-t border-titos-border/30 bg-titos-elevated/30"
        aria-live="polite"
      >
        {strap}
      </div>

      {/* Per-set breakdown — only meaningful when the match has more than
          one set. 1-set matches would render a redundant duplicate of the
          headline scoreline. */}
      {!isSingleSet && sortedScores.length > 1 && (
        <div className="px-4 py-2 flex items-center justify-center gap-3 text-[11px] text-titos-gray-500 border-t border-titos-border/30">
          {sortedScores.map((s) => (
            <span key={s.setNumber} className="tabular-nums">
              S{s.setNumber}{' '}
              <span className={cn(s.homeScore > s.awayScore ? 'text-titos-white' : 'text-titos-gray-500')}>
                {s.homeScore}
              </span>
              <span className="text-titos-gray-600">–</span>
              <span className={cn(s.awayScore > s.homeScore ? 'text-titos-white' : 'text-titos-gray-500')}>
                {s.awayScore}
              </span>
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

function TeamRow({ name, score, leading, setsWon, showSetsWon = true }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors',
        leading ? 'bg-titos-gold/10' : 'bg-transparent',
      )}
    >
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'text-sm font-semibold truncate',
            leading ? 'text-titos-gold' : 'text-titos-white',
          )}
        >
          {name}
        </div>
        {showSetsWon && (
          <div className="text-[10px] uppercase tracking-wider text-titos-gray-500 tabular-nums">
            Sets won: {setsWon}
          </div>
        )}
      </div>
      <div
        className={cn(
          'font-display text-4xl md:text-5xl font-black tabular-nums leading-none',
          leading ? 'text-titos-gold' : 'text-titos-white',
        )}
      >
        {score}
      </div>
    </div>
  )
}
