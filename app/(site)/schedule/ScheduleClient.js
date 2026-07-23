'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Clock, Users } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import LeagueSelector from '@/components/ui/LeagueSelector'
import TeamFilter from '@/components/ui/TeamFilter'
import StatusBadge from '@/components/ui/StatusBadge'
import { useMyTeam } from '@/lib/hooks/useMyTeam'
import { cn, formatDate, getSlotInfo, getTeamAbbreviation } from '@/lib/utils'

export default function ScheduleClient({ leagues }) {
  const [selected, setSelected] = useState(leagues[0]?.slug || '')
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [myTeam, setMyTeam] = useMyTeam(selected)

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    fetch(`/api/leagues/${selected}/schedule`)
      .then(r => r.json())
      .then(data => { setSchedule(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selected])

  const activeWeek = schedule?.weeks?.find(w => w.status === 'active')
  const nextUpcoming = schedule?.weeks?.find(w => w.status === 'upcoming')
  const currentGameWeek = activeWeek || nextUpcoming

  // Find my team's tier info
  const myTierInfo = currentGameWeek && myTeam ? (() => {
    for (const tier of (currentGameWeek.tiers || [])) {
      const found = tier.teams?.find(t => t.name === myTeam)
      if (found) {
        const slot = getSlotInfo(tier.tierNumber, tier.timeSlot)
        const opponents = tier.teams.filter(t => t.name !== myTeam).map(t => t.name)
        return { tier: tier.tierNumber, court: tier.courtNumber, timeSlot: tier.timeSlot, slotLabel: slot.label, opponents, slot }
      }
    }
    return null
  })() : null

  // All team names
  const allTeams = new Set()
  for (const week of (schedule?.weeks || [])) {
    for (const tier of (week.tiers || [])) {
      for (const t of (tier.teams || [])) allTeams.add(t.name)
    }
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <span className="text-titos-gold text-xs font-bold uppercase tracking-[0.2em] mb-2 block">Game Nights</span>
          <h1 className="text-4xl sm:text-5xl font-black text-titos-white leading-none">SCHEDULE</h1>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
          <LeagueSelector leagues={leagues} selected={selected} onSelect={setSelected} />
          {[...allTeams].length > 0 && (
            <TeamFilter teams={[...allTeams].sort()} selected={myTeam} onSelect={setMyTeam} />
          )}
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card rounded-xl p-8 animate-pulse"><div className="h-6 bg-titos-charcoal rounded w-1/3" /></div>)}</div>
        ) : (
          <div>
            {/* ═══ MY TEAM HERO CARD ═══ */}
            {myTeam && myTierInfo && currentGameWeek && (
              <div className="mb-10 relative overflow-hidden rounded-2xl" style={{ background: `linear-gradient(135deg, ${myTierInfo.slot.color === 'text-slot-early' ? 'rgba(10,132,255,0.15)' : myTierInfo.slot.color === 'text-slot-late' ? 'rgba(191,90,242,0.15)' : 'rgba(48,209,88,0.15)'}, transparent)` }}>
                <div className="absolute inset-0 bg-titos-elevated/80" />
                <div className="relative p-6 sm:p-8">
                  <span className="text-titos-gold text-[10px] font-bold uppercase tracking-[0.2em] block mb-1">Next Game · {formatDate(currentGameWeek.date)}</span>
                  <h2 className="font-display text-2xl sm:text-3xl font-black text-titos-white mb-6">{myTeam}</h2>

                  <div className="grid grid-cols-3 gap-4 sm:gap-8">
                    <div>
                      <span className="text-titos-gray-500 text-[9px] font-bold uppercase tracking-wider block mb-1">When</span>
                      <span className={cn('font-display text-xl sm:text-2xl font-black', myTierInfo.slot.color)}>{myTierInfo.slotLabel}</span>
                    </div>
                    <div>
                      <span className="text-titos-gray-500 text-[9px] font-bold uppercase tracking-wider block mb-1">Court</span>
                      <span className="font-display text-xl sm:text-2xl font-black text-titos-white">{myTierInfo.court}</span>
                      <span className="text-titos-gray-500 text-xs block">Tier {myTierInfo.tier}</span>
                    </div>
                    <div>
                      <span className="text-titos-gray-500 text-[9px] font-bold uppercase tracking-wider block mb-1">Opponents</span>
                      {myTierInfo.opponents.map(opp => (
                        <span key={opp} className="font-display text-base sm:text-lg font-black text-titos-white block leading-tight">{opp}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ CURRENT WEEK SCHEDULE ═══ */}
            {currentGameWeek && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="font-display text-xl font-black text-titos-white">
                    {currentGameWeek.weekNumber === 1 ? 'Placement Week' : `Week ${currentGameWeek.weekNumber}`}
                  </h3>
                  <span className="text-titos-gray-400 text-sm">{formatDate(currentGameWeek.date)}</span>
                  <StatusBadge status={currentGameWeek.status} />
                </div>

                {currentGameWeek.tiers?.length > 0 ? (
                  <div className="space-y-8">
                    {['early', 'late', 'single'].map(slot => {
                      const slotTiers = currentGameWeek.tiers.filter(t => t.timeSlot === slot)
                      if (!slotTiers.length) return null
                      const slotInfo = getSlotInfo(slotTiers[0].tierNumber, slot)
                      const slotColorVar = slot === 'early' ? 'slot-early' : slot === 'late' ? 'slot-late' : 'slot-single'

                      return (
                        <div key={slot}>
                          {/* Time slot header — bold and colored */}
                          <div className="flex items-center gap-4 mb-4">
                            <div className={cn('px-4 py-2 rounded-lg font-display text-sm font-black uppercase tracking-wider', slotInfo.bg, slotInfo.color, slotInfo.border, 'border')}>
                              <Clock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                              {slotInfo.label}
                            </div>
                            <div className="flex-1 h-px" style={{ background: `var(--color-${slotColorVar})`, opacity: 0.2 }} />
                          </div>

                          {/* Court grid */}
                          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {slotTiers.sort((a, b) => a.tierNumber - b.tierNumber).map(tier => {
                              const isMyTier = myTeam && tier.teams?.some(t => t.name === myTeam)

                              return (
                                <div
                                  key={tier.tierNumber}
                                  className={cn(
                                    'rounded-xl overflow-hidden border transition-all',
                                    isMyTier
                                      ? 'border-titos-gold bg-titos-gold/[0.06] shadow-lg shadow-titos-gold/10'
                                      : 'border-titos-border/40 bg-titos-card'
                                  )}
                                >
                                  {/* Header */}
                                  <div
                                    className="px-4 py-2.5 flex items-center justify-between"
                                    style={{ borderBottom: `2px solid var(--color-${slotColorVar})` }}
                                  >
                                    <span className={cn('font-display text-xs font-black uppercase tracking-wider', slotInfo.color)}>
                                      Tier {tier.tierNumber}
                                    </span>
                                    <span className="font-display text-lg font-black text-titos-white">
                                      Court {tier.courtNumber}
                                    </span>
                                  </div>

                                  {/* Teams */}
                                  <div className="p-3 space-y-1">
                                    {tier.teams?.map(t => {
                                      const isMe = myTeam === t.name
                                      return (
                                        <div key={t.id || t.name} className={cn(
                                          'px-3 py-2 rounded-lg text-sm font-semibold',
                                          isMe
                                            ? 'bg-titos-gold/15 text-titos-gold border border-titos-gold/25'
                                            : 'text-titos-white'
                                        )}>
                                          {t.name}
                                          {isMe && <span className="text-[9px] uppercase tracking-wider font-bold ml-2 opacity-70">YOU</span>}
                                        </div>
                                      )
                                    })}
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
                  <div className="card rounded-xl p-8 text-center">
                    <p className="text-titos-gray-500 text-sm">Schedule not yet available for this week.</p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ SEASON TIMELINE ═══ */}
            <div className="section-line mb-6" />
            <span className="text-titos-gray-400 text-xs font-bold uppercase tracking-[0.15em] mb-4 block">All Weeks</span>
            <div className="flex flex-wrap gap-2">
              {schedule?.weeks?.map(week => (
                <div key={week.id} className={cn(
                  'w-16 h-16 rounded-xl flex flex-col items-center justify-center text-center transition-all',
                  week.id === currentGameWeek?.id
                    ? 'bg-titos-gold/15 border border-titos-gold/40 ring-2 ring-titos-gold/20'
                    : week.status === 'completed'
                    ? 'bg-status-success/10 border border-status-success/20'
                    : 'bg-titos-card border border-titos-border/30'
                )}>
                  <span className={cn('font-display text-base font-black',
                    week.id === currentGameWeek?.id ? 'text-titos-gold' :
                    week.status === 'completed' ? 'text-status-success' :
                    'text-titos-gray-400'
                  )}>
                    {week.weekNumber}
                  </span>
                  <span className={cn('text-[8px] uppercase font-bold',
                    week.id === currentGameWeek?.id ? 'text-titos-gold/70' :
                    week.status === 'completed' ? 'text-status-success/60' :
                    'text-titos-gray-600'
                  )}>
                    {week.weekNumber === 1 ? 'PLT' : week.isPlayoff ? 'PO' : week.status === 'completed' ? 'Done' : formatDate(week.date).split(',')[0]?.trim().slice(0, 6)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
