'use client'

import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import LeagueSelector from '@/components/ui/LeagueSelector'
import StatusBadge from '@/components/ui/StatusBadge'
import { cn, formatDate, getTierColor } from '@/lib/utils'

export default function ScheduleClient({ leagues }) {
  const [selected, setSelected] = useState(leagues[0]?.slug || '')
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    fetch(`/api/leagues/${selected}/schedule`)
      .then(r => r.json())
      .then(data => { setSchedule(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selected])

  const currentWeek = schedule?.weeks?.find(w => w.status === 'upcoming' || w.status === 'active')
  const selectedWeek = currentWeek || schedule?.weeks?.[schedule.weeks.length - 1]

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionHeading label="GAME NIGHTS" title="Schedule" description="Weekly matchups, court assignments, and tier schedules." />

        <div className="mt-8 mb-8">
          <LeagueSelector leagues={leagues} selected={selected} onSelect={setSelected} />
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card rounded-xl p-6 animate-pulse"><div className="h-6 bg-titos-charcoal rounded w-1/3" /></div>)}</div>
        ) : schedule?.weeks ? (
          <div>
            {/* This week highlight */}
            {selectedWeek && (
              <div className="mb-8">
                <h3 className="font-display text-lg font-bold text-titos-white mb-4 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-titos-gold" />
                  {selectedWeek.status === 'upcoming' ? 'Next Game Night' : `Week ${selectedWeek.weekNumber}`}
                  — {formatDate(selectedWeek.date)}
                </h3>

                {selectedWeek.tiers && selectedWeek.tiers.length > 0 ? (
                  <div className="space-y-3">
                    {/* Group by time slot */}
                    {['single', 'early', 'late'].map(slot => {
                      const slotTiers = selectedWeek.tiers.filter(t => t.timeSlot === slot)
                      if (!slotTiers.length) return null
                      return (
                        <div key={slot}>
                          <h4 className="text-titos-gold text-sm font-bold uppercase mb-2">
                            {slot === 'single' ? '9:00 PM – 12:00 AM' : slot === 'early' ? '8:00 PM – 10:00 PM' : '10:00 PM – 12:00 AM'}
                          </h4>
                          <div className="grid sm:grid-cols-2 gap-3">
                            {slotTiers.map(tier => {
                              const tc = getTierColor(tier.tierNumber)
                              return (
                                <div key={tier.tierNumber} className="card rounded-xl overflow-hidden">
                                  <div className={`px-4 py-2 border-b border-titos-border flex items-center justify-between ${tc.bg}`}>
                                    <span className={`font-display font-bold text-sm ${tc.text}`}>Tier {tier.tierNumber}</span>
                                    <span className="text-titos-gray-400 text-xs">Court {tier.courtNumber}</span>
                                  </div>
                                  <div className="p-3">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                      {tier.teams.map(t => (
                                        <span key={t.id} className="text-titos-white text-xs bg-titos-surface rounded px-2 py-1">{t.name}</span>
                                      ))}
                                    </div>
                                    {tier.matches.length > 0 && (
                                      <div className="space-y-1">
                                        {tier.matches.map((m, i) => (
                                          <div key={i} className="flex items-center justify-between text-xs text-titos-gray-300 bg-titos-surface/50 rounded px-2 py-1">
                                            <span>{m.homeTeam} vs {m.awayTeam}</span>
                                            {m.scores && <span className="text-titos-gray-400">{m.scores}</span>}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-titos-gray-400 text-sm">Schedule details will be available closer to game day.</p>
                )}
              </div>
            )}

            {/* Season Calendar */}
            <h3 className="font-display text-lg font-bold text-titos-white mb-4">Season Calendar</h3>
            <div className="space-y-2">
              {schedule.weeks.map(week => (
                <div key={week.id} className="card rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      week.isPlayoff ? 'bg-titos-gold/20 text-titos-gold' : 'bg-titos-card text-titos-gray-300'
                    )}>{week.weekNumber}</span>
                    <div>
                      <span className="text-titos-white text-sm font-medium">
                        {week.isPlayoff ? 'Playoffs' : week.weekNumber === 1 ? 'Placement' : `Week ${week.weekNumber}`}
                      </span>
                      <span className="text-titos-gray-400 text-sm ml-2">{formatDate(week.date)}</span>
                    </div>
                  </div>
                  <StatusBadge status={week.status} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card rounded-xl p-8 text-center">
            <p className="text-titos-gray-400">No schedule data available.</p>
          </div>
        )}
      </div>
    </div>
  )
}
