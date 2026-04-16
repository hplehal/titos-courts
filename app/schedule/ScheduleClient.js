'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, ChevronDown, Shield } from 'lucide-react'
import LeagueSelector from '@/components/ui/LeagueSelector'
import TeamFilter from '@/components/ui/TeamFilter'
import StatusBadge from '@/components/ui/StatusBadge'
import { useMyTeam } from '@/lib/hooks/useMyTeam'
import { cn, formatDate, getSlotInfo, getTeamAbbreviation } from '@/lib/utils'

/* ─── Round-robin generator ───
   Pattern per round (3 teams A, B, C):
     A vs C  | ref: B
     B vs A  | ref: C
     C vs B  | ref: A
   Repeated for each round (COED = 2 rounds / 6 games, MENS = 3 rounds / 9 games)
*/
function generateRoundRobin(teams, numRounds = 2) {
  if (teams.length < 3) return []
  const [a, b, c] = teams
  const games = []
  for (let r = 0; r < numRounds; r++) {
    games.push(
      { round: r + 1, game: r * 3 + 1, home: a, away: c, ref: b },
      { round: r + 1, game: r * 3 + 2, home: b, away: a, ref: c },
      { round: r + 1, game: r * 3 + 3, home: c, away: b, ref: a },
    )
  }
  return games
}

/* ═══════════════════════════════════════════════
   TIER CARD — compact, clickable
   ═══════════════════════════════════════════════ */
