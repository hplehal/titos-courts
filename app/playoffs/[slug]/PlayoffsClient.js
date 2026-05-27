'use client'

// Public league-playoff bracket. Renders the 4 division brackets in a
// vertical stack (each a compact 3-column tree: QF → SF → F). Refreshes
// the data layer every 30s while the page is open so live score updates
// surface without a manual refresh.

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Crown, Trophy } from 'lucide-react'

const ROUND_COLUMNS = [
  { round: 1, label: 'Quarterfinals', slots: 2 },
  { round: 2, label: 'Semifinals',    slots: 2 },
  { round: 3, label: 'Final',          slots: 1 },
]

const DIVISION_ACCENT = {
  Diamond:  { color: 'text-div-diamond',  ring: 'ring-div-diamond/30',  bg: 'bg-div-diamond/[0.04]' },
  Platinum: { color: 'text-div-platinum', ring: 'ring-div-platinum/30', bg: 'bg-div-platinum/[0.04]' },
  Gold:     { color: 'text-div-gold',     ring: 'ring-div-gold/30',     bg: 'bg-div-gold/[0.04]' },
  Silver:   { color: 'text-div-silver',   ring: 'ring-div-silver/30',   bg: 'bg-div-silver/[0.04]' },
}

function setScoreLine(scores) {
  if (!scores?.length) return null
  return scores.map(s => `${s.homeScore}–${s.awayScore}`).join(' · ')
}

function setWinsTally(scores) {
  let h = 0, a = 0
  for (const s of scores || []) {
    if (s.homeScore > s.awayScore) h++
    else if (s.awayScore > s.homeScore) a++
  }
  return { h, a }
}

function MatchCard({ match }) {
  const home = match.homeTeam?.name || match.homeSeedLabel || 'TBD'
  const away = match.awayTeam?.name || match.awaySeedLabel || 'TBD'
  const homeWon = match.status === 'completed' && match.winnerId && match.winnerId === match.homeTeamId
  const awayWon = match.status === 'completed' && match.winnerId && match.winnerId === match.awayTeamId
  const { h, a } = setWinsTally(match.scores)
  const setLine = setScoreLine(match.scores)
  const time = match.scheduledTime
    ? new Date(match.scheduledTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null

  return (
    <article
      className={cn(
        'rounded-lg bg-titos-card ring-1 ring-titos-border/40 overflow-hidden',
        match.status === 'live' && 'ring-status-live/40 shadow-lg shadow-status-live/10',
        match.status === 'completed' && 'opacity-95',
      )}
      data-status={match.status}
    >
      <div className="px-3 py-1.5 flex items-center justify-between gap-1 border-b border-titos-border/30 bg-titos-elevated/40 text-[10px] uppercase tracking-wider font-bold whitespace-nowrap">
        <span className="text-titos-gray-400 truncate">
          {time ? time : '—'}
          {match.courtNumber ? ` · C${match.courtNumber}` : ''}
        </span>
        <span className={cn(
          'flex-shrink-0',
          match.status === 'live' && 'text-status-live',
          match.status === 'completed' && 'text-status-success',
          match.status === 'scheduled' && 'text-titos-gray-500',
        )}>
          {match.status === 'completed' ? 'Final' : match.status === 'scheduled' ? 'Up next' : match.status}
        </span>
      </div>
      <div className="divide-y divide-titos-border/20">
        <TeamRow name={home} setWins={h} winner={homeWon} />
        <TeamRow name={away} setWins={a} winner={awayWon} />
      </div>
      {setLine && (
        <div className="px-3 py-1 text-[10px] font-mono text-titos-gray-500 border-t border-titos-border/20">
          {setLine}
        </div>
      )}
    </article>
  )
}

function TeamRow({ name, setWins, winner }) {
  return (
    <div className={cn(
      'flex items-center justify-between gap-2 px-3 py-2',
      winner ? 'bg-titos-gold/10' : '',
    )}>
      <span className={cn(
        'text-sm font-semibold truncate flex items-center gap-1.5',
        winner ? 'text-titos-gold' : 'text-titos-white',
      )}>
        {winner && <Crown className="w-3 h-3 text-titos-gold flex-shrink-0" aria-hidden="true" />}
        {name}
      </span>
      <span className={cn(
        'font-display text-base font-black tabular-nums',
        winner ? 'text-titos-gold' : 'text-titos-gray-400',
      )}>
        {setWins}
      </span>
    </div>
  )
}

function DivisionBracket({ division }) {
  const accent = DIVISION_ACCENT[division.name] || DIVISION_ACCENT.Diamond
  const byRound = {
    1: division.matches.filter(m => m.roundNumber === 1).sort((a, b) => a.gameOrder - b.gameOrder),
    2: division.matches.filter(m => m.roundNumber === 2).sort((a, b) => a.gameOrder - b.gameOrder),
    3: division.matches.filter(m => m.roundNumber === 3),
  }

  return (
    <section
      aria-labelledby={`div-${division.tier}-heading`}
      className={cn('rounded-2xl ring-1 p-4 sm:p-5 mb-8', accent.ring, accent.bg)}
    >
      <header className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2
          id={`div-${division.tier}-heading`}
          className={cn('font-display text-2xl sm:text-3xl font-black tracking-tight', accent.color)}
        >
          {division.name}
        </h2>
        <span className="text-xs uppercase tracking-wider font-bold text-titos-gray-400 flex items-center gap-1.5">
          {division.court && `Court ${division.court}`}
        </span>
      </header>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {ROUND_COLUMNS.map(col => (
          <div key={col.round} className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider font-bold text-titos-gray-500 block mb-2">
              {col.label}
            </span>
            <div className={cn(
              'flex flex-col gap-3',
              // Center the SF column visually so the bracket has a tournament feel
              col.round === 2 && 'justify-around min-h-[200px]',
              col.round === 3 && 'justify-center min-h-[200px]',
            )}>
              {byRound[col.round]?.length > 0 ? byRound[col.round].map(m => (
                <MatchCard key={m.id} match={m} />
              )) : Array.from({ length: col.slots }).map((_, i) => (
                <article key={i} className="rounded-lg bg-titos-elevated/30 ring-1 ring-titos-border/20 px-3 py-4 text-center text-xs text-titos-gray-500">
                  TBD
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function PlayoffsClient({ slug, initialData }) {
  const [data, setData] = useState(initialData)

  // Soft poll every 30s for live score updates. Stop when the tab is hidden.
  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      if (cancelled || document.visibilityState !== 'visible') return
      try {
        const res = await fetch(`/api/leagues/${slug}/playoffs`, { cache: 'no-store' })
        if (!res.ok) return
        const fresh = await res.json()
        if (!cancelled) setData(fresh)
      } catch {}
    }
    const id = setInterval(tick, 30_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [slug])

  return (
    <div>
      {data.divisions.map(d => (
        <DivisionBracket key={d.tier} division={d} />
      ))}
    </div>
  )
}
