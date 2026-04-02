'use client'

import { useState, useEffect } from 'react'
import { Trophy } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import LeagueSelector from '@/components/ui/LeagueSelector'
import { cn, getDivisionInfo, getTierColor, getMovementIcon, getLeagueTimeDisplay } from '@/lib/utils'

export default function StandingsClient({ leagues }) {
  const [selected, setSelected] = useState(leagues[0]?.slug || '')
  const [standings, setStandings] = useState(null)
  const [tierView, setTierView] = useState(null)
  const [view, setView] = useState('overall')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    fetch(`/api/leagues/${selected}/standings`)
      .then(r => r.json())
      .then(data => { setStandings(data.standings); setTierView(data.currentTiers); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selected])

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionHeading label="RANKINGS" title="Season Standings" description="Overall league standings and current tier placements." />

        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <LeagueSelector leagues={leagues} selected={selected} onSelect={setSelected} />

          <div className="flex gap-2">
            {['overall', 'tiers'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
                  view === v
                    ? 'bg-titos-gold/15 text-titos-gold border border-titos-gold/30'
                    : 'bg-titos-card text-titos-gray-300 border border-titos-border hover:text-titos-white'
                )}
              >
                {v === 'overall' ? 'Overall' : 'Tier View'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="card rounded-xl p-6 animate-pulse"><div className="h-6 bg-titos-charcoal rounded w-1/3" /></div>)}
          </div>
        ) : view === 'overall' && standings ? (
          <div className="card rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-titos-border bg-titos-gold/5">
              <h3 className="font-display font-bold text-titos-gold flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Overall Standings
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-titos-border/50">
                    {['#', 'Team', 'SW', 'SL', '+/-', 'PTS', 'Division'].map(h => (
                      <th key={h} className={`px-3 py-3 text-xs font-semibold uppercase tracking-wider text-titos-gray-400 ${h === 'Team' ? 'text-left' : 'text-center'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {standings.map(team => {
                    const leagueType = (selected.includes('sunday') || selected.includes('mens')) ? 'mens' : 'coed'
                    const div = getDivisionInfo(team.rank, standings.length, leagueType)
                    return (
                      <tr key={team.id} className={`border-b border-titos-border/30 hover:bg-titos-card/50 ${div.bgClass}`}>
                        <td className="px-3 py-3 text-center">
                          <span className={cn('inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold', team.rank <= 3 ? 'bg-titos-gold/20 text-titos-gold' : 'text-titos-gray-400')}>{team.rank}</span>
                        </td>
                        <td className="px-3 py-3 text-left font-semibold text-titos-white">{team.name}</td>
                        <td className="px-3 py-3 text-center font-semibold text-status-success">{team.setsWon}</td>
                        <td className="px-3 py-3 text-center font-semibold text-status-live">{team.setsLost}</td>
                        <td className={`px-3 py-3 text-center font-bold ${team.pointDiff >= 0 ? 'text-status-success' : 'text-status-live'}`}>{team.pointDiff > 0 ? '+' : ''}{team.pointDiff}</td>
                        <td className="px-3 py-3 text-center font-bold text-titos-white">{team.totalPoints}</td>
                        <td className="px-3 py-3 text-center"><span className="text-xs font-semibold">{div.name}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : view === 'tiers' && tierView ? (
          <div className="space-y-4">
            {tierView.map(tier => {
              const tc = getTierColor(tier.tierNumber)
              return (
                <div key={tier.tierNumber} className="card rounded-xl overflow-hidden">
                  <div className={`px-4 py-2.5 border-b border-titos-border flex items-center justify-between ${tc.bg}`}>
                    <h4 className={`font-display font-bold text-sm ${tc.text}`}>Tier {tier.tierNumber}</h4>
                    <span className="text-titos-gray-400 text-xs">Court {tier.courtNumber} &middot; {
                      tier.timeSlot === 'single'
                        ? '9 PM – 12 AM'
                        : (selected.includes('sunday') || selected.includes('mens'))
                          ? (tier.timeSlot === 'early' ? '9–10:30 PM' : '10:30 PM–12 AM')
                          : (tier.timeSlot === 'early' ? '8–10 PM' : '10 PM–12 AM')
                    }</span>
                  </div>
                  <div className="p-4 flex flex-wrap gap-3">
                    {tier.teams.map(t => (
                      <div key={t.id} className="flex items-center gap-2 bg-titos-surface rounded-lg px-3 py-2">
                        {t.finishPosition && <span className={cn('text-xs font-bold', t.finishPosition === 1 ? 'text-titos-gold' : t.finishPosition === 3 ? 'text-status-live' : 'text-titos-gray-400')}>#{t.finishPosition}</span>}
                        <span className="text-titos-white text-sm font-medium">{t.name}</span>
                        {t.movement && <span className={cn('text-xs font-bold', t.movement === 'up' ? 'movement-up' : t.movement === 'down' ? 'movement-down' : 'movement-stay')}>{getMovementIcon(t.movement)}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card rounded-xl p-8 text-center">
            <p className="text-titos-gray-400">No standings data available yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
