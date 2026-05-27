'use client'

// Public league-playoff bracket. Renders the 4 division brackets in a
// vertical stack (each a compact 3-column tree: QF → SF → F). Refreshes
// the data layer every 30s while the page is open so live score updates
// surface without a manual refresh.

import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Crown, Trophy, Calendar } from 'lucide-react'
import { useMyTeam } from '@/lib/hooks/useMyTeam'

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
      <div className="px-3 py-2 sm:py-1.5 flex items-center justify-between gap-2 border-b border-titos-border/30 bg-titos-elevated/40 text-[11px] sm:text-[10px] uppercase tracking-wider font-bold whitespace-nowrap">
        <span className="text-titos-gray-400 truncate">
          {time || '—'}
          {' · '}
          {match.courtNumber
            ? <>Court&nbsp;{match.courtNumber}</>
            : <span className="text-titos-gold/80">Court&nbsp;TBD</span>}
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
      'flex items-center justify-between gap-2 px-3 sm:px-3 py-2.5 sm:py-2 min-h-[44px]',
      winner ? 'bg-titos-gold/10' : '',
    )}>
      <span className={cn(
        // Mobile: wrap long names to 2 lines so 'Tacos & Timbits' / 'Ball
        // Me Maybe' don't get clipped. sm+: keep single-line + truncate so
        // the bracket tree stays compact.
        'text-sm sm:text-sm font-semibold flex items-start gap-1.5 min-w-0 leading-tight sm:truncate',
        winner ? 'text-titos-gold' : 'text-titos-white',
      )}>
        {winner && <Crown className="w-3 h-3 text-titos-gold flex-shrink-0 mt-1 sm:mt-0" aria-hidden="true" />}
        <span className="break-words sm:truncate">{name}</span>
      </span>
      <span className={cn(
        'font-display text-lg sm:text-base font-black tabular-nums flex-shrink-0',
        winner ? 'text-titos-gold' : 'text-titos-gray-400',
      )}>
        {setWins}
      </span>
    </div>
  )
}

function DivisionBracket({ division, weeks, isMyDivision }) {
  const accent = DIVISION_ACCENT[division.name] || DIVISION_ACCENT.Diamond
  const byRound = {
    1: division.matches.filter(m => m.roundNumber === 1).sort((a, b) => a.gameOrder - b.gameOrder),
    2: division.matches.filter(m => m.roundNumber === 2).sort((a, b) => a.gameOrder - b.gameOrder),
    3: division.matches.filter(m => m.roundNumber === 3),
  }

  return (
    <section
      id={`division-${division.name.toLowerCase()}`}
      aria-labelledby={`div-${division.tier}-heading`}
      className={cn(
        'rounded-2xl ring-1 p-4 sm:p-5 mb-8 scroll-mt-20',
        accent.ring,
        accent.bg,
        isMyDivision && 'ring-2 ring-titos-gold shadow-lg shadow-titos-gold/10',
      )}
    >
      <header className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2
            id={`div-${division.tier}-heading`}
            className={cn('font-display text-2xl sm:text-3xl font-black tracking-tight', accent.color)}
          >
            {division.name}
          </h2>
          {isMyDivision && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-titos-gold/15 text-titos-gold text-[10px] font-black uppercase tracking-wider ring-1 ring-titos-gold/30">
              Your division
            </span>
          )}
        </div>
        <span className="text-xs uppercase tracking-wider font-bold text-titos-gray-400 flex items-center gap-1.5">
          {division.court && `Court ${division.court}`}
        </span>
      </header>

      {/* Layout:
          • Mobile (< sm): single-column stacked timeline. Each round
            gets a sticky-looking week header, the cards sit at full
            width so team names never truncate, and W11 sits on a
            tinted band with a gold top-rule so the W10 → W11 break
            is obvious in the vertical flow.
          • sm+: original 3-column bracket tree. W11 columns share a
            tinted band with a left border — same visual story but
            horizontal. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3 relative">
        {ROUND_COLUMNS.map((col, idx) => {
          const isW11Start = col.week === 11 && ROUND_COLUMNS[idx - 1]?.week !== 11
          const weekRow = weeks?.[col.week]
          return (
            <div
              key={col.round}
              className={cn(
                'min-w-0 rounded-lg',
                // W11 background band — applied on both mobile and desktop.
                col.week === 11 && 'bg-titos-elevated/20 -mx-1 px-2 sm:px-2.5 pt-2 pb-2',
                // Mobile: gold TOP rule between W10 and W11. Desktop:
                // gold LEFT rule between QF and SF.
                isW11Start && 'border-t-2 sm:border-t-0 sm:border-l-2 border-titos-gold/30 mt-1 sm:mt-0',
              )}
            >
              {/* Column header: explicit week badge + round name + date.
                  Larger on mobile because the column is now full-width and
                  there's room for a real headline rather than a tiny chip. */}
              <div className="mb-3 sm:mb-2">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-[9px] font-black uppercase tracking-wider leading-none',
                      col.week === 10
                        ? 'bg-titos-gold/20 text-titos-gold'
                        : 'bg-titos-gold/35 text-titos-gold ring-1 ring-titos-gold/40',
                    )}
                  >
                    Week {col.week}
                  </span>
                  <span className="text-xs sm:text-[11px] uppercase tracking-wider font-bold text-titos-gray-300">
                    {col.label}
                  </span>
                </div>
                {weekRow?.date && (
                  <span className="block text-[11px] sm:text-[10px] text-titos-gray-500 mt-0.5">
                    {formatWeekDate(weekRow.date)}
                  </span>
                )}
              </div>

              <div className={cn(
                'flex flex-col gap-3',
                // Tournament 'feeder lines' look — only on desktop, where the
                // tree is horizontal. Mobile is a vertical timeline already.
                col.round === 2 && 'sm:justify-around sm:min-h-[200px]',
                col.round === 3 && 'sm:justify-center sm:min-h-[200px]',
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
            Both SFs <span className="font-mono">10:00 PM</span>; Final <span className="font-mono">11 PM – 12 AM</span>.
          </p>
          <p className="text-titos-gray-500 text-[11px] mt-1">
            {w11?.date ? formatWeekDate(w11.date) : 'Date TBD'} · Courts TBD
          </p>
        </div>
      </div>
    </div>
  )
}

