'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Trophy, ChevronUp, ChevronDown, Minus } from 'lucide-react'
import { cn, formatDate, getTierColor } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Skeleton placeholder shown while the API call is in flight
// ---------------------------------------------------------------------------
function SkeletonCard() {
  return (
    <div className="bg-titos-card rounded-xl p-3 animate-pulse" style={{ borderLeft: '3px solid var(--color-titos-border)' }}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="h-3 w-14 rounded bg-titos-charcoal" />
        <div className="h-2.5 w-16 rounded bg-titos-charcoal" />
      </div>
      <div className="space-y-1.5">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-titos-charcoal shrink-0" />
            <div className="h-3 rounded bg-titos-charcoal" style={{ width: `${60 + i * 12}%` }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Movement indicator arrow
// ---------------------------------------------------------------------------
function MovementArrow({ movement }) {
  if (movement === 'up') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-status-success/10">
        <ChevronUp className="w-3.5 h-3.5 text-status-success" strokeWidth={3} />
      </span>
    )
  }
  if (movement === 'down') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-status-live/10">
        <ChevronDown className="w-3.5 h-3.5 text-status-live" strokeWidth={3} />
      </span>
    )
  }
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-titos-charcoal/40">
      <Minus className="w-3 h-3 text-titos-gray-500" strokeWidth={3} />
    </span>
  )
}

