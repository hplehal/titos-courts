'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, ChevronUp, ChevronDown, ChevronDown as ChevronIcon, Clock } from 'lucide-react'
import LeagueSelector from '@/components/ui/LeagueSelector'
import { cn, formatDate, getSlotInfo, getTeamAbbreviation } from '@/lib/utils'

/* ─── Compute team stats from matches ─── */
function computeTeamStats(teams, matches) {
  const stats = {}
  for (const t of teams) stats[t.name] = { wins: 0, losses: 0, diff: 0 }
  for (const m of matches) {
    if (!m.scores) continue
    const parts = m.scores.split(',').map(s => s.trim())
    for (const part of parts) {
      const [h, a] = part.split('-').map(Number)
      if (isNaN(h) || isNaN(a)) continue
      if (h > a) {
        if (stats[m.homeTeam]) { stats[m.homeTeam].wins++; stats[m.homeTeam].diff += (h - a) }
        if (stats[m.awayTeam]) { stats[m.awayTeam].losses++; stats[m.awayTeam].diff -= (h - a) }
      } else {
        if (stats[m.awayTeam]) { stats[m.awayTeam].wins++; stats[m.awayTeam].diff += (a - h) }
        if (stats[m.homeTeam]) { stats[m.homeTeam].losses++; stats[m.homeTeam].diff -= (a - h) }
      }
    }
  }
  return stats
}

/* ═══════════════════════════════════════════════
   COMPACT TIER CARD — clickable, shows teams only
   ═══════════════════════════════════════════════ */
