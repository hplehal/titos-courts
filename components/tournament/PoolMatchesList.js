'use client'

// Single-dropdown per pool: one <details> containing every match in round
// order. Default open so users see everything without clicking; collapse is
// a one-click escape hatch when they want the standings table to breathe.
//
// Earlier revision used a dropdown per round (R1, R2, …). On a 4-pool event
// that was 24 separate disclosures — clicking fatigue, not less clicking.
// Round grouping is now conveyed passively: each MatchCard's meta line
// already carries the round number (via the `showRound` prop) so scanning
// stays trivial without forcing users to open/close anything.
//
// Native <details>/<summary> — keyboard + screen-reader semantics come
// free, no JS state, no layout shift.

import { useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import MatchCard from './MatchCard'

function summarize(matches) {
  let live = 0
  let final = 0
  let scheduled = 0
  for (const m of matches) {
    if (m.status === 'live') live++
    else if (m.status === 'completed') final++
    else scheduled++
  }
  return { live, final, scheduled }
}

export default function PoolMatchesList({ matches, poolTeams }) {
  const sorted = useMemo(() => {
    return (matches || []).slice().sort((a, b) => {
      const ra = a.roundNumber ?? 0
      const rb = b.roundNumber ?? 0
      if (ra !== rb) return ra - rb
      return (a.gameOrder ?? 0) - (b.gameOrder ?? 0)
    })
  }, [matches])

  const summary = useMemo(() => summarize(sorted), [sorted])

  if (sorted.length === 0) {
    return <p className="text-titos-gray-500 text-xs px-1">No matches scheduled yet.</p>
  }

  return (
    <details open className="group card-flat rounded-lg overflow-hidden">
      <summary className="list-none cursor-pointer select-none px-3 py-2 flex items-center gap-2 hover:bg-titos-elevated/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold">
        <ChevronDown
          className="w-4 h-4 text-titos-gray-400 shrink-0 transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        />
        <span className="font-display font-bold text-titos-white text-sm">
          Matches
        </span>
        <span className="text-[10px] text-titos-gray-500 ml-auto flex items-center gap-2">
          <span>{sorted.length} total</span>
          {summary.live > 0 && (
            <>
              <span className="text-titos-gray-600" aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-status-live font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" aria-hidden="true" />
                {summary.live} live
              </span>
            </>
          )}
          {summary.final > 0 && (
            <>
              <span className="text-titos-gray-600" aria-hidden="true">·</span>
              <span>{summary.final} final</span>
            </>
          )}
          {summary.scheduled > 0 && (
            <>
              <span className="text-titos-gray-600" aria-hidden="true">·</span>
              <span>{summary.scheduled} upcoming</span>
            </>
          )}
        </span>
      </summary>
      <div className="px-2 pb-2 pt-1 space-y-1.5 border-t border-titos-border/30">
        {sorted.map(m => (
          <MatchCard
            key={m.id}
            match={m}
            variant="pool"
            poolTeams={poolTeams}
            showRound
          />
        ))}
      </div>
    </details>
  )
}