// ---------------------------------------------------------------------------
// Position badge (1st / 2nd / 3rd)
// ---------------------------------------------------------------------------
function PositionBadge({ position }) {
  return (
    <span
      className={cn(
        'w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 leading-none',
        position === 1 && 'bg-titos-gold/20 text-titos-gold ring-1 ring-titos-gold/30',
        position === 2 && 'bg-titos-charcoal text-titos-gray-300',
        position === 3 && 'bg-status-live/15 text-status-live ring-1 ring-status-live/20'
      )}
    >
      {position}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Single tier mini-card
// ---------------------------------------------------------------------------
function TierCard({ tier }) {
  const tc = getTierColor(tier.tierNumber)

  return (
    <div
      className="bg-titos-card rounded-xl p-3 transition-colors duration-200 hover:bg-titos-card-hover group"
      style={{ borderLeft: `3px solid var(--color-${tc.accent})` }}
    >
      {/* Tier header */}
      <div className="flex items-center justify-between mb-2.5">
        <span className={cn('text-[11px] font-bold uppercase tracking-wider', tc.text)}>
          Tier {tier.tierNumber}
        </span>
        <span className="text-titos-gray-500 text-[11px] font-medium tracking-wide">
          Court {tier.courtNumber}
        </span>
      </div>

      {/* Teams */}
      <div className="space-y-1.5">
        {tier.teams.map((team) => (
          <div
            key={team.id}
            className="flex items-center justify-between gap-1.5"
          >
            <div className="flex items-center gap-2 min-w-0">
              <PositionBadge position={team.finishPosition} />
              <span
                className={cn(
                  'text-xs font-medium truncate',
                  team.finishPosition === 1 ? 'text-titos-white' : 'text-titos-gray-200'
                )}
              >
                {team.name}
              </span>
            </div>
            <MovementArrow movement={team.movement} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// League tab button
// ---------------------------------------------------------------------------
function LeagueTab({ league, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-lg text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold/50',
        isActive
          ? 'bg-titos-gold/15 text-titos-gold ring-1 ring-titos-gold/30 shadow-[0_0_12px_rgba(242,165,39,0.08)]'
          : 'bg-titos-charcoal/50 text-titos-gray-400 hover:text-titos-gray-200 hover:bg-titos-charcoal'
      )}
    >
      {league.name}
    </button>
  )
}

// ---------------------------------------------------------------------------
// League results panel (tier grid + header for a single league)
// ---------------------------------------------------------------------------
function LeaguePanel({ league }) {
  if (!league.week || !league.week.tiers || league.week.tiers.length === 0) {
    return (
      <div className="bg-titos-surface rounded-xl p-8 text-center">
        <p className="text-titos-gray-400 text-sm">No results yet for {league.name}.</p>
      </div>
    )
  }

  return (
    <div className="bg-titos-surface rounded-xl overflow-hidden">
      {/* League info bar */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-titos-border/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-titos-gold/10 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-titos-gold" />
          </div>
          <div>
            <h3 className="font-black text-lg text-titos-white leading-tight">
              {league.name}
            </h3>
            <span className="text-titos-gray-400 text-xs tracking-wide">
              {league.seasonName && (
                <span className="text-titos-gold/70 font-semibold">{league.seasonName} &middot; </span>
              )}
              Week {league.week.weekNumber} &middot; {formatDate(league.week.date)}
            </span>
          </div>
        </div>
        <Link
          href={`/leagues/${league.slug}`}
          className="group/link flex items-center gap-1.5 text-titos-gold text-xs font-bold uppercase tracking-wider hover:gap-2.5 transition-all duration-200"
        >
          Full Results
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5" />
        </Link>
      </div>

      {/* Tier grid */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {league.week.tiers.map(tier => (
            <TierCard key={tier.tierNumber} tier={tier} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component — receives results as a prop from the server so initial HTML
// has real team names/scores for SEO. Loading state only applies if no prop.
// ---------------------------------------------------------------------------
export default function LatestResults({ initialResults }) {
  const hasInitial = Array.isArray(initialResults)
  const [results, setResults] = useState(initialResults || [])
  const [loading, setLoading] = useState(!hasInitial)
  const [activeLeagueIdx, setActiveLeagueIdx] = useState(0)

  useEffect(() => {
    if (hasInitial) return // server already supplied the data
    fetch('/api/results/latest')
      .then(r => r.json())
      .then(data => {
        setResults(data.results || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [hasInitial])

  const activeLeague = results[activeLeagueIdx] ?? results[0]
  const showTabs = results.length > 1
  const hasNoResults = !loading && results.length === 0

  return (
    <section className="relative py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-titos-elevated/50 noise overflow-hidden">
      {/* Subtle decorative orb */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-titos-gold/[0.02] blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* ---- Section header ---- */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <span className="section-label text-titos-gold text-xs font-bold uppercase tracking-[0.2em] mb-2 block">
              Latest Results
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-titos-white leading-none">
              THIS WEEK&apos;S<br />
              <span className="text-titos-gray-400">ACTION.</span>
            </h2>
          </div>

          {/* League tabs placeholder — reserve 44px even before data loads to prevent CLS */}
          <div className="min-h-[44px] flex items-start sm:items-end">
            {!loading && showTabs && (
              <div className="flex flex-wrap gap-2">
                {results.map((league, idx) => (
                  <LeagueTab
                    key={league.slug}
                    league={league}
                    isActive={idx === activeLeagueIdx}
                    onClick={() => setActiveLeagueIdx(idx)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ---- Content — always render a consistent-height container to prevent CLS ---- */}
        <div className="min-h-[600px]">
          {loading ? (
            <div className="bg-titos-surface rounded-xl overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-3 border-b border-titos-border/40">
                <div className="w-8 h-8 rounded-lg bg-titos-charcoal animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 rounded bg-titos-charcoal animate-pulse" />
                  <div className="h-3 w-48 rounded bg-titos-charcoal animate-pulse" />
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <SkeletonGrid />
              </div>
            </div>
          ) : hasNoResults ? (
            <div className="bg-titos-surface rounded-xl ring-1 ring-titos-border/20 p-10 sm:p-16 text-center flex flex-col items-center justify-center min-h-[600px]">
              <h3 className="font-display text-lg font-bold text-titos-white mb-2">No Results Yet</h3>
              <p className="text-titos-gray-400 text-sm max-w-md">
                Results will appear here after Week 1 matches are completed.
              </p>
            </div>
          ) : (
            activeLeague && <LeaguePanel league={activeLeague} />
          )}
        </div>
      </div>
    </section>
  )
}
