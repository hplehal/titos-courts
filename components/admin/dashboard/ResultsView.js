'use client'

import { cn, getSlotInfo } from '@/lib/utils'

// Per-tier standings computed from the week's scored matches
export default function ResultsView({ matches }) {
  const byTier = {}
  for (const m of matches) {
    if (!byTier[m.tierNumber]) byTier[m.tierNumber] = []
    byTier[m.tierNumber].push(m)
  }

  return (
    <div className="space-y-4">
      {Object.entries(byTier).sort(([a], [b]) => a - b).map(([tierNum, tierMatches]) => {
        const slot = getSlotInfo(parseInt(tierNum), tierMatches[0]?.timeSlot)
        const slotVar = parseInt(tierNum) <= 4 ? 'slot-early' : parseInt(tierNum) <= 8 ? 'slot-late' : 'slot-single'
        // Build team stats
        const stats = {}
        for (const m of tierMatches) {
          const s = m.scores?.[0]
          if (!s) continue
          for (const side of ['home', 'away']) {
            const team = side === 'home' ? m.homeTeam : m.awayTeam
            const opp = side === 'home' ? 'away' : 'home'
            if (!team) continue
            if (!stats[team.id]) stats[team.id] = { name: team.name, w: 0, l: 0, diff: 0 }
            const myScore = s[`${side}Score`] || 0
            const oppScore = s[`${opp}Score`] || 0
            stats[team.id].diff += myScore - oppScore
            if (myScore > oppScore) stats[team.id].w++
            else if (myScore < oppScore) stats[team.id].l++
          }
        }
        const ranked = Object.values(stats).sort((a, b) => b.w - a.w || b.diff - a.diff)

        return (
          <div key={tierNum} className="card-flat rounded-2xl overflow-hidden">
            <div className={cn('px-4 py-2.5 flex items-center justify-between', slot.bg)} style={{ borderLeft: `3px solid var(--color-${slotVar})` }}>
              <span className={cn('font-display text-base font-black', slot.color)}>T{tierNum}</span>
              <span className={cn('text-[10px] font-bold uppercase', slot.color)}>{slot.label}</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-[9px] font-bold uppercase tracking-wider text-titos-gray-500">
                  <th className="px-4 py-2 text-left w-8">#</th>
                  <th className="px-4 py-2 text-left">Team</th>
                  <th className="px-3 py-2 text-center w-10">W</th>
                  <th className="px-3 py-2 text-center w-10">L</th>
                  <th className="px-3 py-2 text-center w-14">+/-</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((t, i) => (
                  <tr key={t.name} className={cn('border-t border-titos-border/15',
                    i === 0 && 'bg-titos-gold/[0.06]',
                    i === ranked.length - 1 && ranked.length > 1 && 'bg-status-live/[0.04]'
                  )}>
                    <td className={cn('px-4 py-2.5 text-xs font-black', i === 0 ? 'text-titos-gold' : i === ranked.length - 1 ? 'text-status-live' : 'text-titos-gray-400')}>{i + 1}</td>
                    <td className="px-4 py-2.5 text-titos-white font-semibold text-sm">{t.name}</td>
                    <td className="px-3 py-2.5 text-center text-status-success font-bold text-sm">{t.w}</td>
                    <td className="px-3 py-2.5 text-center text-status-live font-bold text-sm">{t.l}</td>
                    <td className={cn('px-3 py-2.5 text-center font-bold text-sm', t.diff > 0 ? 'text-status-success' : t.diff < 0 ? 'text-status-live' : 'text-titos-gray-400')}>
                      {t.diff > 0 ? '+' : ''}{t.diff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
      {matches.length === 0 && <p className="text-titos-gray-400 text-center py-8">No scored matches for this week.</p>}
    </div>
  )
}
