// Horizontal bracket layout: round columns (QF → SF → F) with MatchCards.
// Lightweight grid; design pass will add connector lines + better spacing.

import MatchCard from './MatchCard'
import { BRACKET_ROUND } from '@/lib/tournament/constants'

const LABELS = {
  [BRACKET_ROUND.QUARTERFINAL]: 'Quarterfinals',
  [BRACKET_ROUND.SEMIFINAL]: 'Semifinals',
  [BRACKET_ROUND.FINAL]: 'Final',
}

export default function BracketTree({ matches }) {
  // Group matches by round
  const byRound = {}
  for (const m of matches || []) {
    const r = m.bracketRound || 1
    if (!byRound[r]) byRound[r] = []
    byRound[r].push(m)
  }
  const rounds = Object.keys(byRound).map(Number).sort((a, b) => a - b)

  if (rounds.length === 0) {
    return <p className="text-titos-gray-500 text-sm">No matches yet.</p>
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-4 sm:gap-8 items-start min-w-fit">
        {rounds.map(r => {
          // Sort by bracketPosition for stable vertical order
          const list = [...byRound[r]].sort((a, b) => (a.bracketPosition ?? 0) - (b.bracketPosition ?? 0))
          return (
            <div key={r} className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-titos-gray-500 text-center mb-2">
                {LABELS[r] || `Round ${r}`}
              </span>
              <div className="flex flex-col gap-4 sm:gap-6" style={{ justifyContent: 'space-around' }}>
                {list.map(m => (
                  <div key={m.id} className="w-[14rem] sm:w-56">
                    <MatchCard match={m} variant="bracket" />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
