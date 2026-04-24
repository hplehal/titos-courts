'use client'

// Client wrapper for the tournament hub. Takes SSR'd initialData as fallback
// and wraps in LivePoller so the spotlight + standings + match cards refresh
// on a 10s interval. The public /api/tournaments/[slug] endpoint returns the
// raw tournament structure; we re-compute standings client-side via the same
// pure function that powers the server render for consistency.

import { useMemo, useState } from 'react'
import { Trophy, Medal, Crown, MapPin, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import LivePoller from '@/components/tournament/LivePoller'
import LiveIndicator from '@/components/tournament/LiveIndicator'
import LiveMatchCard from '@/components/tournament/LiveMatchCard'
import PoolMatchesList from '@/components/tournament/PoolMatchesList'
import StandingsTable from '@/components/tournament/StandingsTable'
import TeamPicker from '@/components/tournament/TeamPicker'
import TeamSchedule from '@/components/tournament/TeamSchedule'
import BracketTree from '@/components/tournament/BracketTree'
import { computeStandingsFromMatches } from '@/lib/tournament/calculateStandings'
import { cleanTeamName } from '@/lib/tournament/displayName'
import { DIVISION_GOLD, DIVISION_SILVER, BRACKET_ROUND, MATCH_STATUS } from '@/lib/tournament/constants'

function findLiveMatches(tournament) {
  const live = []
  for (const pool of tournament?.pools || []) {
    for (const m of pool.matches || []) {
      if (m.status === 'live') {
        live.push({ ...m, poolName: pool.name, poolTeams: pool.teams, _source: 'pool' })
      }
    }
  }
  for (const bracket of tournament?.brackets || []) {
    for (const m of bracket.matches || []) {
      if (m.status === 'live') live.push({ ...m, poolName: `${bracket.division} Bracket`, _source: 'bracket' })
    }
  }
  return live
}

// Scroll the pool-section anchor into view. Respects reduced-motion by letting
// the browser default (which honours the user's system setting) apply — we
// pass `behavior: 'smooth'` but it degrades to 'instant' when the user has
// `prefers-reduced-motion: reduce` in most modern browsers.
function scrollToPool(poolId) {
  if (typeof document === 'undefined') return
  const el = document.getElementById(`pool-${poolId}`)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function HubBody({ slug, tournament }) {
  const [selectedTeamId, setSelectedTeamId] = useState('')

  // Resolve selection → { team, pool } once so TeamSchedule and the picker
  // stay in sync as data refreshes.
  const mySelection = useMemo(() => {
    if (!selectedTeamId || !tournament?.pools) return null
    for (const pool of tournament.pools) {
      const team = (pool.teams || []).find(t => t.id === selectedTeamId)
      if (team) return { team, pool }
    }
    return null
  }, [selectedTeamId, tournament])

  const myPoolId = mySelection?.pool?.id ?? null

  const poolsWithStandings = useMemo(() => {
    if (!tournament?.pools) return []
    const enriched = tournament.pools.map(pool => ({
      ...pool,
      standings: pool.standings || computeStandingsFromMatches(pool.teams || [], pool.matches || []),
      // Present matches in round order (= time order since rounds are
      // stamped at 30-min intervals). Stable tie-break on gameOrder.
      matches: (pool.matches || []).slice().sort((a, b) => {
        const ra = a.roundNumber ?? 0
        const rb = b.roundNumber ?? 0
        if (ra !== rb) return ra - rb
        return (a.gameOrder ?? 0) - (b.gameOrder ?? 0)
      }),
    }))
    // If the player has picked their team, float their pool to the top of the
    // grid so Pool C/D players don't have to scroll past the others to find
    // their matches. Everyone else keeps the natural A → B → C → D order.
    if (!myPoolId) return enriched
    const mine = enriched.find(p => p.id === myPoolId)
    const others = enriched.filter(p => p.id !== myPoolId)
    return mine ? [mine, ...others] : enriched
  }, [tournament, myPoolId])

  const liveMatches = useMemo(() => findLiveMatches(tournament), [tournament])

  return (
    <>
      {/* Team picker — "who are you?" → personal view. No-op for spectators. */}
      <TeamPicker
        slug={slug}
        pools={tournament?.pools || []}
        value={selectedTeamId}
        onChange={setSelectedTeamId}
      />

      {mySelection && (
        <TeamSchedule team={mySelection.team} pool={mySelection.pool} />
      )}

      {/* Live spotlight — shows every currently-live match across pools +
          brackets. With 4 courts running in parallel, up to 4 pool matches
          can be live simultaneously. Polls every 10s via LivePoller. */}
      {liveMatches.length > 0 && (
        <section className="mb-10" aria-labelledby="live-match-heading" aria-live="polite">
          <h2 id="live-match-heading" className="font-display text-lg font-bold text-titos-white mb-3 flex items-center gap-2">
            <LiveIndicator /> Live now
            <span className="text-titos-gray-400 text-sm font-normal">
              ({liveMatches.length} match{liveMatches.length === 1 ? '' : 'es'})
            </span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {liveMatches.map(m => (
              <LiveMatchCard key={m.id} match={m} poolName={m.poolName} />
            ))}
          </div>
        </section>
      )}

      {/* Playoff brackets — once generated they're the main story, so they
          sit ABOVE pool play. Pool standings still render below for context
          (how did we get here). Each division is its own collapsible card so
          players scan straight to their draw. */}
      {(tournament?.brackets || []).length > 0 && (
        <BracketsSection brackets={tournament.brackets} />
      )}

      {/* Pool play */}
      {poolsWithStandings.length > 0 && (
        <section className="mb-10" aria-labelledby="pools-heading">
          <div className="flex items-baseline justify-between gap-3 mb-4 flex-wrap">
            <h2 id="pools-heading" className="font-display text-xl font-bold text-titos-white">Pool Play</h2>
            {/* Quick-jump chips. Smooth-scrolls to that pool — useful when you
                want to peek at another pool's standings without visually
                hunting. The user's own pool gets a gold accent. */}
            {poolsWithStandings.length > 1 && (
              <nav
                aria-label="Jump to pool"
                className="flex items-center gap-1.5 flex-wrap"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-titos-gray-500 mr-1">
                  Jump to
                </span>
                {/* Render chips in the tournament's natural order (A..N) — not
                    the reordered display order — so the jump nav stays a
                    stable mental map. */}
                {(tournament?.pools || []).map(p => {
                  const isMine = p.id === myPoolId
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => scrollToPool(p.id)}
                      aria-label={`Jump to ${p.name}${isMine ? ' (your pool)' : ''}`}
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 h-7 rounded-full text-xs font-semibold transition-colors cursor-pointer',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold',
                        isMine
                          ? 'bg-titos-gold text-titos-black hover:bg-titos-gold/90'
                          : 'bg-titos-elevated text-titos-gray-300 border border-titos-border hover:border-titos-gold/40 hover:text-titos-white',
                      )}
                    >
                      {p.name.replace(/^Pool\s+/i, '') /* compact: just the letter */}
                      {isMine && <span className="text-[9px] font-black uppercase tracking-wider opacity-80">You</span>}
                    </button>
                  )
                })}
              </nav>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {poolsWithStandings.map(pool => (
              <div key={pool.id} id={`pool-${pool.id}`} className="space-y-3 scroll-mt-4">
                <StandingsTable
                  pool={pool}
                  standings={pool.standings}
                  selectedTeamId={selectedTeamId || null}
                />
                {/* Collapsible per-round breakdown. Live / next round is
                    expanded automatically; past rounds collapse with a
                    compact summary so users aren't scrolling through a wall
                    of final scores. */}
                <PoolMatchesList matches={pool.matches} poolTeams={pool.teams} />
              </div>
            ))}
          </div>
        </section>
      )}

      {poolsWithStandings.length === 0 && (
        <p className="text-titos-gray-400 text-center py-8">Pools will appear here once the tournament is configured.</p>
      )}
    </>
  )
}

