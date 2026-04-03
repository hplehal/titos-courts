'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Trophy } from 'lucide-react'
import { cn, formatDate, getTierColor, getMovementIcon } from '@/lib/utils'

export default function LatestResults() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/results/latest')
      .then(r => r.json())
      .then(data => { setResults(data.results || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return null
  if (results.length === 0) return null

  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-titos-elevated/50 noise">
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <span className="text-titos-gold text-xs font-bold uppercase tracking-[0.2em] mb-2 block">Latest Results</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-titos-white leading-none">
              THIS WEEK&apos;S<br />
              <span className="text-titos-gray-400">ACTION.</span>
            </h2>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {results.map(league => (
            <div key={league.slug} className="card-flat rounded-2xl overflow-hidden">
              {/* League header */}
              <div className="px-5 py-3 flex items-center justify-between border-b border-titos-border/30">
                <div>
                  <h3 className="font-display text-lg font-black text-titos-white">{league.name}</h3>
                  <span className="text-titos-gray-400 text-xs">Week {league.week.weekNumber} &middot; {formatDate(league.week.date)}</span>
                </div>
                <Link href={`/leagues/${league.slug}`} className="text-titos-gold text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:gap-2 transition-all">
                  Full Results <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Tier results — compact */}
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {league.week.tiers.slice(0, 8).map(tier => {
                    const tc = getTierColor(tier.tierNumber)
                    return (
                      <div key={tier.tierNumber} className="bg-titos-surface rounded-lg p-2.5" style={{ borderLeft: `2px solid var(--color-${tc.accent})` }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-bold uppercase ${tc.text}`}>Tier {tier.tierNumber}</span>
                          <span className="text-titos-gray-600 text-[9px]">Court {tier.courtNumber}</span>
                        </div>
                        <div className="space-y-0.5">
                          {tier.teams.map((team, idx) => (
                            <div key={team.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className={cn(
                                  'w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black',
                                  idx === 0 ? 'bg-titos-gold/20 text-titos-gold' :
                                  idx === 2 ? 'bg-status-live/15 text-status-live' :
                                  'bg-titos-charcoal text-titos-gray-400'
                                )}>
                                  {team.finishPosition || idx + 1}
                                </span>
                                <span className="text-titos-white text-xs font-medium truncate">{team.name}</span>
                              </div>
                              {team.movement && (
                                <span className={cn(
                                  'text-[9px] font-bold',
                                  team.movement === 'up' ? 'text-status-success' :
                                  team.movement === 'down' ? 'text-status-live' :
                                  'text-titos-gray-600'
                                )}>
                                  {team.movement === 'up' ? '↑' : team.movement === 'down' ? '↓' : '—'}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
