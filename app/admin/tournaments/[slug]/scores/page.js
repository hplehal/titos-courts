'use client'

// Admin scoresheet for pool play.
//
// Layout mirrors how the tournament actually runs on the day:
// ROUNDS (time slots) are the top-level axis; within each round, matches
// are laid out horizontally one-per-court. A scorer sitting at the table
// can find "Round 3 · Court 2" in one glance instead of paging through
// whatever pool happens to be playing on that court.
//
// The "Now" banner at the top derives the current round from the clock
// against each match's scheduledTime. Clicking "Jump to current round"
// scrolls the matching section into view. Rounds where every match is
// FINAL collapse by default; the active + upcoming rounds stay open.

import { useCallback, useEffect, useMemo, useRef, useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, RefreshCw, Clock, MapPin, ArrowDown } from 'lucide-react'
import AuthGate from '@/components/admin/AuthGate'
import { adminFetch } from '@/lib/adminFetch'
import ScoreEntry from '@/components/tournament/ScoreEntry'
import { cn } from '@/lib/utils'
import { refSeedForRound } from '@/lib/tournament/refRotation'

function fmtTime(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }
  catch { return '—' }
}

// Group every pool match by its roundNumber, then by courtNumber within the
// round. Also return a poolTeams lookup so ScoreEntry can render ref info.
function buildRounds(tournament) {
  if (!tournament?.pools) return { rounds: [], poolTeamsById: {} }
  const poolTeamsById = {}
  const poolNameById = {}
  const byRound = new Map()

  for (const pool of tournament.pools) {
    poolTeamsById[pool.id] = pool.teams || []
    poolNameById[pool.id] = pool.name
    for (const m of pool.matches || []) {
      const r = m.roundNumber ?? 0
      if (!byRound.has(r)) byRound.set(r, [])
      byRound.get(r).push({ ...m, poolName: pool.name })
    }
  }

  const rounds = [...byRound.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([roundNumber, matches]) => {
      const sorted = matches.slice().sort((a, b) => {
        const ca = a.courtNumber ?? 99
        const cb = b.courtNumber ?? 99
        if (ca !== cb) return ca - cb
        return (a.gameOrder ?? 0) - (b.gameOrder ?? 0)
      })
      const firstScheduled = sorted.find(m => m.scheduledTime)?.scheduledTime || null
      const allFinal = sorted.length > 0 && sorted.every(m => m.status === 'completed')
      const anyLive = sorted.some(m => m.status === 'live')
      return { roundNumber, matches: sorted, firstScheduled, allFinal, anyLive }
    })

  return { rounds, poolTeamsById }
}

// Decide which round is "current". Priority: a round with a live match wins.
// Otherwise, pick the latest round whose scheduledTime is <= now. If nothing
// has started yet, pick the first round.
function pickCurrentRound(rounds, now = Date.now()) {
  if (!rounds.length) return null
  const live = rounds.find(r => r.anyLive)
  if (live) return live.roundNumber
  let best = rounds[0].roundNumber
  for (const r of rounds) {
    if (r.firstScheduled && new Date(r.firstScheduled).getTime() <= now) {
      best = r.roundNumber
    }
  }
  return best
}