function scrollToDivision(divisionName) {
  if (typeof document === 'undefined') return
  const el = document.getElementById(`division-${divisionName.toLowerCase()}`)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function JumpToDivision({ divisions, myDivisionName, onPickTeam }) {
  // Compact jump bar — sticky-ish chips so players in Silver don't have
  // to scroll past three brackets to find theirs. Highlights the user's
  // own division in gold when known. Includes a 'Pick team' shortcut
  // that surfaces the team filter (handy when the user hasn't already
  // told us who they are).
  return (
    <nav
      aria-label="Jump to division"
      className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-6 sticky top-2 z-30"
    >
      <span className="text-[10px] uppercase tracking-wider font-bold text-titos-gray-500 mr-1">
        Jump to
      </span>
      {divisions.map(d => {
        const isMine = myDivisionName && d.name === myDivisionName
        return (
          <button
            key={d.tier}
            type="button"
            onClick={() => scrollToDivision(d.name)}
            aria-label={`Scroll to ${d.name} bracket${isMine ? ' (your division)' : ''}`}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold',
              isMine
                ? 'bg-titos-gold text-titos-black hover:bg-titos-gold/90 shadow-md shadow-titos-gold/20'
                : 'bg-titos-card text-titos-gray-300 ring-1 ring-titos-border hover:ring-titos-border-light hover:text-titos-white',
            )}
          >
            {d.name}
            {isMine && <span className="text-[9px] font-black opacity-80">YOU</span>}
          </button>
        )
      })}
      {!myDivisionName && (
        <button
          type="button"
          onClick={onPickTeam}
          className="ml-auto text-[11px] text-titos-gold hover:underline font-semibold cursor-pointer"
        >
          Pick your team →
        </button>
      )}
    </nav>
  )
}

function TeamPickerModal({ open, onClose, divisions, onPick }) {
  if (!open) return null
  const allTeams = []
  for (const div of divisions) {
    for (const m of div.matches) {
      for (const t of [m.homeTeam, m.awayTeam]) {
        if (t?.name && !allTeams.some(x => x.id === t.id)) {
          allTeams.push({ id: t.id, name: t.name, division: div.name })
        }
      }
    }
  }
  allTeams.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-picker-heading"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-titos-card border border-titos-border rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
      >
        <header className="px-5 py-4 border-b border-titos-border/40 flex items-center justify-between">
          <h2 id="team-picker-heading" className="font-display text-lg font-black text-titos-white">
            Pick your team
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-titos-gray-400 hover:text-titos-white text-xs cursor-pointer"
            aria-label="Close"
          >
            Close
          </button>
        </header>
        <div className="overflow-y-auto p-2">
          {allTeams.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => { onPick(t.name); onClose() }}
              className="w-full text-left px-3 py-3 rounded-lg hover:bg-titos-elevated/50 transition-colors cursor-pointer flex items-center justify-between gap-3 min-h-[44px]"
            >
              <span className="text-titos-white text-sm font-semibold">{t.name}</span>
              <span className="text-titos-gray-500 text-xs uppercase tracking-wider">{t.division}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PlayoffsClient({ slug, initialData }) {
  const [data, setData] = useState(initialData)
  const [myTeam, setMyTeam] = useMyTeam(slug)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Resolve which division contains the user's team so we can highlight
  // it AND float it to the top of the stack — Silver players shouldn't
  // have to scroll past 3 brackets to find theirs.
  const myDivisionName = useMemo(() => {
    if (!myTeam) return null
    for (const div of data.divisions || []) {
      for (const m of div.matches) {
        if (m.homeTeam?.name === myTeam || m.awayTeam?.name === myTeam) {
          return div.name
        }
      }
    }
    return null
  }, [myTeam, data.divisions])

  // Reorder: user's division first, then the natural Diamond → Silver order
  // for everything else. Stable for spectators (no team picked).
  const orderedDivisions = useMemo(() => {
    if (!myDivisionName) return data.divisions || []
    const mine = data.divisions.find(d => d.name === myDivisionName)
    const others = data.divisions.filter(d => d.name !== myDivisionName)
    return mine ? [mine, ...others] : data.divisions
  }, [data.divisions, myDivisionName])

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
      <JumpToDivision
        divisions={data.divisions}
        myDivisionName={myDivisionName}
        onPickTeam={() => setPickerOpen(true)}
      />
      {orderedDivisions.map(d => (
        <DivisionBracket
          key={d.tier}
          division={d}
          weeks={data.weeks}
          isMyDivision={myDivisionName === d.name}
        />
      ))}
      <TeamPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        divisions={data.divisions}
        onPick={setMyTeam}
      />
    </div>
  )
}
