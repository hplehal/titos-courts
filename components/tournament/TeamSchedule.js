'use client'

// Player-centric strip for the tournament hub. When a player picks their
// team from the dropdown at the top of the page, this component renders a
// single card summarising everything THEY need to know:
//   1. Their 3 matches (court, time, opponent, current score, status)
//   2. The rounds they are reffing (based on 4-team canonical rotation —
//      when their team is NOT in a match, they're the lowest-seeded resting
//      team → lead ref)
//
// Why this exists: the full pool grid works as a scoreboard for spectators,
// but a player showing up at the venue just wants "where do I play next and
// am I on the whistle anywhere?" — this pulls those answers to the top.

import { MapPin, Clock, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { refAssignmentForMatch } from '@/lib/tournament/refRotation'
import { tallySetsWon } from '@/lib/tournament/computeMatchStatus'
import { cleanTeamName } from '@/lib/tournament/displayName'

function fmtTime(date) {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function statusPill(status) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-status-live">
        <span className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" />
        Live
      </span>
    )
  }
  if (status === 'completed') {
    return (
      <span className="text-[10px] font-bold uppercase tracking-wider text-titos-gray-500">
        Final
      </span>
    )
  }
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider text-titos-gray-600">
      Up next
    </span>
  )
}

function setSummary(match) {
  const scores = (match.scores || []).slice().sort((a, b) => (a.setNumber ?? 0) - (b.setNumber ?? 0))
  if (!scores.length) return null
  return scores.map((s) => `${s.homeScore}–${s.awayScore}`).join(', ')
}

function computeResultText(match, myTeamId) {
  const scores = match.scores || []
  if (!scores.length) return null
  // Only sets that are ACTUALLY won count. A 20–18 mid-set lead doesn't
  // become "You lead 1–0" — it just doesn't score yet. Pool mode: target
  // 25 cap 27. Bracket mode auto-picks 15/17 for the deciding set.
  const mode = match.poolId ? 'pool' : 'bracket'
  const { setsHome, setsAway } = tallySetsWon(scores, mode)
  const amHome = match.homeTeamId === myTeamId
  const mine = amHome ? setsHome : setsAway
  const theirs = amHome ? setsAway : setsHome
  if (mine === 0 && theirs === 0) return null
  if (match.status === 'completed') {
    if (mine > theirs) return { text: `Won ${mine}–${theirs}`, tone: 'win' }
    if (mine < theirs) return { text: `Lost ${mine}–${theirs}`, tone: 'loss' }
    return { text: `Tied ${mine}–${theirs}`, tone: 'neutral' }
  }
  // live / in progress — show set lead
  if (mine > theirs) return { text: `You lead ${mine}–${theirs}`, tone: 'win' }
  if (mine < theirs) return { text: `Trailing ${mine}–${theirs}`, tone: 'loss' }
  return { text: `Tied ${mine}–${theirs}`, tone: 'neutral' }
}

