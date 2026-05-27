'use client'

// Public league-playoff bracket. Renders the 4 division brackets in a
// vertical stack (each a compact 3-column tree: QF → SF → F). Refreshes
// the data layer every 30s while the page is open so live score updates
// surface without a manual refresh.

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Crown, Trophy, Calendar } from 'lucide-react'

// Round → week mapping. Drives both the legend strip and per-column
// 'WEEK N' badges. Keep aligned with the playoff generator (W10 = QFs,
// W11 = SFs + Final).
const ROUND_COLUMNS = [
  { round: 1, label: 'Quarterfinals', short: 'QF', slots: 2, week: 10 },
  { round: 2, label: 'Semifinals',    short: 'SF', slots: 2, week: 11 },
  { round: 3, label: 'Final',         short: 'F',  slots: 1, week: 11 },
]

function formatWeekDate(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  } catch { return null }
}

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

function DivisionBracket({ division, weeks }) {
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

      {/* The bracket grid. We wrap the W11 columns in a shaded band so the
          'Week 10 → Week 11' transition is visually obvious — the QF
          column sits in the base background, SF + Final sit in a slightly
          tinted band with a left border. */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 relative">
        {ROUND_COLUMNS.map((col, idx) => {
          const isW11Start = col.week === 11 && ROUND_COLUMNS[idx - 1]?.week !== 11
          const weekRow = weeks?.[col.week]
          return (
            <div
              key={col.round}
              className={cn(
                'min-w-0 rounded-lg',
                col.week === 11 && 'bg-titos-elevated/20 -mx-1 px-2 sm:px-2.5 pt-1 pb-2',
                isW11Start && 'border-l-2 border-titos-gold/30 sm:border-l-2',
              )}
            >
              {/* Column header: explicit week badge + round name + date */}
              <div className="mb-2">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span
                    className={cn(
                      'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider leading-none',
                      col.week === 10
                        ? 'bg-titos-gold/20 text-titos-gold'
                        : 'bg-titos-gold/35 text-titos-gold ring-1 ring-titos-gold/40',
                    )}
                  >
                    Week {col.week}
                  </span>
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-titos-gray-300 truncate">
                    {col.label}
                  </span>
                </div>
                {weekRow?.date && (
                  <span className="block text-[9px] sm:text-[10px] text-titos-gray-500 mt-0.5 truncate">
                    {formatWeekDate(weekRow.date)}
                  </span>
                )}
              </div>

              <div className={cn(
                'flex flex-col gap-3',
                // Center the SF column vertically so the bracket has the
                // tournament 'feeder lines' feel without drawing SVG lines.
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
          )
        })}
      </div>
    </section>
  )
}

function WeekLegend({ weeks }) {
  // Mini "what happens when" strip. Names each week explicitly and pairs
  // it with the rounds it hosts, so even a brand-new visitor can answer
  // 'which matches are tomorrow night?' without scrolling each bracket.
  const w10 = weeks?.[10]
  const w11 = weeks?.[11]
  return (
    <div
      role="group"
      aria-label="Playoff schedule legend"
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6"
    >
      <div className="rounded-xl bg-titos-card ring-1 ring-titos-border/40 p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-titos-gold/15 text-titos-gold flex items-center justify-center flex-shrink-0">
          <Calendar className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-display text-base font-black text-titos-white">Week 10</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-titos-gold bg-titos-gold/15 px-1.5 py-0.5 rounded">QFs</span>
          </div>
          <p className="text-titos-gray-300 text-xs sm:text-sm mt-0.5">
            <span className="font-mono">3 vs 6</span> · <span className="font-mono">4 vs 5</span> per division
          </p>
          <p className="text-titos-gray-500 text-[11px] mt-1">
            {w10?.date ? formatWeekDate(w10.date) : 'Date TBD'} · 10:00 PM / 11:00 PM
          </p>
        </div>
      </div>
      <div className="rounded-xl bg-titos-card ring-1 ring-titos-gold/30 p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-titos-gold/25 text-titos-gold flex items-center justify-center flex-shrink-0">
          <Trophy className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-display text-base font-black text-titos-white">Week 11</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-titos-gold bg-titos-gold/15 px-1.5 py-0.5 rounded">SFs + Final</span>
          </div>
          <p className="text-titos-gray-300 text-xs sm:text-sm mt-0.5">
            Top-2 reseed · Championship <span className="font-mono">11 PM – 12 AM</span>
          </p>
          <p className="text-titos-gray-500 text-[11px] mt-1">
            {w11?.date ? formatWeekDate(w11.date) : 'Date TBD'} · SFs 10:00 / 10:30 PM
          </p>
        </div>
      </div>
    </div>
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
      <WeekLegend weeks={data.weeks} />
      {data.divisions.map(d => (
        <DivisionBracket key={d.tier} division={d} weeks={data.weeks} />
      ))}
    </div>
  )
}
