'use client'

import { CheckCircle2 } from 'lucide-react'
import { cn, getSlotInfo } from '@/lib/utils'

const scoreEntered = (v) => v !== '' && v !== null && v !== undefined

// Score entry table for a single tier — keyboard-first:
// Tab/Enter moves to the next field, and typing 2 digits auto-advances.
export default function TierScoreBlock({ tierNum, tierMatches, inputRefs, onScoreChange, allInputKeys }) {
  const slot = getSlotInfo(parseInt(tierNum), tierMatches[0]?.timeSlot)
  const slotVar = parseInt(tierNum) <= 4 ? 'slot-early' : parseInt(tierNum) <= 8 ? 'slot-late' : 'slot-single'

  const focusNext = (matchId, field) => {
    const cur = `${matchId}-${field}`
    const idx = allInputKeys.indexOf(cur)
    if (idx >= 0 && idx < allInputKeys.length - 1) {
      const next = allInputKeys[idx + 1]
      inputRefs.current[next]?.focus()
      inputRefs.current[next]?.select()
    }
  }

  const handleKeyDown = (e, matchId, field) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      focusNext(matchId, field)
    }
  }

  const handleChange = (matchId, scoreField, navField, value) => {
    onScoreChange(matchId, scoreField, value)
    // Scores max out at 27, so two digits means the field is done — jump ahead
    if (value.length >= 2) focusNext(matchId, navField)
  }

  const tierDone = tierMatches.every(m => {
    const s = m.scores?.[0]
    return s && scoreEntered(s.homeScore) && scoreEntered(s.awayScore)
  })

  const inputClass = (isWinner) => cn(
    'w-16 px-1 py-2 rounded-lg text-center font-black text-lg transition-colors focus:outline-none focus:border-titos-gold focus:ring-2 focus:ring-titos-gold/30',
    isWinner
      ? 'bg-status-success/10 border border-status-success/40 text-status-success'
      : 'bg-titos-surface border border-titos-border text-titos-white'
  )

  return (
    <div className="card-flat rounded-2xl overflow-hidden">
      <div className={cn('px-4 py-2.5 flex items-center justify-between', slot.bg)} style={{ borderLeft: `3px solid var(--color-${slotVar})` }}>
        <div className="flex items-center gap-2">
          <span className={cn('font-display text-base font-black', slot.color)}>T{tierNum}</span>
          <span className="text-titos-gray-400 text-xs">Court {tierMatches[0]?.courtNumber}</span>
          {tierDone && <CheckCircle2 className="w-4 h-4 text-status-success" />}
        </div>
        <span className={cn('text-[10px] font-bold uppercase', slot.color)}>{slot.label}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[9px] font-bold uppercase tracking-wider text-titos-gray-500">
              <th className="px-3 py-2 text-left w-8">#</th>
              <th className="px-3 py-2 text-left">Home</th>
              <th className="py-2 text-center w-[70px]">H</th>
              <th className="py-2 text-center w-4">-</th>
              <th className="py-2 text-center w-[70px]">A</th>
              <th className="px-3 py-2 text-left">Away</th>
              <th className="px-3 py-2 text-right">Ref</th>
            </tr>
          </thead>
          <tbody>
            {tierMatches.map((match, idx) => {
              const s = match.scores?.[0] || { homeScore: '', awayScore: '' }
              const homeKey = `${match.id}-home`
              const awayKey = `${match.id}-away`
              const bothIn = scoreEntered(s.homeScore) && scoreEntered(s.awayScore)
              const homeWins = bothIn && s.homeScore > s.awayScore
              const awayWins = bothIn && s.awayScore > s.homeScore
              return (
                <tr key={match.id} className={cn('border-t border-titos-border/15 hover:bg-titos-white/[0.02]', idx > 0 && idx % 3 === 0 && 'border-t-2 border-t-titos-border/40')}>
                  <td className="px-3 py-2 text-titos-gray-600 text-xs font-bold">{match.gameOrder}</td>
                  <td className={cn('px-3 py-2 font-semibold text-sm', homeWins ? 'text-status-success' : 'text-titos-white')}>{match.homeTeam?.name}</td>
                  <td className="py-2 text-center">
                    <input ref={el => { inputRefs.current[homeKey] = el }} type="number" inputMode="numeric" min="0" max="27" value={s.homeScore}
                      onChange={e => handleChange(match.id, 'homeScore', 'home', e.target.value)}
                      onKeyDown={e => handleKeyDown(e, match.id, 'home')}
                      onFocus={e => e.target.select()}
                      className={inputClass(homeWins)} placeholder="--" />
                  </td>
                  <td className="py-2 text-center text-titos-gray-600 text-xs">vs</td>
                  <td className="py-2 text-center">
                    <input ref={el => { inputRefs.current[awayKey] = el }} type="number" inputMode="numeric" min="0" max="27" value={s.awayScore}
                      onChange={e => handleChange(match.id, 'awayScore', 'away', e.target.value)}
                      onKeyDown={e => handleKeyDown(e, match.id, 'away')}
                      onFocus={e => e.target.select()}
                      className={inputClass(awayWins)} placeholder="--" />
                  </td>
                  <td className={cn('px-3 py-2 text-sm', awayWins ? 'text-status-success font-semibold' : 'text-titos-gray-300')}>{match.awayTeam?.name}</td>
                  <td className="px-3 py-2 text-right text-titos-gray-600 text-xs">{match.refTeam?.name || '--'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