/**
 * Bracket status helpers — derive the "story" of a bracket so the header
 * can show either the crowned Champion or the Next-up match instead of
 * the generic "7 matches" count.
 */
function findChampion(bracket) {
  const final = (bracket?.matches || []).find(
    m => m.bracketRound === BRACKET_ROUND.FINAL,
  )
  if (!final || final.status !== MATCH_STATUS.FINAL || !final.winnerId) return null
  if (final.winnerId === final.homeTeamId) return final.homeTeam
  if (final.winnerId === final.awayTeamId) return final.awayTeam
  return null
}

function findNextUp(bracket) {
  // Returns the *group* of matches currently deserving spotlight, not just
  // one. The playoff schedule runs two QFs concurrently (Gold: Courts 1&2,
  // Silver: Courts 3&4) and two SFs concurrently, so collapsing to a single
  // card hides half the action. Priority:
  //   1. If any match is LIVE, return ALL live matches.
  //   2. Otherwise find the earliest scheduledTime among pending matches
  //      and return every pending match at that same timestamp (same slot).
  //   3. Fallback: if nothing has a scheduledTime, return the single
  //      earliest-by-(round, position) pending match so the callout still
  //      shows something.
  const pending = (bracket?.matches || []).filter(
    (m) => m.status !== MATCH_STATUS.FINAL,
  )
  if (pending.length === 0) return []

  const lives = pending.filter((m) => m.status === MATCH_STATUS.LIVE)
  if (lives.length > 0) {
    return lives
      .slice()
      .sort(
        (a, b) =>
          (a.courtNumber ?? 99) - (b.courtNumber ?? 99) ||
          (a.bracketPosition ?? 0) - (b.bracketPosition ?? 0),
      )
  }

  const withTime = pending.filter((m) => m.scheduledTime)
  if (withTime.length > 0) {
    const earliest = Math.min(
      ...withTime.map((m) => new Date(m.scheduledTime).getTime()),
    )
    return withTime
      .filter((m) => new Date(m.scheduledTime).getTime() === earliest)
      .sort(
        (a, b) =>
          (a.courtNumber ?? 99) - (b.courtNumber ?? 99) ||
          (a.bracketPosition ?? 0) - (b.bracketPosition ?? 0),
      )
  }

  const fallback = pending
    .slice()
    .sort(
      (a, b) =>
        (a.bracketRound - b.bracketRound) ||
        (a.bracketPosition - b.bracketPosition),
    )
  return fallback.length ? [fallback[0]] : []
}

