'use client'

// Client wrapper for the tournament hub. Takes SSR'd initialData as fallback
// and wraps in LivePoller so the spotlight + standings + match cards refresh
// on a 10s interval. The public /api/tournaments/[slug] endpoint returns the
// raw tournament structure; we re-compute standings client-side via the same
// pure function that powers the server render for consistency.

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import LivePoller from '@/components/tournament/LivePoller'
import LiveIndicator from '@/components/tournament/LiveIndicator'
import LiveMatchCard from '@/components/tournament/LiveMatchCard'
import MatchCard from '@/components/tournament/MatchCard'
import StandingsTable from '@/components/tournament/StandingsTable'
import TeamPicker from '@/components/tournament/TeamPicker'
import TeamSchedule from '@/components/tournament/TeamSchedule'
import { computeStandingsFromMatches } from '@/lib/tournament/calculateStandings'

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
                {pool.matches?.length > 0 && (
                  <div className="space-y-1.5">
                    {pool.matches.map(m => (
                      <MatchCard
                        key={m.id}
                        match={m}
                        variant="pool"
                        poolTeams={pool.teams}
                      />
                    ))}
                  </div>
                )}
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

export default function TournamentHubClient({ slug, initialData }) {
  return (
    <LivePoller slug={slug} initialData={initialData}>
      {({ tournament }) => <HubBody slug={slug} tournament={tournament} />}
    </LivePoller>
  )
}
