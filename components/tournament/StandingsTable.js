// Pool standings table. Renders the output of computeStandingsFromMatches —
// each row has a data-qualifies attribute ('gold' | 'silver' | 'none') so the
// design pass can color qualifiers without changing the component logic.
//
// Column order matches the sort order (per April 25 Captains Package):
//   Sets Won (SW) → Sets Lost (SL) → Record (W-L-T) → Point diff
// SW leads because it's the primary standings currency; ties on SW break on
// head-to-head point differential (surfaced in the +/- column).
//
// When `selectedTeamId` is provided (player has picked their team via the
// TeamPicker), that team's row is visually highlighted and annotated with a
// "YOU" chip so players can find themselves at a glance in a dense grid.

import { Trophy, Medal } from 'lucide-react'
import { cn } from '@/lib/utils'

// Left-accent colors + icon per qualifying status. Keeping all visual decisions
// derived from `qualifies` means the calculation stays the single source of
// truth — the UI can never disagree with the standings logic.
function rankMeta(qualifies, index) {
  if (qualifies === 'gold') {
    return {
      accent: 'border-l-2 border-titos-gold/60',
      rankClass: 'text-titos-gold',
      icon: index === 0 ? Trophy : Medal,
      iconClass: 'text-titos-gold',
    }
  }
  if (qualifies === 'silver') {
    return {
      accent: 'border-l-2 border-titos-gray-500/50',
      rankClass: 'text-titos-gray-300',
      icon: null,
      iconClass: '',
    }
  }
  return {
    accent: 'border-l-2 border-transparent',
    rankClass: 'text-titos-gray-500',
    icon: null,
    iconClass: '',
  }
}

export default function StandingsTable({ pool, standings, selectedTeamId = null }) {
  const hasGoldSilver = standings.some(r => r.qualifies !== 'none')

  return (
    <div className="card rounded-xl overflow-hidden">
      <header className="px-4 py-3 border-b border-titos-border bg-titos-gold/5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-display font-bold text-titos-gold text-sm">{pool.name}</h3>
          {hasGoldSilver && (
            <div className="flex items-center gap-3 text-[9px] uppercase tracking-wider">
              <span className="inline-flex items-center gap-1 text-titos-gold">
                <span className="w-1.5 h-1.5 rounded-full bg-titos-gold" aria-hidden="true" />
                Gold bracket
              </span>
              <span className="inline-flex items-center gap-1 text-titos-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-titos-gray-500" aria-hidden="true" />
                Silver bracket
              </span>
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
              <th className="pl-1.5 pr-3 sm:px-2 py-2 text-center" title="Point differential">+/-</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => {
              const meta = rankMeta(row.qualifies, i)
              const Icon = meta.icon
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
                    <span className="inline-flex items-center gap-1">
                      {Icon && <Icon className="w-3.5 h-3.5" aria-hidden="true" />}
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-titos-white font-medium max-w-[9rem] sm:max-w-none truncate" title={row.name}>
                    <span className="inline-flex items-center gap-2">
                      <span className="truncate">{row.name}</span>
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
                  <td className="pl-1.5 pr-3 sm:px-2 py-2 text-center font-bold tabular-nums text-titos-gray-300">
                    {row.diff > 0 ? '+' : ''}{row.diff}
                  </td>
                </tr>
              )
            })}
            {standings.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-titos-gray-500">No standings yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
