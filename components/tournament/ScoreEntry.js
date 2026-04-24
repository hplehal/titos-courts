'use client'

// Admin score-entry row for a single tournament match. Pool matches show 2
// fixed set inputs (per April 25 Captains Package, sets to 25 cap 27);
// bracket matches show 3 (best-of-3). Blank inputs stay blank (not saved).
// "Save" PATCHes the scores endpoint which re-derives status + winner via
// computeMatchStatus.
//
// Interaction design:
//   • FINAL matches collapse to a one-line chip and expand on click — the
//     admin usually only wants to see/modify live & upcoming rows.
//   • Each score has +/- steppers flanking the number (≥44x44 hit targets)
//     so refs entering on phones never need the keyboard open.
//   • A "25" button on each set fills the winning side instantly — the
//     number every pool-play set ends with.
//
// Accessibility:
//   • Each set is a <fieldset><legend>Set N</legend> — screen readers announce
//     "Set 1, Team A score spinbutton" on focus.
//   • Arrow Up / Arrow Down on any score input bumps the value by 1; Shift+Arrow
//     bumps by 5 — faster than typing when you're just ticking points along.
//   • role="spinbutton" + aria-valuenow/min/max/text for assistive tech.
//   • Visible focus ring + explicit status messages (role="status"
//     aria-live="polite") on save results.

import { useState, useEffect } from 'react'
import { Loader2, Save, Minus, Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminPatch, adminDelete } from '@/lib/adminFetch'
import { refAssignmentForMatch } from '@/lib/tournament/refRotation'
import { tallySetsWon } from '@/lib/tournament/computeMatchStatus'
import { cleanTeamName } from '@/lib/tournament/displayName'

function statusChip(status) {
  if (status === 'completed') {
    return <span className="text-[10px] font-bold uppercase tracking-wider text-status-success">Final</span>
  }
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-status-live">
        <span className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" />
        Live
      </span>
    )
  }
  return <span className="text-[10px] font-bold uppercase tracking-wider text-titos-gray-500">Scheduled</span>
}

function fmtTime(date) {
  if (!date) return null
  try {
    return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } catch { return null }
}

function clampScore(v) {
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) return 0
  if (n > 99) return 99
  return Math.round(n)
}