export default function TeamSchedule({ team, pool }) {
  if (!team || !pool) return null

  const teamId = team.id
  const poolTeams = pool.teams || []
  const allMatches = (pool.matches || []).slice().sort((a, b) => {
    const ra = a.roundNumber ?? 0
    const rb = b.roundNumber ?? 0
    if (ra !== rb) return ra - rb
    return (a.gameOrder ?? 0) - (b.gameOrder ?? 0)
  })

  const myMatches = allMatches.filter(
    (m) => m.homeTeamId === teamId || m.awayTeamId === teamId,
  )
  const refDuties = allMatches.filter((m) => {
    if (m.homeTeamId === teamId || m.awayTeamId === teamId) return false
    const refs = refAssignmentForMatch(m, poolTeams)
    return refs.ref?.id === teamId
  })

  const nextMatch =
    myMatches.find((m) => m.status === 'live') ||
    myMatches.find((m) => m.status === 'scheduled')

  return (
    <section
      className="mb-8 card-flat rounded-2xl overflow-hidden border border-titos-gold/30"
      aria-label={`Schedule for ${cleanTeamName(team.name)}`}
    >
      <header className="px-5 py-3 bg-titos-gold/10 border-b border-titos-gold/20 flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-titos-gold">Your team</p>
          <h2 className="font-display text-xl font-black text-titos-white leading-tight">
            {cleanTeamName(team.name)}
          </h2>
        </div>
        <div className="text-[11px] text-titos-gray-400">
          {pool.name}
          {team.seed ? <> · Seed {team.seed}</> : null}
        </div>
      </header>

      {/* Next-up highlight — the single question "when's my next game?" */}
      {nextMatch && (
        <div className="px-5 py-4 border-b border-titos-border/30">
          <p className="text-[10px] font-bold uppercase tracking-wider text-titos-gray-500 mb-1">
            {nextMatch.status === 'live' ? 'On court now' : 'Next up'}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-titos-white text-base font-semibold">
              vs{' '}
              {(nextMatch.homeTeamId === teamId
                ? cleanTeamName(nextMatch.awayTeam?.name)
                : cleanTeamName(nextMatch.homeTeam?.name)) || 'TBD'}
            </span>
            <span className="inline-flex items-center gap-1 text-sm text-titos-gray-300">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {fmtTime(nextMatch.scheduledTime)}
            </span>
            <span className="inline-flex items-center gap-1 text-sm text-titos-gray-300">
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
              Court {nextMatch.courtNumber ?? '—'}
            </span>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-titos-border/30">
        {/* Matches */}
        <div className="p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-titos-gray-400 mb-3">
            Your matches ({myMatches.length})
          </h3>
          <ul className="space-y-2.5">
            {myMatches.map((m) => {
              const opp =
                (m.homeTeamId === teamId
                  ? cleanTeamName(m.awayTeam?.name)
                  : cleanTeamName(m.homeTeam?.name)) || 'TBD'
              const result = computeResultText(m, teamId)
              const setsText = setSummary(m)
              const isLive = m.status === 'live'
              return (
                <li
                  key={m.id}
                  className={cn(
                    'rounded-lg border px-3 py-2.5 transition-colors',
                    isLive
                      ? 'border-status-live/40 bg-status-live/5'
                      : 'border-titos-border/40 bg-titos-elevated/40',
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    {statusPill(m.status)}
                    <span className="text-[11px] text-titos-gray-500 tabular-nums">
                      {fmtTime(m.scheduledTime)} · Court {m.courtNumber ?? '—'}
                    </span>
                  </div>
                  <div className="text-sm text-titos-white font-medium truncate">
                    vs {opp}
                  </div>
                  {setsText && (
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-titos-gray-400 tabular-nums">
                      <span>{setsText}</span>
                      {result && (
                        <span
                          className={cn(
                            'font-semibold',
                            result.tone === 'win' && 'text-titos-gold',
                            result.tone === 'loss' && 'text-titos-gray-500',
                          )}
                        >
                          · {result.text}
                        </span>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
            {myMatches.length === 0 && (
              <li className="text-sm text-titos-gray-500">No matches scheduled yet.</li>
            )}
          </ul>
        </div>

        {/* Ref duties */}
        <div className="p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-titos-gray-400 mb-3 inline-flex items-center gap-1.5">
            <Mic className="w-3 h-3" aria-hidden="true" />
            Your ref duties ({refDuties.length})
          </h3>
          <ul className="space-y-2.5">
            {refDuties.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-titos-border/40 bg-titos-elevated/40 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-titos-gold">
                    You&apos;re reffing
                  </span>
                  <span className="text-[11px] text-titos-gray-500 tabular-nums">
                    {fmtTime(m.scheduledTime)} · Court {m.courtNumber ?? '—'}
                  </span>
                </div>
                <div className="text-sm text-titos-white font-medium truncate">
                  {cleanTeamName(m.homeTeam?.name) || 'TBD'}{' '}
                  <span className="text-titos-gray-500">vs</span>{' '}
                  {cleanTeamName(m.awayTeam?.name) || 'TBD'}
                </div>
              </li>
            ))}
            {refDuties.length === 0 && (
              <li className="text-sm text-titos-gray-500">No ref duties this pool.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  )
}
