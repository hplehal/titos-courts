// Horizontal bracket layout: round columns (QF → SF → F) with MatchCards.
//
// Layout choices:
//   - Horizontal scroll on small screens (cards keep a minimum 14rem width so
//     they never get squeezed illegible). `overflow-x-auto` gives a native
//     swipe affordance — no JS pager needed.
//   - Round columns grow with breakpoints (14rem → 15rem → 16rem) so on a
//     laptop all three columns fit without scroll.
//   - Subtle arrow glyph between columns visually communicates "winners
//     advance this way" without expensive SVG connectors.
//   - Round header is a pill badge so scanning "which column am I looking
//     at?" is trivial from ten feet away.
//
// QF grouping nuance (important — see screenshot feedback):
//   The PDF schedule runs an INTERLEAVED QF order on the physical courts
//   (QF1 and QF3 both play Court 1, QF2 and QF4 both play Court 2). That
//   means SF1 is fed by QF1 + QF3 — not QF1 + QF2 as a naive 1-2-3-4 stack
//   would suggest. If we render QFs strictly by bracketPosition the tree
//   reads wrong ("SZN wins QF1, how does its winner end up against QF3's
//   winner and not QF2's?"). So for the QF column we group by SF-feed
//   (position % sfCount) and render each group as a visually-tight pair
//   with a larger gap BETWEEN groups. The SF column next to it can then
//   line up with the centre of each pair and the feed reads correctly.

import { ChevronRight } from 'lucide-react'
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

  // QFs feed SFs via `position % sfCount` (see admin/brackets/route.js).
  // Pre-group the QF list into feed-buckets so the render below can slot
  // each bucket as a tight visual pair.
  const qfList = byRound[BRACKET_ROUND.QUARTERFINAL] || []
  const sfCount = Math.max(1, Math.ceil(qfList.length / 2))
  const qfGroups = Array.from({ length: sfCount }, (_, gi) =>
    qfList
      .filter((m) => ((m.bracketPosition ?? 0) % sfCount) === gi)
      .sort((a, b) => (a.bracketPosition ?? 0) - (b.bracketPosition ?? 0)),
  )

  return (
    <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-1" aria-label="Bracket tree">
      <div className="flex items-stretch gap-2 sm:gap-3 md:gap-4 min-w-fit">
        {rounds.map((r, idx) => {
          const isQf = r === BRACKET_ROUND.QUARTERFINAL
          const isFinal = r === BRACKET_ROUND.FINAL
          const list = [...byRound[r]].sort(
            (a, b) => (a.bracketPosition ?? 0) - (b.bracketPosition ?? 0),
          )
          return (
            <div key={r} className="flex items-stretch gap-2 sm:gap-3 md:gap-4">
              <div className="flex flex-col gap-3">
                {/* Round header pill */}
                <div className="flex justify-center">
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full bg-titos-elevated border border-titos-border/40 text-[10px] font-black uppercase tracking-wider text-titos-gray-300"
                  >
                    {LABELS[r] || `Round ${r}`}
                  </span>
                </div>
                {/* Match column.
                    QFs render in paired groups so each pair visually "feeds"
                    the SF next to it (tight inner gap, loose outer gap). Non-
                    QF rounds keep the simple evenly-distributed column. */}
                {isQf ? (
                  <div className="flex flex-col gap-8 sm:gap-10 md:gap-12 justify-around flex-1">
                    {qfGroups.map((group, gi) => (
                      <div key={gi} className="flex flex-col gap-2 sm:gap-3">
                        {group.map((m) => (
                          <div key={m.id} className="w-[14.5rem] sm:w-60 md:w-64">
                            <MatchCard match={m} variant="bracket" />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={
                      'flex flex-col gap-4 sm:gap-5 md:gap-6 flex-1 ' +
                      (isFinal ? 'justify-center' : 'justify-around')
                    }
                  >
                    {list.map((m) => (
                      <div key={m.id} className="w-[14.5rem] sm:w-60 md:w-64">
                        <MatchCard match={m} variant="bracket" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Inter-column advance arrow (hidden after final column) */}
              {idx < rounds.length - 1 && (
                <div className="flex items-center" aria-hidden="true">
                  <ChevronRight className="w-5 h-5 text-titos-gray-600" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