export default function ScoreEntry({ match, saveUrl, onSaved, poolTeams = null, flush = false }) {
  const setCount = match.poolId ? 2 : 3
  const buildInitial = () => Array.from({ length: setCount }).map((_, i) => {
    const s = match.scores?.find(x => x.setNumber === i + 1)
    return { setNumber: i + 1, homeScore: s?.homeScore ?? '', awayScore: s?.awayScore ?? '' }
  })
  const [sets, setSets] = useState(buildInitial)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  // Default collapsed except for LIVE matches — bracket admin pages render
  // 14 matches (4 QF + 2 SF + 1 F per division) and expanding them all by
  // default made the page scroll ~8000px. LIVE stays open because that's
  // the one the admin is actively editing; everything else opens on click.
  const [expanded, setExpanded] = useState(match.status === 'live')

  useEffect(() => {
    setSets(buildInitial())
    // Re-sync when the match status flips. LIVE auto-expands, everything
    // else collapses back unless the admin already opened it — we only
    // force state on real transitions, never mid-edit.
    setExpanded(match.status === 'live')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id, match.scores?.length, match.status, setCount])

  const setField = (i, field, val) => {
    setSets(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val === '' ? '' : clampScore(val) } : s))
  }
  const bump = (i, field, delta) => {
    setSets(prev => prev.map((s, idx) => {
      if (idx !== i) return s
      const base = s[field] === '' ? 0 : Number(s[field])
      return { ...s, [field]: clampScore(base + delta) }
    }))
  }
  const quickWin = (i, winner) => {
    // One-tap set a clean 25-to-something result. If the other side is blank,
    // default it to 15 (typical losing score) so the row is immediately
    // savable. Admin can always adjust the loser number afterwards.
    setSets(prev => prev.map((s, idx) => {
      if (idx !== i) return s
      if (winner === 'home') {
        return { ...s, homeScore: 25, awayScore: s.awayScore === '' ? 15 : s.awayScore }
      }
      return { ...s, awayScore: 25, homeScore: s.homeScore === '' ? 15 : s.homeScore }
    }))
  }

  const save = async () => {
    setBusy(true); setMsg('')
    const payload = sets
      .filter(s => s.homeScore !== '' && s.awayScore !== '')
      .map(s => ({ setNumber: s.setNumber, homeScore: Number(s.homeScore), awayScore: Number(s.awayScore) }))
    try {
      const res = await adminPatch(saveUrl, { scores: payload })
      const data = await res.json()
      if (!res.ok) setMsg(data.error || 'Failed')
      else { setMsg('Saved'); onSaved?.(data) }
    } catch { setMsg('Connection error') }
    setBusy(false)
  }

  // Wipe all saved scores for this match and reset it to SCHEDULED. On the
  // bracket side this also best-effort un-advances any winner into the next
  // round + clears auto-assigned refs downstream (handled server-side).
  // Guarded with a native confirm() because this is destructive and can
  // invalidate downstream matches if they've already started.
  const hasSavedScores = (match.scores?.length ?? 0) > 0
  const clear = async () => {
    if (typeof window !== 'undefined') {
      const ok = window.confirm(
        'Clear all scores for this match? This will reset the match to scheduled and cannot be undone.',
      )
      if (!ok) return
    }
    setBusy(true); setMsg('')
    try {
      const res = await adminDelete(saveUrl)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg(data.error || 'Failed')
      } else {
        // Reset the local inputs to blanks so the UI matches the server.
        setSets(Array.from({ length: setCount }).map((_, i) => ({
          setNumber: i + 1, homeScore: '', awayScore: '',
        })))
        setMsg('Cleared')
        onSaved?.(data)
      }
    } catch { setMsg('Connection error') }
    setBusy(false)
  }

  const home = cleanTeamName(match.homeTeam?.name) || match.homeSeedLabel || 'TBD'
  const away = cleanTeamName(match.awayTeam?.name) || match.awaySeedLabel || 'TBD'
  const refs = match.poolId && poolTeams ? refAssignmentForMatch(match, poolTeams) : null

  // Set-win tally for the header chip ("Home 2 – 0 Away"). Only completed
  // sets count — 18–15 mid-set does NOT yet score 1–0. Reuses the same
  // target/cap rules that drive the match-status computation server-side.
  const mode = match.poolId ? 'pool' : 'bracket'
  const numericSets = sets
    .filter(s => s.homeScore !== '' && s.awayScore !== '')
    .map(s => ({
      setNumber: s.setNumber,
      homeScore: Number(s.homeScore),
      awayScore: Number(s.awayScore),
    }))
  const { setsHome: tallyHome, setsAway: tallyAway } = tallySetsWon(numericSets, mode)
  const tally = { home: tallyHome, away: tallyAway }

  const time = fmtTime(match.scheduledTime)
  const court = match.courtNumber ? `Court ${match.courtNumber}` : null
  const meta = [match.roundNumber ? `R${match.roundNumber}` : null, time, court].filter(Boolean).join(' · ')

  return (
    <div
      className={cn(
        'overflow-hidden',
        flush ? 'bg-transparent' : 'card-flat rounded-lg',
      )}
      data-status={match.status}
    >
      {/* Header — always visible. Clicking toggles collapse. */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        aria-controls={`score-body-${match.id}`}
        className="w-full px-3 py-2.5 text-left hover:bg-titos-elevated/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold"
      >
        {/* Mobile-first layout: status chip + meta on row 1, teams + tally on
            row 2. Keeps every line ≥14px + avoids horizontal truncation that
            made long team names unreadable at 375px.
            When `flush`, the parent wrapper already shows status+teams as its
            own identity strip, so we drop the duplicate team row and keep
            only the compact meta/tally/chevron line here. */}
        <div className="flex items-center gap-2 mb-1.5">
          {!flush && statusChip(match.status)}
          {flush && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-titos-gray-500">
              {expanded ? 'Hide scores' : 'Enter scores'}
            </span>
          )}
          {meta && <span className="text-[10px] text-titos-gray-500 truncate flex-1">{meta}</span>}
          {(tally.home > 0 || tally.away > 0) && (
            <span className="text-sm font-bold tabular-nums text-titos-white shrink-0">
              {tally.home}<span className="text-titos-gray-600">–</span>{tally.away}
            </span>
          )}
          {expanded
            ? <ChevronUp className="w-4 h-4 text-titos-gray-400 shrink-0" aria-hidden="true" />
            : <ChevronDown className="w-4 h-4 text-titos-gray-400 shrink-0" aria-hidden="true" />}
        </div>
        {!flush && (
          <div className="text-sm text-titos-white leading-snug">
            <span className={cn('break-words', tally.home > tally.away && 'text-titos-gold font-semibold')}>{home}</span>
            <span className="text-titos-gray-600 mx-1.5">vs</span>
            <span className={cn('break-words', tally.away > tally.home && 'text-titos-gold font-semibold')}>{away}</span>
          </div>
        )}
      </button>

      {expanded && (
        <div
          id={`score-body-${match.id}`}
          className="border-t border-titos-border/30 p-3 space-y-3"
        >
          {refs?.ref && (
            <p className="text-[11px] text-titos-gray-400">
              <span className="font-semibold uppercase tracking-wider text-titos-gray-500">Ref: </span>
              <span className="text-titos-gray-300">{cleanTeamName(refs.ref.name)}</span>
            </p>
          )}

          {sets.map((s, i) => (
            <SetRow
              key={i}
              setNumber={s.setNumber}
              home={home}
              away={away}
              homeScore={s.homeScore}
              awayScore={s.awayScore}
              onChange={setField}
              onBump={bump}
              onQuickWin={quickWin}
              index={i}
            />
          ))}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 pt-1">
            {/* Clear button lives on the left — visually separated from the
                primary Save CTA so it's never confused with it. Only shown
                once the match has saved scores to clear. */}
            {hasSavedScores ? (
              <button
                type="button"
                onClick={clear}
                disabled={busy}
                aria-label="Clear all saved scores for this match"
                className="text-xs py-2 px-3 min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded border border-titos-border/60 text-titos-gray-300 hover:text-status-error hover:border-status-error/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                Clear scores
              </button>
            ) : <span className="hidden sm:block" aria-hidden="true" />}

            <div className="flex items-center gap-3 sm:justify-end">
              {msg && (
                <span
                  className={cn(
                    'text-xs order-last sm:order-none text-center sm:text-left',
                    (msg === 'Saved' || msg === 'Cleared') ? 'text-status-success' : 'text-titos-gray-400',
                  )}
                  role="status"
                  aria-live="polite"
                >
                  {msg}
                </span>
              )}
              <button
                onClick={save}
                disabled={busy}
                aria-label="Save scores"
                className="btn-primary text-sm py-2.5 px-5 min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SetRow({ setNumber, home, away, homeScore, awayScore, onChange, onBump, onQuickWin, index }) {
  const legendId = `set-${setNumber}-legend`
  return (
    <fieldset
      className="rounded-md bg-titos-elevated/40 border border-titos-border/40 p-2.5 sm:p-3"
      aria-labelledby={legendId}
    >
      {/* Header: Set N label. On mobile it sits on its own row so the quick-win
          buttons below can span full width. On ≥sm it stays inline. */}
      <div className="flex items-center justify-between mb-2">
        <legend id={legendId} className="text-[11px] font-bold uppercase tracking-wider text-titos-gray-400 px-0">
          Set {setNumber}
        </legend>
        {(homeScore === '' && awayScore === '') && (
          <span className="text-[10px] text-titos-gray-600 hidden sm:inline">Quick win:</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <ScoreStepper
          label={home}
          value={homeScore}
          onChange={(v) => onChange(index, 'homeScore', v)}
          onBump={(d) => onBump(index, 'homeScore', d)}
          ariaLabel={`Set ${setNumber} ${home} score`}
          setNumber={setNumber}
          teamName={home}
        />
        <ScoreStepper
          label={away}
          value={awayScore}
          onChange={(v) => onChange(index, 'awayScore', v)}
          onBump={(d) => onBump(index, 'awayScore', d)}
          ariaLabel={`Set ${setNumber} ${away} score`}
          setNumber={setNumber}
          teamName={away}
        />
      </div>

      {/* Quick-win row — two equal-width buttons directly under each team's
          score column so the mapping is visually unambiguous. Stays usable at
          375px since each button gets its own half of the row. */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2" role="group" aria-label={`Quick winner for set ${setNumber}`}>
        <button
          type="button"
          onClick={() => onQuickWin(index, 'home')}
          aria-label={`Mark ${home} as set ${setNumber} winner (25–15)`}
          className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-1 min-h-[36px] rounded border border-titos-border/60 text-titos-gray-300 hover:text-titos-gold hover:border-titos-gold/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold"
          title={`${home} wins this set (25–15)`}
        >
          <span aria-hidden="true">25 · win</span>
        </button>
        <button
          type="button"
          onClick={() => onQuickWin(index, 'away')}
          aria-label={`Mark ${away} as set ${setNumber} winner (25–15)`}
          className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-1 min-h-[36px] rounded border border-titos-border/60 text-titos-gray-300 hover:text-titos-gold hover:border-titos-gold/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold"
          title={`${away} wins this set (15–25)`}
        >
          <span aria-hidden="true">25 · win</span>
        </button>
      </div>

    </fieldset>
  )
}

function ScoreStepper({ label, value, onChange, onBump, ariaLabel, setNumber, teamName }) {
  const displayValue = value === '' ? 0 : Number(value)
  const onKeyDown = (e) => {
    const step = e.shiftKey ? 5 : 1
    if (e.key === 'ArrowUp') { e.preventDefault(); onBump(step) }
    else if (e.key === 'ArrowDown') { e.preventDefault(); onBump(-step) }
  }
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider text-titos-gray-500 truncate block mb-1" title={label}>
        {label}
      </span>
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => onBump(-1)}
          aria-label={`Decrement ${teamName} set ${setNumber} score`}
          className="w-11 h-11 rounded-l-md border border-titos-border bg-titos-surface text-titos-gray-300 hover:text-titos-gold hover:border-titos-gold/60 transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold"
        >
          <Minus className="w-4 h-4" aria-hidden="true" />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          max="99"
          step="1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={onKeyDown}
          role="spinbutton"
          aria-label={ariaLabel}
          aria-valuenow={displayValue}
          aria-valuemin={0}
          aria-valuemax={99}
          aria-valuetext={value === '' ? 'blank' : String(displayValue)}
          placeholder="—"
          className="w-full h-11 -ml-px -mr-px border border-titos-border bg-titos-surface text-center text-titos-white text-xl font-bold tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold focus-visible:z-10 relative"
        />
        <button
          type="button"
          onClick={() => onBump(1)}
          aria-label={`Increment ${teamName} set ${setNumber} score`}
          className="w-11 h-11 rounded-r-md border border-titos-border bg-titos-surface text-titos-gray-300 hover:text-titos-gold hover:border-titos-gold/60 transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