const ROUND_LABEL = {
  [BRACKET_ROUND.QUARTERFINAL]: 'Quarterfinal',
  [BRACKET_ROUND.SEMIFINAL]: 'Semifinal',
  [BRACKET_ROUND.FINAL]: 'Final',
}

function BracketsSection({ brackets }) {
  const gold = brackets.find(b => b.division === DIVISION_GOLD)
  const silver = brackets.find(b => b.division === DIVISION_SILVER)
  const ordered = [gold, silver].filter(Boolean)

  // Tabbed view — Gold default. Keeps the section compact (no stacked
  // 7-match trees), and gives the user a deliberate switch rather than
  // a wall of cards to scroll through.
  const [activeDivision, setActiveDivision] = useState(
    gold ? DIVISION_GOLD : (silver ? DIVISION_SILVER : null),
  )
  const active = ordered.find(b => b.division === activeDivision) || ordered[0]
  if (!active) return null

  const champion = findChampion(active)
  // nextUp is a LIST (concurrent matches share a time slot — see findNextUp).
  const nextUp = champion ? [] : findNextUp(active)

  return (
    <section className="mb-10" aria-labelledby="bracket-heading">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2
          id="bracket-heading"
          className="font-display text-xl font-bold text-titos-white flex items-center gap-2"
        >
          <Trophy className="w-5 h-5 text-titos-gold" aria-hidden="true" />
          Playoff Brackets
        </h2>
        {ordered.length > 1 && (
          <div
            role="tablist"
            aria-label="Select division"
            className="inline-flex items-center gap-1 p-1 rounded-full bg-titos-elevated border border-titos-border/40"
          >
            {ordered.map(b => {
              const isGold = b.division === DIVISION_GOLD
              const isActive = b.division === activeDivision
              const Icon = isGold ? Trophy : Medal
              return (
                <button
                  key={b.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveDivision(b.division)}
                  className={cn(
                    'inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold',
                    isActive
                      ? (isGold
                        ? 'bg-titos-gold text-titos-black'
                        : 'bg-titos-white text-titos-surface')
                      : 'text-titos-gray-400 hover:text-titos-white',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  {b.division}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="card-flat rounded-xl overflow-hidden">
        {/* Header band — division title + champion/next-up story */}
        <BracketHeader bracket={active} champion={champion} nextUp={nextUp} />

        {/* Tree body */}
        <div className="p-3 sm:p-4 border-t border-titos-border/30">
          <BracketTree matches={active.matches} />
        </div>
      </div>
    </section>
  )
}

function BracketHeader({ bracket, champion, nextUp }) {
  const isGold = bracket.division === DIVISION_GOLD
  const Icon = isGold ? Trophy : Medal
  const accent = isGold ? 'text-titos-gold' : 'text-titos-gray-200'
  const ringBg = isGold ? 'bg-titos-gold/5' : 'bg-titos-elevated/30'

  return (
    <header
      className={cn('px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-4 flex-wrap', ringBg)}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={cn('w-5 h-5 shrink-0', accent)} aria-hidden="true" />
        <div className="min-w-0">
          <div className={cn('font-display font-black text-base sm:text-lg leading-none', accent)}>
            {bracket.division} Division
          </div>
          <div className="text-[11px] text-titos-gray-500 uppercase tracking-wider mt-1">
            {bracket.matches.length} matches
          </div>
        </div>
      </div>

      <div className="ml-auto min-w-0 max-w-full">
        {champion ? (
          <ChampionCallout team={champion} />
        ) : nextUp.length > 0 ? (
          // Two courts play the same time slot in parallel — stack both
          // (or all live) cards so neither gets swept off the spotlight.
          <div className="flex flex-col sm:flex-row gap-2 items-stretch">
            {nextUp.map((m) => (
              <NextUpCallout key={m.id} match={m} />
            ))}
          </div>
        ) : null}
      </div>
    </header>
  )
}

function ChampionCallout({ team }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-titos-gold/20 border border-titos-gold/40 text-titos-gold"
      role="status"
    >
      <Crown className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className="text-[10px] font-black uppercase tracking-wider opacity-80">Champion</span>
      <span className="font-bold text-sm truncate max-w-[10rem] sm:max-w-none">{cleanTeamName(team.name)}</span>
    </div>
  )
}

function NextUpCallout({ match }) {
  const isLive = match.status === MATCH_STATUS.LIVE
  const home = cleanTeamName(match.homeTeam?.name) || match.homeSeedLabel || 'TBD'
  const away = cleanTeamName(match.awayTeam?.name) || match.awaySeedLabel || 'TBD'
  // Time intentionally omitted from the spotlight — the schedule runs in
  // fixed slots and the concurrent-pair stacking already signals "both
  // start together", so a repeated timestamp is noise. Court + ref are
  // the two facts a player actually needs: where and who's on the whistle.
  const court = match.courtNumber ? `Court ${match.courtNumber}` : null
  const ref = cleanTeamName(match.refTeam?.name) || null
  const round = ROUND_LABEL[match.bracketRound] || 'Match'

  return (
    <div
      className={cn(
        'inline-flex flex-col gap-1 px-3 py-2 rounded-lg border',
        isLive
          ? 'bg-status-live/10 border-status-live/30'
          : 'bg-titos-elevated/60 border-titos-border/40',
      )}
    >
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider">
        {isLive ? (
          <LiveIndicator />
        ) : (
          <span className="text-titos-gray-500">Up next</span>
        )}
        <span className="text-titos-gray-600" aria-hidden="true">·</span>
        <span className="text-titos-gray-400">{round}</span>
      </div>
      <div className="text-sm text-titos-white font-semibold truncate max-w-[16rem] sm:max-w-xs">
        {home} <span className="text-titos-gray-500 font-normal">vs</span> {away}
      </div>
      <div className="flex items-center gap-3 text-[11px] text-titos-gray-400 flex-wrap">
        {court && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" aria-hidden="true" />{court}
          </span>
        )}
        {ref && (
          <span className="inline-flex items-center gap-1">
            <UserCheck className="w-3 h-3" aria-hidden="true" />Ref: {ref}
          </span>
        )}
      </div>
    </div>
  )
}

export default function TournamentHubClient({ slug, initialData }) {
  return (
    <LivePoller slug={slug} initialData={initialData}>
      {({ tournament }) => <HubBody slug={slug} tournament={tournament} />}
    </LivePoller>
  )
}
