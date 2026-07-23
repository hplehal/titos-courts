// Pool standings table. Renders the output of computeStandingsFromMatches —
// each row has a data-qualifies attribute ('gold' | 'silver' | 'none') so the
// design pass can color qualifiers without changing the component logic.
//
// Column order matches the sort order (per April 25 Captains Package):
//   Sets Won (SW) → Sets Lost (SL) → Record (W-L-T) → Point diff
// SW leads because it's the primary standings currency; ties on SW break on
// head-to-head point differential (surfaced in the +/- column).
//
// Qualifier clarity: earlier designs used Trophy / Medal icons next to the
// rank, which confused users ("why does 1st have a different icon than 2nd?"
// / "does a medal mean silver?"). Replaced with an explicit "Advances" column
// that spells out the destination bracket in words — no ambiguity.
//
// When `selectedTeamId` is provided (player has picked their team via the
// TeamPicker), that team's row is visually highlighted and annotated with a
// "YOU" chip so players can find themselves at a glance in a dense grid.

import { cn } from '@/lib/utils'
import { cleanTeamName } from '@/lib/tournament/displayName'

// Derive left-accent border + rank color from the qualifying status. Keeping
// all visual decisions tied to `qualifies` means the UI can never disagree
// with the computed standings.
function rowAccent(qualifies) {
  if (qualifies === 'gold') return { accent: 'border-l-2 border-titos-gold/60', rankClass: 'text-titos-gold' }
  if (qualifies === 'silver') return { accent: 'border-l-2 border-titos-gray-400/50', rankClass: 'text-titos-gray-200' }
  return { accent: 'border-l-2 border-transparent', rankClass: 'text-titos-gray-500' }
}

function AdvanceBadge({ qualifies }) {
  if (qualifies === 'gold') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-titos-gold/15 text-titos-gold text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
        title="Top 2 in this pool advance to the Gold bracket"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-titos-gold" aria-hidden="true" />
        Gold
      </span>
    )
  }
  if (qualifies === 'silver') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-titos-gray-500/15 text-titos-gray-200 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
        title="Bottom 2 in this pool drop into the Silver bracket"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-titos-gray-300" aria-hidden="true" />
        Silver
      </span>
    )
  }
  return <span className="text-titos-gray-600 text-xs" aria-label="Does not advance">—</span>
}

export default function StandingsTable({ pool, standings, selectedTeamId = null }) {
  const hasGoldSilver = standings.some(r => r.qualifies !== 'none')

  return (
    <div className="card rounded-xl overflow-hidden">
      <header className="px-4 py-3 border-b border-titos-border bg-titos-gold/5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-display font-bold text-titos-gold text-sm">{pool.name}</h3>
          {hasGoldSilver && (
            <div className="flex items-center gap-3 text-[10px] text-titos-gray-400">
              <span>Top 2 → <span className="text-titos-gold font-semibold">Gold</span></span>
              <span className="text-titos-gray-600" aria-hidden="true">·</span>
              <span>Bottom 2 → <span className="text-titos-gray-200 font-semibold">Silver</span></span>
            </div>
          )}
        </div>
        <p className="text-[10px] uppercase tracking-wider text-titos-gray-500 mt-1">
          Ranked by sets won · ties broken by head-to-head
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-wider text-titos-gray-500">
              <th className="pl-3 pr-1.5 sm:px-3 py-2 text-left w-8">#</th>
              <th className="px-2 sm:px-3 py-2 text-left">Team</th>
              <th className="px-1.5 sm:px-2 py-2 text-center" title="Sets won">SW</th>
              <th className="px-1.5 sm:px-2 py-2 text-center hidden sm:table-cell" title="Sets lost">SL</th>
              <th className="px-1.5 sm:px-2 py-2 text-center" title="Match record: wins–losses–ties">Rec</th>
              <th className="px-1.5 sm:px-2 py-2 text-center" title="Point differential">+/-</th>
              <th className="pl-1.5 pr-3 sm:px-2 py-2 text-right" title="Which bracket this seed advances to">Advances</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => {
              const meta = rowAccent(row.qualifies)
              const isYou = selectedTeamId && row.teamId === selectedTeamId
              return (
                <tr
                  key={row.teamId}
                  data-qualifies={row.qualifies}
                  data-you={isYou || undefined}
                  className={cn(
                    'border-t border-titos-border/15 transition-colors',
                    'hover:bg-titos-elevated/40',
                    isYou && 'bg-titos-gold/10 hover:bg-titos-gold/15',
                  )}
                >
                  <td className={cn('pl-3 pr-1.5 sm:px-3 py-2 font-bold tabular-nums', meta.accent, meta.rankClass)}>
                    {i + 1}
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-titos-white font-medium max-w-[9rem] sm:max-w-none truncate" title={cleanTeamName(row.name)}>
                    <span className="inline-flex items-center gap-2">
                      <span className="truncate">{cleanTeamName(row.name)}</span>
                      {isYou && (
                        <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded bg-titos-gold text-titos-black text-[9px] font-black uppercase tracking-wider">
                          You
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-1.5 sm:px-2 py-2 text-center text-titos-white font-bold tabular-nums">{row.sw}</td>
                  <td className="px-1.5 sm:px-2 py-2 text-center text-titos-gray-400 tabular-nums hidden sm:table-cell">{row.sl}</td>
                  <td className="px-1.5 sm:px-2 py-2 text-center text-titos-gray-300 tabular-nums whitespace-nowrap">
                    {row.w}<span className="text-titos-gray-600">–</span>{row.l}<span className="text-titos-gray-600">–</span>{row.t ?? 0}
                  </td>
                  <td className="px-1.5 sm:px-2 py-2 text-center font-bold tabular-nums text-titos-gray-300">
                    {row.diff > 0 ? '+' : ''}{row.diff}
                  </td>
                  <td className="pl-1.5 pr-3 sm:px-2 py-2 text-right">
                    <AdvanceBadge qualifies={row.qualifies} />
                  </td>
                </tr>
              )
            })}
            {standings.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-titos-gray-500">No standings yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