function Inner({ slug }) {
  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const roundRefs = useRef({})

  const load = useCallback(async (opts = {}) => {
    if (opts.silent) setRefreshing(true); else setLoading(true)
    try {
      const res = await adminFetch(`/api/admin/tournaments/${slug}`)
      if (res.ok) {
        const data = await res.json()
        const pub = await fetch(`/api/tournaments/${slug}`)
        if (pub.ok) setTournament(await pub.json())
        else setTournament(data.tournament)
      }
    } catch { /* non-fatal */ }
    setLoading(false); setRefreshing(false)
  }, [slug])

  useEffect(() => { load() }, [load])

  // Update "now" every 30s so the current-round marker stays accurate.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const { rounds, poolTeamsById } = useMemo(() => buildRounds(tournament), [tournament])
  const currentRound = useMemo(() => pickCurrentRound(rounds, now), [rounds, now])

  const jumpToCurrent = () => {
    if (currentRound == null) return
    const el = roundRefs.current[currentRound]
    if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading) {
    return (
      <div className="py-20 text-center" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 text-titos-gold mx-auto animate-spin" aria-hidden="true" />
        <span className="sr-only">Loading scoresheet…</span>
      </div>
    )
  }
  if (!tournament) return <p className="p-8 text-titos-gray-400">Tournament not found.</p>

  const currentRoundObj = rounds.find(r => r.roundNumber === currentRound)
  const currentTime = currentRoundObj?.firstScheduled

  return (
    <div className="py-6 px-4">
      {/* Skip-link for keyboard users — jumps past the header into scoring. */}
      <a
        href="#scoresheet"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3 focus:py-2 focus:bg-titos-gold focus:text-titos-surface focus:rounded-md focus:font-bold"
      >
        Skip to scoresheet
      </a>

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/admin/tournaments/${slug}`}
              aria-label="Back to tournament admin"
              className="text-titos-gray-400 hover:text-titos-gold transition-colors cursor-pointer p-2 -ml-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-titos-gray-500">
                Scoresheet
              </p>
              <h1 className="font-display text-xl font-black text-titos-white truncate">
                {tournament.name}
              </h1>
            </div>
          </div>
          <button
            onClick={() => load({ silent: true })}
            disabled={refreshing}
            aria-label="Refresh scoresheet"
            className="inline-flex items-center justify-center gap-1.5 rounded-md px-3 min-h-[44px] text-titos-gray-300 hover:text-titos-white bg-titos-elevated border border-titos-border hover:border-titos-gold/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold disabled:opacity-50 text-sm"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {/* Now banner — at-a-glance "which round am I scoring right now?" */}
        {rounds.length > 0 && currentRoundObj && (
          <div
            className="mb-6 rounded-xl border border-titos-gold/40 bg-titos-gold/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-titos-gold/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-titos-gold shrink-0">
                <span className={cn('w-1.5 h-1.5 rounded-full bg-titos-gold', currentRoundObj.anyLive && 'animate-pulse')} />
                {currentRoundObj.anyLive ? 'Live' : 'Now'}
              </span>
              <div className="min-w-0">
                <p className="text-titos-white text-base font-semibold leading-tight">
                  Round {currentRoundObj.roundNumber}
                  {currentTime && (
                    <span className="text-titos-gray-400 font-normal">
                      {' '}· {fmtTime(currentTime)}
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-titos-gray-400">
                  {currentRoundObj.matches.length} courts in play
                  {refSeedForRound(currentRoundObj.roundNumber) != null && (
                    <> · <span className="text-titos-gold font-semibold">seed {refSeedForRound(currentRoundObj.roundNumber)} refs</span></>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={jumpToCurrent}
              aria-label={`Jump to round ${currentRoundObj.roundNumber}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-titos-gold text-titos-surface font-semibold text-sm px-4 min-h-[44px] hover:brightness-95 transition-[filter] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold focus-visible:ring-offset-2 focus-visible:ring-offset-titos-surface"
            >
              <ArrowDown className="w-4 h-4" aria-hidden="true" />
              Jump to current
            </button>
          </div>
        )}

        {(!rounds.length) && (
          <p className="text-titos-gray-500">
            No matches scheduled yet. Generate the schedule from the tournament admin page first.
          </p>
        )}

        <div id="scoresheet" className="space-y-5">
          {rounds.map((r) => {
            const isCurrent = r.roundNumber === currentRound
            const defaultOpen = !r.allFinal || isCurrent
            return (
              <RoundSection
                key={r.roundNumber}
                round={r}
                isCurrent={isCurrent}
                defaultOpen={defaultOpen}
                poolTeamsById={poolTeamsById}
                slug={slug}
                onSaved={() => load({ silent: true })}
                sectionRef={(el) => { roundRefs.current[r.roundNumber] = el }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function RoundSection({ round, isCurrent, defaultOpen, poolTeamsById, slug, onSaved, sectionRef }) {
  const [open, setOpen] = useState(defaultOpen)
  // If live kicks in later, keep the section open.
  useEffect(() => {
    if (isCurrent) setOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCurrent])

  const headingId = `round-${round.roundNumber}-heading`
  const bodyId = `round-${round.roundNumber}-body`

  const finalCount = round.matches.filter(m => m.status === 'completed').length

  return (
    <section
      ref={sectionRef}
      aria-labelledby={headingId}
      className={cn(
        'rounded-xl border overflow-hidden transition-colors',
        isCurrent
          ? 'border-titos-gold/50 bg-titos-gold/5'
          : round.allFinal
            ? 'border-titos-border/40 bg-titos-elevated/20'
            : 'border-titos-border bg-titos-elevated/40',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="w-full flex items-center justify-between gap-3 px-4 md:px-5 py-3 text-left hover:bg-titos-elevated/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            'flex items-center justify-center rounded-lg w-10 h-10 font-display font-black text-sm shrink-0',
            isCurrent ? 'bg-titos-gold text-titos-surface' : 'bg-titos-surface text-titos-gray-300 border border-titos-border',
          )}>
            R{round.roundNumber}
          </div>
          <div className="min-w-0">
            <h2 id={headingId} className="font-display text-base md:text-lg font-bold text-titos-white leading-tight">
              Round {round.roundNumber}
              {round.firstScheduled && (
                <span className="font-normal text-titos-gray-400">
                  {' '}· {fmtTime(round.firstScheduled)}
                </span>
              )}
              {refSeedForRound(round.roundNumber) != null && (
                <span className="ml-2 inline-flex items-center rounded bg-titos-gold/10 border border-titos-gold/30 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-titos-gold align-middle">
                  Seed {refSeedForRound(round.roundNumber)} refs
                </span>
              )}
            </h2>
            <p className="text-[11px] text-titos-gray-500">
              {round.matches.length} court{round.matches.length === 1 ? '' : 's'} · {finalCount}/{round.matches.length} final
              {round.anyLive && <span className="text-status-live font-semibold"> · LIVE</span>}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-titos-gray-500 shrink-0">
          {open ? 'Hide' : 'Show'}
        </span>
      </button>

      {open && (
        <div id={bodyId} className="p-3 md:p-4 border-t border-titos-border/30">
          {/* One column per court on desktop; stacks on mobile.
              Grid auto-sizes so 3- or 6-court tournaments also look right. */}
          <div className={cn(
            'grid gap-3',
            round.matches.length >= 4 ? 'md:grid-cols-2 xl:grid-cols-4'
              : round.matches.length === 3 ? 'md:grid-cols-3'
              : round.matches.length === 2 ? 'md:grid-cols-2' : '',
          )}>
            {round.matches.map(m => (
              <CourtColumn
                key={m.id}
                match={m}
                poolTeams={poolTeamsById[m.poolId] || []}
                saveUrl={`/api/admin/tournaments/${slug}/matches/${m.id}/scores`}
                onSaved={onSaved}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function CourtColumn({ match, poolTeams, saveUrl, onSaved }) {
  return (
    <div
      className="rounded-lg bg-titos-surface border border-titos-border/50"
      role="group"
      aria-label={`Court ${match.courtNumber ?? 'TBD'} — ${match.poolName}`}
    >
      <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-titos-border/30">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="inline-flex items-center gap-1 rounded bg-titos-gold/10 border border-titos-gold/30 px-2 py-0.5 text-[11px] font-bold text-titos-gold shrink-0">
            <MapPin className="w-3 h-3" aria-hidden="true" />
            Court {match.courtNumber ?? '—'}
          </span>
          <span className="text-[11px] text-titos-gray-400 truncate min-w-0">{match.poolName}</span>
        </div>
        {match.scheduledTime && (
          <span className="inline-flex items-center gap-1 text-[11px] text-titos-gray-500 tabular-nums shrink-0">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {fmtTime(match.scheduledTime)}
          </span>
        )}
      </header>
      <div className="p-2">
        <ScoreEntry
          match={match}
          poolTeams={poolTeams}
          saveUrl={saveUrl}
          onSaved={onSaved}
        />
      </div>
    </div>
  )
}

export default function AdminScoresPage({ params }) {
  const { slug } = use(params)
  return <AuthGate><Inner slug={slug} /></AuthGate>
}
