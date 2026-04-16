'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import LeagueSelector from '@/components/ui/LeagueSelector'
import TeamFilter from '@/components/ui/TeamFilter'
import { useMyTeam } from '@/lib/hooks/useMyTeam'
import { cn, getDivisionInfo, getTierColor, getSlotInfo, getMovementIcon, getLeagueTimeDisplay } from '@/lib/utils'

/* ─── Tier View Helpers ─── */

function groupTiersBySlot(tiers, selected) {
  const isMens = selected.includes('sunday') || selected.includes('mens')
  const groups = []
  const slotMap = {}

  for (const tier of tiers) {
    const slot = tier.timeSlot || (tier.tierNumber <= 4 ? 'early' : 'late')
    if (!slotMap[slot]) {
      let label, color, bg, border
      if (slot === 'single') {
        label = 'ALL COURTS (9 PM \u2013 12 AM)'
        color = 'text-slot-single'
        bg = 'bg-slot-single/10'
        border = 'border-slot-single/30'
      } else if (slot === 'early') {
        label = isMens ? 'EARLY SLOT (9 \u2013 10:30 PM)' : 'EARLY SLOT (8 \u2013 10 PM)'
        color = 'text-slot-early'
        bg = 'bg-slot-early/10'
        border = 'border-slot-early/30'
      } else {
        label = isMens ? 'LATE SLOT (10:30 PM \u2013 12 AM)' : 'LATE SLOT (10 PM \u2013 12 AM)'
        color = 'text-slot-late'
        bg = 'bg-slot-late/10'
        border = 'border-slot-late/30'
      }
      slotMap[slot] = { slot, label, color, bg, border, tiers: [] }
      groups.push(slotMap[slot])
    }
    slotMap[slot].tiers.push(tier)
  }

  return groups
}

/* ─── Loading Skeletons ─── */

function OverallSkeleton() {
  // Render 18 placeholder rows (splits the difference between MENS 15-team
  // and COED 24-team leagues) so the skeleton height is within ~100px of
  // the real table. Prevents large CLS when data arrives.
  return (
    <div className="card rounded-xl overflow-hidden min-h-[1200px]">
      <div className="px-5 py-3 border-b border-titos-border bg-titos-card animate-pulse">
        <div className="h-5 bg-titos-elevated rounded w-40" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse py-1">
            <div className="w-7 h-7 rounded-full bg-titos-elevated" />
            <div className="h-4 bg-titos-elevated rounded flex-1 max-w-48" />
            <div className="h-4 bg-titos-elevated rounded w-10" />
            <div className="h-4 bg-titos-elevated rounded w-10" />
            <div className="h-4 bg-titos-elevated rounded w-10" />
            <div className="h-4 bg-titos-elevated rounded w-14" />
          </div>
        ))}
      </div>
    </div>
  )
}

function TierSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2].map(group => (
        <div key={group}>
          <div className="animate-pulse mb-4">
            <div className="h-5 bg-titos-elevated rounded w-56" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-titos-card border border-titos-border rounded-xl overflow-hidden animate-pulse">
                <div className="h-[3px] bg-titos-elevated" />
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <div className="h-5 bg-titos-elevated rounded w-16" />
                    <div className="h-4 bg-titos-elevated rounded w-20" />
                  </div>
                  {[1, 2, 3].map(j => (
                    <div key={j} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-titos-elevated" />
                      <div className="h-4 bg-titos-elevated rounded flex-1" />
                      <div className="w-12 h-5 rounded-full bg-titos-elevated" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Tier Card Component ─── */

function TierCard({ tier, myTeam, selected }) {
  const tierColor = getTierColor(tier.tierNumber)
  const isMens = selected.includes('sunday') || selected.includes('mens')
  const containsMyTeam = myTeam && tier.teams.some(t => t.name === myTeam)

  const timeLabel = tier.timeSlot === 'single'
    ? '9 PM \u2013 12 AM'
    : isMens
      ? (tier.timeSlot === 'early' ? '9\u201310:30 PM' : '10:30 PM\u201312 AM')
      : (tier.timeSlot === 'early' ? '8\u201310 PM' : '10 PM\u201312 AM')

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden transition-all duration-200',
        containsMyTeam
          ? 'ring-2 ring-titos-gold/30 shadow-lg shadow-titos-gold/5'
          : 'ring-1 ring-white/[0.06] hover:ring-white/[0.1]'
      )}
      style={{
        background: containsMyTeam
          ? 'linear-gradient(180deg, rgba(242,165,39,0.06) 0%, rgba(22,22,22,1) 100%)'
          : 'linear-gradient(180deg, rgba(30,30,30,1) 0%, rgba(22,22,22,1) 100%)',
        borderTop: `3px solid var(--color-${tierColor.accent})`,
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className={cn('text-lg font-display font-black', tierColor.text)}
            >
              Tier {tier.tierNumber}
            </span>
          </div>
          <span className="text-titos-gray-400 text-xs">
            Court {tier.courtNumber} &middot; {timeLabel}
          </span>
        </div>

        {/* Team Rows */}
        <div className="space-y-1.5">
          {tier.teams.map(t => {
            const isMyTeam = myTeam && t.name === myTeam
            return (
              <div
                key={t.id}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors',
                  isMyTeam
                    ? 'bg-titos-gold/[0.08] border-l-2 border-l-titos-gold'
                    : 'bg-titos-surface/50'
                )}
              >
                {/* Position Badge */}
                {t.finishPosition != null && (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-bold shrink-0',
                      t.finishPosition === 1
                        ? 'bg-titos-gold/20 text-titos-gold'
                        : t.finishPosition === 2
                          ? 'bg-titos-gray-600/40 text-titos-gray-200'
                          : 'bg-status-live/15 text-status-live'
                    )}
                  >
                    #{t.finishPosition}
                  </span>
                )}

                {/* Team Name */}
                <span className={cn(
                  'text-sm font-semibold truncate flex-1',
                  isMyTeam ? 'text-titos-gold' : 'text-titos-white'
                )}>
                  {t.name}
                </span>

                {/* Movement Pill */}
                {t.movement && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 text-[11px] font-bold rounded-full px-2 py-0.5 shrink-0',
                      t.movement === 'up'
                        ? 'bg-status-success/15 text-status-success'
                        : t.movement === 'down'
                          ? 'bg-status-live/15 text-status-live'
                          : 'bg-titos-gray-600/20 text-titos-gray-400'
                    )}
                  >
                    {getMovementIcon(t.movement)}
                    <span className="uppercase text-[11px]">
                      {t.movement === 'up' ? 'UP' : t.movement === 'down' ? 'DOWN' : 'STAY'}
                    </span>
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── Slot Group Divider ─── */

function SlotDivider({ label, color }) {
  return (
    <div className="relative flex items-center gap-4 py-2">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-titos-border to-transparent" />
      <span className={cn('text-[11px] font-bold uppercase tracking-widest shrink-0', color)}>
        {label}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-titos-border to-transparent" />
    </div>
  )
}

/* ─── Main Component ─── */

export default function StandingsClient({ leagues, initialSlug, initialData }) {
  const router = useRouter()
  const initialForSelected = initialData && initialSlug === (initialSlug || leagues[0]?.slug || '')
  const [selected, setSelected] = useState(initialSlug || leagues[0]?.slug || '')
  const [standings, setStandings] = useState(initialForSelected ? (initialData?.standings || null) : null)
  const [tierView, setTierView] = useState(initialForSelected ? (initialData?.currentTiers || null) : null)
  const [view, setView] = useState('overall')
  const [loading, setLoading] = useState(!initialForSelected)
  const [myTeam, setMyTeam] = useMyTeam(selected)
  // Track whether we've consumed the SSR seed so tab-switches still refetch
  const seedConsumedRef = useRef(initialForSelected)

  // Sync URL with selected league for shareable deep links
  const handleSelect = (slug) => {
    setSelected(slug)
    router.replace(`/standings/${slug}`, { scroll: false })
  }

  useEffect(() => {
    if (!selected) return
    // Skip the very first fetch when we already have server-seeded data
    if (seedConsumedRef.current) {
      seedConsumedRef.current = false
      return
    }
    setLoading(true)
    fetch(`/api/leagues/${selected}/standings`)
      .then(r => r.json())
      .then(data => { setStandings(data.standings); setTierView(data.currentTiers); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selected])

  const slotGroups = tierView ? groupTiersBySlot(tierView, selected) : []

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionHeading label="RANKINGS" title="Season Standings" description="Overall league standings and current tier placements." />

        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <LeagueSelector leagues={leagues} selected={selected} onSelect={handleSelect} />

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

        {/* Team filter — always reserve 72px to prevent CLS when data loads */}
        <div className="mb-6 min-h-[56px]">
          {standings && standings.length > 0 && (
            <TeamFilter teams={standings.map(t => t.name)} selected={myTeam} onSelect={setMyTeam} />
          )}
        </div>


        {loading ? (
          view === 'overall' ? <OverallSkeleton /> : <TierSkeleton />
        ) : view === 'overall' && standings ? (
          /* ─── Overall Standings Table (unchanged) ─── */
          <div className="card rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-titos-border bg-titos-gold/5 flex items-center justify-between">
              <h3 className="font-display font-bold text-titos-gold flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Overall Standings
              </h3>
              <span className="text-titos-gray-400 text-[11px] uppercase tracking-wider hidden sm:block">PTS = Tier Factor + Sets Won</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-titos-border/50">
                    {['#', 'Team', 'SW', 'SL', '+/-', 'Tier', 'Sets', 'PTS', 'Div'].map(h => (
                      <th key={h} className={`px-2.5 py-3 text-[11px] font-semibold uppercase tracking-wider text-titos-gray-400 ${h === 'Team' ? 'text-left' : 'text-center'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {standings.map(team => {
                    const leagueType = (selected.includes('sunday') || selected.includes('mens')) ? 'mens' : 'coed'
                    const div = getDivisionInfo(team.rank, standings.length, leagueType)
                    return (
                      <tr key={team.id} className={cn('border-b border-titos-border/30 hover:bg-titos-card/50', div.bgClass, myTeam === team.name && 'bg-titos-gold/[0.08] border-l-2 border-l-titos-gold')}>
                        <td className="px-2.5 py-3 text-center">
                          <span className={cn('inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold', team.rank <= 3 ? 'bg-titos-gold/20 text-titos-gold' : 'text-titos-gray-400')}>{team.rank}</span>
                        </td>
                        <td className="px-2.5 py-3 text-left font-semibold text-titos-white text-sm">{team.name}</td>
                        <td className="px-2.5 py-3 text-center font-semibold text-status-success text-sm">{team.setsWon}</td>
                        <td className="px-2.5 py-3 text-center font-semibold text-status-live text-sm">{team.setsLost}</td>
                        <td className={`px-2.5 py-3 text-center font-bold text-sm ${team.pointDiff >= 0 ? 'text-status-success' : 'text-status-live'}`}>{team.pointDiff > 0 ? '+' : ''}{team.pointDiff}</td>
                        <td className="px-2.5 py-3 text-center text-titos-gray-400 text-sm">{team.basePoints || 0}</td>
                        <td className="px-2.5 py-3 text-center text-titos-gray-400 text-sm">{team.setsWon}</td>
                        <td className="px-2.5 py-3 text-center font-black text-titos-gold text-sm">{team.totalPoints}</td>
                        <td className="px-2.5 py-3 text-center"><span className="text-[11px] font-semibold">{div.name}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : view === 'tiers' && tierView ? (
          /* ─── Redesigned Tier View ─── */
          <div className="space-y-8">
            {slotGroups.map((group, gi) => (
              <div key={group.slot}>
                {/* Slot separator between groups */}
                {gi > 0 && (
                  <div className="mb-8">
                    <div className="h-px bg-gradient-to-r from-transparent via-titos-border to-transparent" />
                  </div>
                )}

                {/* Slot Header */}
                <div className={cn('flex items-center gap-3 mb-5 px-1')}>
                  <div className={cn('w-1.5 h-6 rounded-full', group.bg.replace('/10', '/40'))} />
                  <h3 className={cn('text-sm font-bold uppercase tracking-widest', group.color)}>
                    {group.label}
                  </h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-titos-border/50 to-transparent" />
                </div>

                {/* Tier Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {group.tiers.map(tier => (
                    <TierCard
                      key={tier.tierNumber}
                      tier={tier}
                      myTeam={myTeam}
                      selected={selected}
                    />
                  ))}
                </div>
              </div>
            ))}
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