function TierCard({ tier, myTeam, slotColorVar, isSelected, onClick }) {
  const isMyTier = myTeam && tier.teams?.some(t => t.name === myTeam)

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl overflow-hidden transition-all duration-200 cursor-pointer',
        isSelected
          ? 'ring-2 ring-titos-gold/40 shadow-lg shadow-titos-gold/10'
          : isMyTier
            ? 'ring-2 ring-titos-gold/20 shadow-md shadow-titos-gold/5'
            : 'ring-1 ring-white/[0.06] hover:ring-white/[0.12]',
      )}
      style={{
        background: isSelected
          ? 'linear-gradient(180deg, rgba(242,165,39,0.08) 0%, rgba(22,22,22,1) 100%)'
          : isMyTier
            ? 'linear-gradient(180deg, rgba(242,165,39,0.04) 0%, rgba(22,22,22,1) 100%)'
            : 'linear-gradient(180deg, rgba(30,30,30,1) 0%, rgba(22,22,22,1) 100%)',
      }}
    >
      {/* Accent bar */}
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, var(--color-${slotColorVar}), transparent)` }} />

      {/* Header */}
      <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-lg sm:text-base font-black" style={{ color: `var(--color-${slotColorVar})` }}>
            Tier {tier.tierNumber}
          </span>
          {isMyTier && (
            <span className="px-1.5 py-0.5 rounded-md bg-titos-gold/12 text-titos-gold text-[11px] font-bold uppercase tracking-wider leading-none">You</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-titos-gray-400 text-sm sm:text-xs font-medium">Court {tier.courtNumber}</span>
          <div className={cn(
            'w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200',
            isSelected ? 'bg-titos-gold/15 text-titos-gold rotate-180' : 'text-titos-gray-500'
          )}>
            <ChevronDown className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Teams */}
      <div className="px-3 pb-3 space-y-1.5 sm:space-y-1">
        {tier.teams?.map((t, idx) => {
          const isMe = myTeam === t.name
          return (
            <div key={t.id || t.name} className={cn(
              'flex items-center gap-3 px-3 py-3 sm:py-2 rounded-xl transition-colors duration-150',
              isMe ? 'bg-titos-gold/10' : idx === 0 ? 'bg-white/[0.03]' : ''
            )}>
              <div className={cn(
                'w-8 h-8 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-xs sm:text-[11px] font-black flex-shrink-0',
                idx === 0 ? 'bg-titos-gold/20 text-titos-gold' :
                idx === 2 ? 'bg-status-live/12 text-status-live' :
                'bg-white/[0.06] text-titos-gray-400'
              )}>{idx + 1}</div>
              <span className={cn('text-sm sm:text-base font-semibold flex-1 min-w-0', isMe ? 'text-titos-gold' : 'text-titos-white')}>{t.name}</span>
              {t.movement && t.movement !== 'stay' && (
                <span className={cn('text-[11px] font-bold flex-shrink-0', t.movement === 'up' ? 'text-status-success' : 'text-status-live')}>
                  {t.movement === 'up' ? '▲' : '▼'}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MATCH PANEL — full-width below the grid
   ═══════════════════════════════════════════════ */
function MatchPanel({ tier, myTeam, slotColorVar, isMens, compact = false }) {
  const numRounds = isMens ? 3 : 2
  const teams = tier.teams || []
  const roundRobin = teams.length >= 3 ? generateRoundRobin(teams, numRounds) : []

  const findAPIMatch = (homeName, awayName) => {
    if (!tier.matches?.length) return null
    return tier.matches.find(m =>
      (m.homeTeam === homeName && m.awayTeam === awayName) ||
      (m.homeTeam === awayName && m.awayTeam === homeName)
    )
  }

  if (roundRobin.length === 0) return null

  return (
    <div
      className="col-span-full rounded-xl overflow-hidden ring-1 ring-titos-gold/15 animate-fade-in"
      style={{ background: 'linear-gradient(180deg, rgba(242,165,39,0.03) 0%, rgba(17,17,17,1) 100%)' }}
    >
      {/* Panel header — hidden on compact (mobile inline) since tier card above shows it */}
      {!compact && (
        <div className="px-5 py-3 flex items-center justify-between border-b border-titos-border/20">
          <div className="flex items-center gap-3">
            <span className="font-display text-base font-black" style={{ color: `var(--color-${slotColorVar})` }}>
              Tier {tier.tierNumber}
            </span>
            <span className="text-titos-gray-400 text-sm">Court {tier.courtNumber}</span>
          </div>
        </div>
      )}

      <div className={cn(
        'p-5 flex flex-col lg:flex-row gap-6',
        compact && 'pt-4 pb-4'
      )}>
        {/* Left: Team roster — hidden on compact (mobile inline) since tier card above shows it */}
        <div className={cn(
          'lg:w-56 flex-shrink-0',
          compact && 'hidden'
        )}>
          <span className="text-titos-gray-400 text-xs font-bold uppercase tracking-wider block mb-3">Teams</span>
          <div className="space-y-2">
            {teams.map((t, idx) => {
              const isMe = myTeam === t.name
              return (
                <div key={t.name} className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                  isMe ? 'bg-titos-gold/10 ring-1 ring-titos-gold/15' : 'bg-titos-elevated/60'
                )}>
                  <span className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0',
                    idx === 0 ? 'bg-titos-gold/20 text-titos-gold' :
                    idx === 2 ? 'bg-status-live/12 text-status-live' :
                    'bg-white/[0.06] text-titos-gray-400'
                  )}>{idx + 1}</span>
                  <span className={cn('text-sm font-semibold', isMe ? 'text-titos-gold' : 'text-titos-white')}>{t.name}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Match list */}
        <div className="flex-1 min-w-0">
          <span className="text-titos-gray-400 text-xs font-bold uppercase tracking-wider block mb-3">
            Matches ({roundRobin.length})
          </span>
          <div className="space-y-1.5">
            {roundRobin.map((game) => {
              const apiMatch = findAPIMatch(game.home.name, game.away.name)
              const isMyGame = myTeam && (game.home.name === myTeam || game.away.name === myTeam)

              let homeWon = false, awayWon = false, scoreDisplay = null
              if (apiMatch?.scores) {
                scoreDisplay = apiMatch.scores
                const parts = apiMatch.scores.split(',').map(s => s.trim())
                let hW = 0, aW = 0
                for (const p of parts) {
                  const [h, a] = p.split('-').map(Number)
                  if (h > a) hW++; else aW++
                }
                if (apiMatch.homeTeam === game.home.name) { homeWon = hW > aW; awayWon = aW > hW }
                else { homeWon = aW > hW; awayWon = hW > aW }
              }

              return (
                <div
                  key={game.game}
                  className={cn(
                    'flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-xl',
                    isMyGame ? 'bg-titos-gold/[0.06] ring-1 ring-titos-gold/10' : 'bg-titos-elevated/40'
                  )}
                >
                  {/* Home vs Away */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className={cn('text-sm font-semibold truncate', homeWon ? 'text-titos-gold' : 'text-titos-white')}>
                      {game.home.name}
                    </span>
                    <span className="text-titos-gray-500 text-xs flex-shrink-0">vs</span>
                    <span className={cn('text-sm font-semibold truncate', awayWon ? 'text-titos-gold' : 'text-titos-white')}>
                      {game.away.name}
                    </span>
                  </div>

                  {/* Score (if available) */}
                  {scoreDisplay && (
                    <span className="flex-shrink-0 px-2 py-0.5 rounded-md bg-titos-surface text-xs font-mono font-bold text-titos-gray-300">
                      {scoreDisplay}
                    </span>
                  )}

                  {/* Ref */}
                  <span className="text-titos-gray-500 text-xs flex-shrink-0 hidden sm:block">
                    ref: {game.ref.name}
                  </span>
                  <span className="text-titos-gray-500 text-xs flex-shrink-0 sm:hidden">
                    ref: {getTeamAbbreviation(game.ref.name)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   SLOT GROUP — manages which tier is expanded
   ═══════════════════════════════════════════════ */
function SlotGroup({ slot, tiers, myTeam, isMens }) {
  const [expandedTier, setExpandedTier] = useState(null)
  const slotInfo = getSlotInfo(tiers[0].tierNumber, slot)
  const slotColorVar = slot === 'early' ? 'slot-early' : slot === 'late' ? 'slot-late' : 'slot-single'
  const sorted = [...tiers].sort((a, b) => a.tierNumber - b.tierNumber)

  return (
    <div>
      {/* Slot header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wider"
          style={{
            background: `color-mix(in srgb, var(--color-${slotColorVar}) 10%, transparent)`,
            color: `var(--color-${slotColorVar})`,
            border: `1px solid color-mix(in srgb, var(--color-${slotColorVar}) 20%, transparent)`,
          }}
        >
          <Clock className="w-3.5 h-3.5" />
          {slotInfo.label}
        </div>
        <div className="flex-1 h-px" style={{ background: `color-mix(in srgb, var(--color-${slotColorVar}) 12%, transparent)` }} />
        <span className="text-titos-gray-500 text-xs hidden sm:block">Tap a tier to see matches</span>
      </div>

      {/* Grid + expanded panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {sorted.map((tier) => (
          <Fragment key={tier.tierNumber}>
            <TierCard
              tier={tier}
              myTeam={myTeam}
              slotColorVar={slotColorVar}
              isSelected={expandedTier === tier.tierNumber}
              onClick={() => setExpandedTier(expandedTier === tier.tierNumber ? null : tier.tierNumber)}
            />
            {/* MOBILE ONLY — inline panel appears directly below the clicked card */}
            {expandedTier === tier.tierNumber && (
              <div className="sm:hidden">
                <MatchPanel tier={tier} myTeam={myTeam} slotColorVar={slotColorVar} isMens={isMens} compact />
              </div>
            )}
          </Fragment>
        ))}

        {/* DESKTOP ONLY — full-width panel at the end of the grid row */}
        {expandedTier && (() => {
          const tier = sorted.find(t => t.tierNumber === expandedTier)
          if (!tier) return null
          return (
            <div className="hidden sm:block col-span-full">
              <MatchPanel tier={tier} myTeam={myTeam} slotColorVar={slotColorVar} isMens={isMens} />
            </div>
          )
        })()}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MAIN SCHEDULE CLIENT
   ═══════════════════════════════════════════════ */
export default function ScheduleClient({ leagues, initialSlug }) {
  const router = useRouter()
  const [selected, setSelected] = useState(initialSlug || leagues[0]?.slug || '')
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)

  // Sync URL with selected league for shareable deep links
  const handleSelect = (slug) => {
    setSelected(slug)
    router.replace(`/schedule/${slug}`, { scroll: false })
  }
  const [myTeam, setMyTeam] = useMyTeam(selected)

  const isMens = selected.includes('sunday') || selected.includes('mens')

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

  const myTierInfo = currentGameWeek && myTeam ? (() => {
    for (const tier of (currentGameWeek.tiers || [])) {
      const found = tier.teams?.find(t => t.name === myTeam)
      if (found) {
        const slot = getSlotInfo(tier.tierNumber, tier.timeSlot)
        const opponents = tier.teams.filter(t => t.name !== myTeam).map(t => t.name)
        return { tier: tier.tierNumber, court: tier.courtNumber, slotLabel: slot.label, opponents, slot }
      }
    }
    return null
  })() : null

  const allTeams = new Set()
  for (const week of (schedule?.weeks || [])) {
    for (const tier of (week.tiers || [])) {
      for (const t of (tier.teams || [])) allTeams.add(t.name)
    }
  }

  return (
    <div className="py-10 sm:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <span className="section-label">Game Nights</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-titos-white leading-none">SCHEDULE</h1>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
          <LeagueSelector leagues={leagues} selected={selected} onSelect={handleSelect} />
          {[...allTeams].length > 0 && (
            <TeamFilter teams={[...allTeams].sort()} selected={myTeam} onSelect={setMyTeam} />
          )}
        </div>

        {loading ? (
          <div>
            <div className="h-5 bg-titos-charcoal rounded w-48 mb-6 animate-pulse" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-xl bg-titos-card ring-1 ring-titos-border/20 p-4 animate-pulse">
                  <div className="h-4 bg-titos-charcoal rounded w-16 mb-4" />
                  <div className="space-y-2">
                    <div className="h-8 bg-titos-charcoal/50 rounded-xl" />
                    <div className="h-8 bg-titos-charcoal/50 rounded-xl" />
                    <div className="h-8 bg-titos-charcoal/50 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* My team hero */}
            {myTeam && myTierInfo && currentGameWeek && (
              <div className="mb-8 sm:mb-10 relative overflow-hidden rounded-xl ring-1 ring-titos-gold/15"
                style={{
                  background: `linear-gradient(135deg, ${
                    myTierInfo.slot.color === 'text-slot-early' ? 'rgba(10,132,255,0.1)' :
                    myTierInfo.slot.color === 'text-slot-late' ? 'rgba(191,90,242,0.1)' :
                    'rgba(48,209,88,0.1)'
                  }, rgba(17,17,17,0.95))`,
                }}
              >
                <div className="p-5 sm:p-8">
                  <span className="text-titos-gold text-[11px] font-bold uppercase tracking-[0.2em] block mb-1">
                    Next Game &middot; {formatDate(currentGameWeek.date)}
                  </span>
                  <h2 className="font-display text-xl sm:text-3xl font-black text-titos-white mb-5 sm:mb-6">{myTeam}</h2>
                  <div className="grid grid-cols-3 gap-3 sm:gap-8">
                    <div>
                      <span className="text-titos-gray-400 text-[11px] font-bold uppercase tracking-wider block mb-1">When</span>
                      <span className={cn('font-display text-base sm:text-2xl font-black', myTierInfo.slot.color)}>{myTierInfo.slotLabel}</span>
                    </div>
                    <div>
                      <span className="text-titos-gray-400 text-[11px] font-bold uppercase tracking-wider block mb-1">Court</span>
                      <span className="font-display text-base sm:text-2xl font-black text-titos-white">{myTierInfo.court}</span>
                      <span className="text-titos-gray-400 text-[11px] sm:text-xs block">Tier {myTierInfo.tier}</span>
                    </div>
                    <div>
                      <span className="text-titos-gray-400 text-[11px] font-bold uppercase tracking-wider block mb-1">vs</span>
                      {myTierInfo.opponents.map(opp => (
                        <span key={opp} className="font-display text-sm sm:text-lg font-black text-titos-white block leading-tight">{opp}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Current week */}
            {currentGameWeek && (
              <div className="mb-10">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5 sm:mb-6">
                  <h3 className="font-display text-lg sm:text-xl font-black text-titos-white">
                    {currentGameWeek.weekNumber === 1 ? 'Placement Week' : `Week ${currentGameWeek.weekNumber}`}
                  </h3>
                  <span className="text-titos-gray-400 text-xs sm:text-sm">{formatDate(currentGameWeek.date)}</span>
                  <StatusBadge status={currentGameWeek.status} />
                </div>

                {currentGameWeek.tiers?.length > 0 ? (
                  <div className="space-y-8 sm:space-y-10">
                    {['early', 'late', 'single'].map(slot => {
                      const slotTiers = currentGameWeek.tiers.filter(t => t.timeSlot === slot)
                      if (!slotTiers.length) return null
                      return <SlotGroup key={slot} slot={slot} tiers={slotTiers} myTeam={myTeam} isMens={isMens} />
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl bg-titos-card ring-1 ring-titos-border/20 p-8 text-center">
                    <p className="text-titos-gray-500 text-sm">Schedule not yet available for this week.</p>
                  </div>
                )}
              </div>
            )}

            {/* Season timeline */}
            <div className="section-line mb-5" />
            <span className="text-titos-gray-400 text-[11px] font-bold uppercase tracking-[0.15em] mb-3 block">Season</span>
            <div className="flex gap-2 sm:gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
              {schedule?.weeks?.map(week => {
                const isCurrent = week.id === currentGameWeek?.id
                const isDone = week.status === 'completed'
                return (
                  <div
                    key={week.id}
                    className={cn(
                      'w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex flex-col items-center justify-center text-center flex-shrink-0 transition-all duration-200',
                      isCurrent
                        ? 'bg-titos-card ring-2 ring-titos-gold shadow-lg shadow-titos-gold/20'
                        : isDone
                          ? 'bg-titos-card ring-1 ring-white/[0.08]'
                          : 'bg-titos-elevated ring-1 ring-white/[0.04]'
                    )}
                  >
                    <span className={cn(
                      'font-display text-sm sm:text-base font-black',
                      isCurrent ? 'text-titos-gold' :
                      isDone ? 'text-titos-white' : 'text-titos-gray-500'
                    )}>
                      {week.weekNumber}
                    </span>
                    <span className={cn(
                      'text-[11px] uppercase font-bold',
                      isCurrent ? 'text-titos-gold/70' :
                      isDone ? 'text-titos-gray-400' : 'text-titos-gray-500'
                    )}>
                      {week.weekNumber === 1 ? 'PLT' : week.isPlayoff ? 'PO' : isDone ? 'Done' : formatDate(week.date).split(',')[0]?.trim().slice(0, 6)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