function TierCard({ tier, slotColorVar, isSelected, onClick }) {
  const teams = tier.teams || []
  const matches = tier.matches || []
  const stats = computeTeamStats(teams, matches)

  // Sort by finishPosition if available, otherwise by wins desc, then diff desc
  const sorted = [...teams].sort((a, b) => {
    if (a.finishPosition && b.finishPosition) return a.finishPosition - b.finishPosition
    const sa = stats[a.name] || { wins: 0, diff: 0 }
    const sb = stats[b.name] || { wins: 0, diff: 0 }
    if (sb.wins !== sa.wins) return sb.wins - sa.wins
    return sb.diff - sa.diff
  })

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl overflow-hidden transition-all duration-200 cursor-pointer',
        isSelected
          ? 'ring-2 ring-titos-gold/40 shadow-lg shadow-titos-gold/10'
          : 'ring-1 ring-white/[0.06] hover:ring-white/[0.12]',
      )}
      style={{
        background: isSelected
          ? 'linear-gradient(180deg, rgba(242,165,39,0.08) 0%, rgba(22,22,22,1) 100%)'
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
        </div>
        <div className="flex items-center gap-2">
          <span className="text-titos-gray-400 text-sm sm:text-xs font-medium">Court {tier.courtNumber}</span>
          <div className={cn(
            'w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200',
            isSelected ? 'bg-titos-gold/15 text-titos-gold rotate-180' : 'text-titos-gray-500'
          )}>
            <ChevronIcon className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Column labels */}
      <div className="px-3 pb-1.5 flex items-center gap-3">
        <div className="w-8 sm:w-6 flex-shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-titos-gray-500 flex-1">Team</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-titos-gray-500 w-6 text-center">W</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-titos-gray-500 w-6 text-center">L</span>
        <span className="w-4 flex-shrink-0" />
      </div>

      {/* Teams */}
      <div className="px-3 pb-3 space-y-1.5 sm:space-y-1">
        {sorted.map((t, idx) => {
          const s = stats[t.name] || { wins: 0, losses: 0 }
          return (
            <div key={t.name} className={cn(
              'flex items-center gap-3 px-3 py-3 sm:py-2 rounded-xl',
              idx === 0 ? 'bg-white/[0.03]' : ''
            )}>
              <div className={cn(
                'w-8 h-8 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-xs sm:text-[11px] font-black flex-shrink-0',
                idx === 0 ? 'bg-titos-gold/20 text-titos-gold' :
                idx === 2 ? 'bg-status-live/12 text-status-live' :
                'bg-white/[0.06] text-titos-gray-400'
              )}>{idx + 1}</div>
              <span className="text-sm sm:text-base font-semibold text-titos-white flex-1 min-w-0 truncate">{t.name}</span>
              {/* W */}
              <span className="text-sm font-bold text-status-success flex-shrink-0 w-6 text-center tabular-nums">{s.wins}</span>
              {/* L */}
              <span className="text-sm font-bold text-status-live flex-shrink-0 w-6 text-center tabular-nums">{s.losses}</span>
              {/* Movement */}
              {t.movement === 'up' ? (
                <span className="text-status-success flex-shrink-0"><ChevronUp className="w-4 h-4" /></span>
              ) : t.movement === 'down' ? (
                <span className="text-status-live flex-shrink-0"><ChevronDown className="w-4 h-4" /></span>
              ) : (
                <span className="text-titos-gray-500 flex-shrink-0 text-xs font-bold w-4 text-center">—</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   EXPANDED PANEL — full-width below grid
   ═══════════════════════════════════════════════ */
function ResultPanel({ tier, slotColorVar, compact = false }) {
  const teams = tier.teams || []
  const matches = tier.matches || []
  const stats = computeTeamStats(teams, matches)

  const sorted = [...teams].sort((a, b) => {
    if (a.finishPosition && b.finishPosition) return a.finishPosition - b.finishPosition
    const sa = stats[a.name] || { wins: 0, diff: 0 }
    const sb = stats[b.name] || { wins: 0, diff: 0 }
    if (sb.wins !== sa.wins) return sb.wins - sa.wins
    return sb.diff - sa.diff
  })

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
        {/* Left: Team standings — hidden on compact (mobile inline) since tier card above shows W/L */}
        <div className={cn(
          'lg:w-72 flex-shrink-0',
          compact && 'hidden'
        )}>
          <span className="text-titos-gray-400 text-xs font-bold uppercase tracking-wider block mb-3">Standings</span>
          <div className="space-y-2">
            {sorted.map((t, idx) => {
              const s = stats[t.name] || { wins: 0, losses: 0, diff: 0 }
              return (
                <div key={t.name} className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                  idx === 0 ? 'bg-titos-gold/[0.05] ring-1 ring-titos-gold/10' : 'bg-titos-elevated/60'
                )}>
                  <span className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0',
                    idx === 0 ? 'bg-titos-gold/20 text-titos-gold' :
                    idx === 2 ? 'bg-status-live/12 text-status-live' :
                    'bg-white/[0.06] text-titos-gray-400'
                  )}>{idx + 1}</span>
                  <span className="text-sm font-semibold text-titos-white flex-1 min-w-0">{t.name}</span>
                  <span className="text-xs font-bold text-status-success flex-shrink-0">{s.wins}W</span>
                  <span className="text-xs font-bold text-status-live flex-shrink-0">{s.losses}L</span>
                  <span className={cn(
                    'text-xs font-bold flex-shrink-0 w-8 text-right',
                    s.diff > 0 ? 'text-status-success' : s.diff < 0 ? 'text-status-live' : 'text-titos-gray-500'
                  )}>{s.diff > 0 ? '+' : ''}{s.diff}</span>
                  {t.movement === 'up' ? (
                    <ChevronUp className="w-4 h-4 text-status-success flex-shrink-0" />
                  ) : t.movement === 'down' ? (
                    <ChevronDown className="w-4 h-4 text-status-live flex-shrink-0" />
                  ) : (
                    <span className="w-4 text-center text-titos-gray-500 text-xs font-bold flex-shrink-0">—</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Match scores */}
        <div className="flex-1 min-w-0">
          <span className="text-titos-gray-400 text-xs font-bold uppercase tracking-wider block mb-3">
            Matches ({matches.length})
          </span>
          {matches.length > 0 ? (
            <div className="space-y-1.5">
              {matches.map((m, i) => {
                if (!m.scores) return null
                const parts = m.scores.split(',').map(s => s.trim())
                let hW = 0, aW = 0
                for (const p of parts) {
                  const [h, a] = p.split('-').map(Number)
                  if (h > a) hW++; else aW++
                }
                const homeWon = hW > aW
                const awayWon = aW > hW

                return (
                  <div key={i} className={cn('flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-xl bg-titos-elevated/40')}>
                    <span className={cn('flex-1 text-right text-sm font-semibold truncate', homeWon ? 'text-titos-gold' : 'text-titos-white')}>
                      {m.homeTeam}
                    </span>
                    <span className="flex-shrink-0 px-2 py-0.5 rounded-md bg-titos-surface text-xs font-mono font-bold text-titos-gray-300 min-w-[52px] text-center">
                      {m.scores}
                    </span>
                    <span className={cn('flex-1 text-left text-sm font-semibold truncate', awayWon ? 'text-titos-gold' : 'text-titos-white')}>
                      {m.awayTeam}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-titos-gray-500 text-sm">No match scores recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   SLOT GROUP — manages which tier is expanded
   ═══════════════════════════════════════════════ */
function SlotGroup({ slot, tiers }) {
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
        <span className="text-titos-gray-500 text-xs hidden sm:block">Tap a tier to see scores</span>
      </div>

      {/* Grid + expanded panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {sorted.map(tier => (
          <Fragment key={tier.tierNumber}>
            <TierCard
              tier={tier}
              slotColorVar={slotColorVar}
              isSelected={expandedTier === tier.tierNumber}
              onClick={() => setExpandedTier(expandedTier === tier.tierNumber ? null : tier.tierNumber)}
            />
            {/* MOBILE ONLY — inline panel appears directly below the clicked card */}
            {expandedTier === tier.tierNumber && (
              <div className="sm:hidden">
                <ResultPanel tier={tier} slotColorVar={slotColorVar} compact />
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
              <ResultPanel tier={tier} slotColorVar={slotColorVar} />
            </div>
          )
        })()}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MAIN RESULTS CLIENT
   ═══════════════════════════════════════════════ */
export default function ResultsClient({ leagues, initialSlug }) {
  const router = useRouter()
  const [selected, setSelected] = useState(initialSlug || leagues[0]?.slug || '')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState(null)

  // Keep the URL in sync with the selected league for shareable deep links
  const handleSelect = (slug) => {
    setSelected(slug)
    router.replace(`/results/${slug}`, { scroll: false })
  }

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    setSelectedWeek(null)
    fetch(`/api/leagues/${selected}/schedule`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        const completed = (d.weeks || []).filter(w => w.status === 'completed' && w.tiers?.some(t => t.matches?.some(m => m.scores)))
        if (completed.length > 0) {
          setSelectedWeek(completed[completed.length - 1].weekNumber)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [selected])

  const completedWeeks = (data?.weeks || []).filter(w => w.status === 'completed' && w.tiers?.some(t => t.matches?.some(m => m.scores)))
  const currentWeekData = data?.weeks?.find(w => w.weekNumber === selectedWeek)

  // Group tiers by slot
  const tiersBySlot = {}
  if (currentWeekData?.tiers) {
    for (const t of currentWeekData.tiers) {
      const slot = t.timeSlot || 'single'
      if (!tiersBySlot[slot]) tiersBySlot[slot] = []
      tiersBySlot[slot].push(t)
    }
  }

  return (
    <div className="py-10 sm:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <span className="section-label">Scores & Standings</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-titos-white leading-none">RESULTS</h1>
        </div>

        <div className="mb-6">
          <LeagueSelector leagues={leagues} selected={selected} onSelect={handleSelect} />
        </div>

        {loading ? (
          <div>
            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map(i => <div key={i} className="w-16 h-10 rounded-lg bg-titos-charcoal animate-pulse" />)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-xl bg-titos-card ring-1 ring-titos-border/20 p-5 animate-pulse">
                  <div className="h-4 bg-titos-charcoal rounded w-20 mb-4" />
                  <div className="space-y-3">
                    <div className="h-8 bg-titos-charcoal/50 rounded-xl" />
                    <div className="h-8 bg-titos-charcoal/50 rounded-xl" />
                    <div className="h-8 bg-titos-charcoal/50 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : completedWeeks.length === 0 ? (
          <div className="rounded-xl bg-titos-card ring-1 ring-titos-border/20 p-10 sm:p-16 text-center">
            <Trophy className="w-10 h-10 text-titos-gray-500 mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold text-titos-white mb-2">No Results Yet</h3>
            <p className="text-titos-gray-400 text-sm max-w-md mx-auto">
              Results will appear here once matches are completed.
            </p>
          </div>
        ) : (
          <div>
            {/* Week selector */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {completedWeeks.map(w => (
                <button
                  key={w.weekNumber}
                  onClick={() => setSelectedWeek(w.weekNumber)}
                  className={cn(
                    'flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 min-h-[44px] cursor-pointer',
                    selectedWeek === w.weekNumber
                      ? 'bg-titos-gold/15 text-titos-gold ring-1 ring-titos-gold/30'
                      : 'bg-titos-card text-titos-gray-400 ring-1 ring-titos-border/20 hover:text-titos-white hover:ring-titos-border-light'
                  )}
                >
                  Week {w.weekNumber}
                </button>
              ))}
            </div>

            {/* Week info */}
            {currentWeekData && (
              <div className="flex items-center gap-3 mb-5">
                <h2 className="font-display text-lg font-black text-titos-white">
                  Week {currentWeekData.weekNumber}
                </h2>
                <span className="text-titos-gray-400 text-sm">{formatDate(currentWeekData.date)}</span>
                <span className="px-2 py-0.5 rounded-md bg-status-success/12 text-status-success text-[11px] font-bold uppercase">
                  Completed
                </span>
              </div>
            )}

            {/* Tier results by slot — same interaction as Schedule */}
            {currentWeekData?.tiers?.length > 0 ? (
              <div className="space-y-8 sm:space-y-10">
                {['early', 'late', 'single'].map(slot => {
                  const slotTiers = tiersBySlot[slot]
                  if (!slotTiers?.length) return null
                  return <SlotGroup key={slot} slot={slot} tiers={slotTiers} />
                })}
              </div>
            ) : (
              <div className="rounded-xl bg-titos-card ring-1 ring-titos-border/20 p-8 text-center">
                <p className="text-titos-gray-400 text-sm">No tier data available for this week.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
