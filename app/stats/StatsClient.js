'use client'

// Public player-stats leaderboards. One row per player aggregated across
// every week's PlayerStat row. Tabs flip the leaderboard between kill,
// assist, dig, ace, and block leaders; team rollup at the bottom adds up
// every player on the roster.

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Target, Shield, Zap, Hand, Sparkles, Users, ChevronDown, BarChart3 } from 'lucide-react'
import LeagueSelector from '@/components/ui/LeagueSelector'
import { cn, getTeamAbbreviation } from '@/lib/utils'

const STAT_TABS = [
  { key: 'kills',   label: 'Kills',   short: 'K',   Icon: Target,    color: 'text-titos-gold',    accent: 'rgba(242,165,39,0.15)' },
  { key: 'assists', label: 'Assists', short: 'A',   Icon: Sparkles,  color: 'text-slot-early',    accent: 'rgba(10,132,255,0.15)' },
  { key: 'digs',    label: 'Digs',    short: 'D',   Icon: Hand,      color: 'text-slot-single',   accent: 'rgba(48,209,88,0.15)' },
  { key: 'aces',    label: 'Aces',    short: 'Ace', Icon: Zap,       color: 'text-status-live',   accent: 'rgba(255,69,58,0.15)' },
  { key: 'blocks',  label: 'Blocks',  short: 'Blk', Icon: Shield,    color: 'text-slot-late',     accent: 'rgba(191,90,242,0.15)' },
]

function MVPCard({ player, statKey }) {
  if (!player) return null
  const tab = STAT_TABS.find(t => t.key === statKey)
  const Icon = tab.Icon
  return (
    <div
      className="relative overflow-hidden rounded-2xl ring-1 ring-titos-gold/20"
      style={{ background: `linear-gradient(135deg, ${tab.accent}, rgba(17,17,17,0.95))` }}
    >
      <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: tab.accent }}
          aria-hidden="true"
        >
          <Icon className={cn('w-8 h-8 sm:w-10 sm:h-10', tab.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <span className={cn('text-[11px] font-bold uppercase tracking-[0.2em] block mb-1', tab.color)}>
            Season leader · {tab.label}
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-black text-titos-white leading-tight truncate">
            {player.name}
          </h2>
          <span className="text-titos-gray-400 text-sm sm:text-base block mt-1">{player.teamName}</span>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="font-display text-4xl sm:text-6xl font-black text-titos-white leading-none">
            {player.totals[statKey]}
          </span>
          <span className="text-titos-gray-400 text-xs block mt-1 uppercase tracking-wider">
            total · {player.gamesPlayed ? (player.totals[statKey] / player.gamesPlayed).toFixed(1) : '—'} /wk
          </span>
        </div>
      </div>
    </div>
  )
}

function StatTabs({ activeStat, onChange }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Stat category">
      {STAT_TABS.map(tab => {
        const isActive = activeStat === tab.key
        const Icon = tab.Icon
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={cn(
              'min-h-[44px] px-4 sm:px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 border flex items-center gap-2 cursor-pointer',
              isActive
                ? 'bg-titos-gold/15 text-titos-gold border-titos-gold/40 shadow-md shadow-titos-gold/5'
                : 'bg-titos-card text-titos-gray-400 border-titos-border hover:text-titos-white hover:border-titos-border-light'
            )}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

function PlayerLeaderboard({ players, statKey, limit = 25 }) {
  const tab = STAT_TABS.find(t => t.key === statKey)
  const sorted = useMemo(() => {
    return [...players]
      .filter(p => p.totals[statKey] > 0)
      .sort((a, b) => b.totals[statKey] - a.totals[statKey])
      .slice(0, limit)
  }, [players, statKey, limit])

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl bg-titos-card ring-1 ring-titos-border/20 p-8 text-center">
        <p className="text-titos-gray-500 text-sm">
          No {tab.label.toLowerCase()} recorded yet. Stats appear after the admin imports the master sheet.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-titos-card ring-1 ring-titos-border/30 overflow-hidden">
      <table className="w-full">
        <caption className="sr-only">Top {tab.label.toLowerCase()} leaders</caption>
        <thead className="bg-titos-elevated/60">
          <tr className="text-titos-gray-400 text-[11px] uppercase tracking-wider">
            <th scope="col" className="px-3 sm:px-4 py-3 text-left font-bold w-12">#</th>
            <th scope="col" className="px-3 sm:px-4 py-3 text-left font-bold">Player</th>
            <th scope="col" className="px-3 sm:px-4 py-3 text-left font-bold hidden sm:table-cell">Team</th>
            <th scope="col" className="px-3 sm:px-4 py-3 text-right font-bold">Total</th>
            <th scope="col" className="px-3 sm:px-4 py-3 text-right font-bold hidden sm:table-cell">Avg/wk</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => {
            const isTop3 = i < 3
            const avg = p.gamesPlayed ? (p.totals[statKey] / p.gamesPlayed).toFixed(1) : '—'
            return (
              <tr
                key={p.id}
                className={cn(
                  'border-t border-titos-border/20 transition-colors duration-150',
                  isTop3 ? 'bg-titos-gold/[0.03]' : 'hover:bg-titos-elevated/30'
                )}
              >
                <td className="px-3 sm:px-4 py-3">
                  <span className={cn(
                    'inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black',
                    i === 0 ? 'bg-titos-gold/20 text-titos-gold' :
                    i === 1 ? 'bg-white/10 text-titos-gray-200' :
                    i === 2 ? 'bg-titos-gold/10 text-titos-gold/70' :
                    'bg-titos-elevated text-titos-gray-500'
                  )}>{i + 1}</span>
                </td>
                <td className="px-3 sm:px-4 py-3">
                  <span className="font-semibold text-titos-white text-sm sm:text-base block">{p.name}</span>
                  <span className="text-titos-gray-500 text-xs sm:hidden block mt-0.5">{p.teamName}</span>
                </td>
                <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
                  <span className="text-titos-gray-300 text-sm">{p.teamName}</span>
                </td>
                <td className="px-3 sm:px-4 py-3 text-right">
                  <span className={cn('font-display text-lg sm:text-xl font-black', tab.color)}>
                    {p.totals[statKey]}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-3 text-right hidden sm:table-cell">
                  <span className="text-titos-gray-400 text-sm font-mono">{avg}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TeamRollup({ teams, statKey }) {
  const tab = STAT_TABS.find(t => t.key === statKey)
  const sorted = useMemo(() => {
    return [...teams]
      .filter(t => t[statKey] > 0)
      .sort((a, b) => b[statKey] - a[statKey])
  }, [teams, statKey])

  if (sorted.length === 0) return null

  const max = sorted[0][statKey]

  return (
    <div className="rounded-xl bg-titos-card ring-1 ring-titos-border/30 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-black text-titos-white">Team Roll-up</h3>
        <span className={cn('text-xs font-bold uppercase tracking-wider', tab.color)}>
          {tab.label}
        </span>
      </div>
      <ol className="space-y-2.5">
        {sorted.map((t, i) => {
          const pct = max > 0 ? (t[statKey] / max) * 100 : 0
          return (
            <li key={t.id} className="flex items-center gap-3">
              <span className="text-titos-gray-500 text-xs font-bold w-5 flex-shrink-0">{i + 1}</span>
              <span className="text-titos-white text-sm font-semibold flex-shrink-0 sm:w-44 truncate">{t.name}</span>
              <div className="flex-1 h-2 bg-titos-elevated rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: tab.color === 'text-titos-gold' ? '#F2A527' : 'currentColor' }}
                  aria-hidden="true"
                />
              </div>
              <span className={cn('font-display text-base font-black flex-shrink-0 w-10 text-right', tab.color)}>
                {t[statKey]}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   TEAM ROSTERS — every team rendered as an expandable card with
   each player's full stat line. Roster cards open by default so
   parents/captains can find their player without an extra click;
   the chevron flips state for users who want to compact the page.
   ────────────────────────────────────────────────────────────── */

const STAT_KEYS = ['kills', 'assists', 'digs', 'aces', 'blocks']

function TeamRosterCard({ team, players, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)

  // Sort the roster by overall stat impact (sum of all five) so the most
  // active players surface first. Ties broken by name for determinism.
  const roster = useMemo(() => {
    return [...players]
      .map(p => ({ ...p, _impact: STAT_KEYS.reduce((s, k) => s + (p.totals[k] || 0), 0) }))
      .sort((a, b) => (b._impact - a._impact) || a.name.localeCompare(b.name))
  }, [players])

  const teamTotals = useMemo(() => {
    const t = { kills: 0, assists: 0, digs: 0, aces: 0, blocks: 0 }
    for (const p of players) for (const k of STAT_KEYS) t[k] += p.totals[k] || 0
    return t
  }, [players])

  const totalImpact = Object.values(teamTotals).reduce((a, b) => a + b, 0)

  return (
    <article className="rounded-xl bg-titos-card ring-1 ring-titos-border/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={`roster-${team.id}`}
        className="w-full px-5 py-4 flex items-center gap-3 sm:gap-5 text-left hover:bg-titos-elevated/30 transition-colors duration-200 cursor-pointer min-h-[64px]"
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg sm:text-xl font-black text-titos-white truncate">{team.name}</h3>
          <span className="text-titos-gray-500 text-xs uppercase tracking-wider font-bold">
            {players.length} {players.length === 1 ? 'player' : 'players'}
            {totalImpact === 0 && <span className="text-titos-gray-600"> · no stats yet</span>}
          </span>
        </div>
        {/* Stat-total chips — desktop only, otherwise too noisy on mobile */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          {STAT_TABS.map(tab => (
            <span
              key={tab.key}
              className="px-2 py-1 rounded-md bg-titos-elevated text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"
              title={`${tab.label}: ${teamTotals[tab.key]}`}
            >
              <span className={tab.color}>{tab.short}</span>
              <span className="text-titos-gray-300 font-mono">{teamTotals[tab.key]}</span>
            </span>
          ))}
        </div>
        <ChevronDown
          className={cn('w-5 h-5 text-titos-gray-500 transition-transform duration-200 flex-shrink-0', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div id={`roster-${team.id}`} className="border-t border-titos-border/20 overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{team.name} roster with player stats</caption>
            <thead className="bg-titos-elevated/40">
              <tr className="text-titos-gray-400 text-[11px] uppercase tracking-wider">
                <th scope="col" className="px-3 sm:px-4 py-2.5 text-left font-bold w-10">#</th>
                <th scope="col" className="px-3 sm:px-4 py-2.5 text-left font-bold">Player</th>
                {STAT_TABS.map(tab => (
                  <th
                    key={tab.key}
                    scope="col"
                    className="px-2 sm:px-3 py-2.5 text-right font-bold w-12 sm:w-14"
                    title={tab.label}
                  >
                    <span className={tab.color}>{tab.short}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roster.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-titos-gray-500 text-sm">
                    No players on the roster yet.
                  </td>
                </tr>
              ) : roster.map(p => {
                const hasStats = p._impact > 0
                return (
                  <tr
                    key={p.id}
                    className={cn(
                      'border-t border-titos-border/15 transition-colors duration-150',
                      hasStats ? 'hover:bg-titos-elevated/25' : 'opacity-60'
                    )}
                  >
                    <td className="px-3 sm:px-4 py-2.5 text-titos-gray-500 text-xs font-mono">
                      {p.jerseyNumber ?? '—'}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-titos-white font-semibold">
                      {p.name}
                      {p.gamesPlayed > 0 && (
                        <span className="text-titos-gray-500 text-xs font-normal ml-2">
                          · {p.gamesPlayed}w
                        </span>
                      )}
                    </td>
                    {STAT_TABS.map(tab => {
                      const v = p.totals[tab.key]
                      return (
                        <td key={tab.key} className="px-2 sm:px-3 py-2.5 text-right font-mono">
                          <span className={cn(v > 0 ? tab.color : 'text-titos-gray-600')}>
                            {v}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </article>
  )
}

function TeamRosters({ teams, players }) {
  // Group players by team. Sort teams by total stat impact (active teams
  // first) so empty rosters sink to the bottom.
  const grouped = useMemo(() => {
    const byTeam = {}
    for (const t of teams) byTeam[t.id] = { team: t, players: [] }
    for (const p of players) {
      if (byTeam[p.teamId]) byTeam[p.teamId].players.push(p)
    }
    return Object.values(byTeam).sort((a, b) => {
      const impactA = STAT_KEYS.reduce((s, k) => s + (a.team[k] || 0), 0)
      const impactB = STAT_KEYS.reduce((s, k) => s + (b.team[k] || 0), 0)
      if (impactB !== impactA) return impactB - impactA
      return a.team.name.localeCompare(b.team.name)
    })
  }, [teams, players])

  if (grouped.length === 0) {
    return (
      <div className="rounded-xl bg-titos-card ring-1 ring-titos-border/20 p-8 text-center">
        <p className="text-titos-gray-500 text-sm">No teams in this season yet.</p>
      </div>
    )
  }

  return (
    <section aria-labelledby="team-rosters-heading" className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 id="team-rosters-heading" className="font-display text-xl sm:text-2xl font-black text-titos-white flex items-center gap-2">
          <Users className="w-5 h-5 text-titos-gold" aria-hidden="true" />
          Team Rosters
        </h2>
        <span className="text-titos-gray-500 text-xs uppercase tracking-wider font-bold">
          {grouped.length} {grouped.length === 1 ? 'team' : 'teams'}
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {grouped.map(({ team, players: roster }) => (
          <TeamRosterCard key={team.id} team={team} players={roster} />
        ))}
      </div>
    </section>
  )
}

function ViewToggle({ value, onChange }) {
  const options = [
    { key: 'leaders', label: 'Leaders', Icon: Trophy },
    { key: 'teams',   label: 'Teams',   Icon: Users },
  ]
  return (
    <div className="inline-flex p-1 bg-titos-card border border-titos-border rounded-lg" role="tablist" aria-label="Stats view">
      {options.map(opt => {
        const Icon = opt.Icon
        const isActive = value === opt.key
        return (
          <button
            key={opt.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.key)}
            className={cn(
              'min-h-[44px] px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 cursor-pointer',
              isActive
                ? 'bg-titos-gold/15 text-titos-gold shadow-sm'
                : 'text-titos-gray-400 hover:text-titos-white'
            )}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export default function StatsClient({ leagues, initialSlug, initialData }) {
  const router = useRouter()
  const [selected, setSelected] = useState(initialSlug || leagues[0]?.slug || '')
  const [data, setData] = useState(initialData || null)
  const [activeStat, setActiveStat] = useState('kills')
  // 'leaders' shows the MVP + leaderboard; 'teams' shows full rosters.
  // Synced to ?view=… in the URL so the choice is shareable.
  const [view, setView] = useState('leaders')
  const [loading, setLoading] = useState(!initialData)
  const seedConsumedRef = useRef(!!initialData)

  const handleSelect = (slug) => {
    setSelected(slug)
    router.replace(`/stats/${slug}`, { scroll: false })
  }

  // Read ?stat=… and ?view=… from URL on mount for shareable deep links.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('stat')
    if (fromUrl && STAT_TABS.some(t => t.key === fromUrl)) setActiveStat(fromUrl)
    const v = params.get('view')
    if (v === 'leaders' || v === 'teams') setView(v)
  }, [])

  useEffect(() => {
    if (!selected) return
    if (seedConsumedRef.current) { seedConsumedRef.current = false; return }
    setLoading(true)
    fetch(`/api/leagues/${selected}/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selected])

  // Update URL when stat changes — shareable.
  const onStatChange = (key) => {
    setActiveStat(key)
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.searchParams.set('stat', key)
    window.history.replaceState({}, '', url)
  }

  const onViewChange = (key) => {
    setView(key)
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (key === 'teams') url.searchParams.set('view', key)
    else url.searchParams.delete('view')
    window.history.replaceState({}, '', url)
  }

  const players = data?.players || []
  const teams = data?.teams || []
  const hasAnyStats = players.some(p => Object.values(p.totals).some(v => v > 0))

  // Season leader for the active stat — drives the hero MVP card.
  const leader = useMemo(() => {
    const sorted = [...players].filter(p => p.totals[activeStat] > 0).sort((a, b) => b.totals[activeStat] - a.totals[activeStat])
    return sorted[0] || null
  }, [players, activeStat])

  return (
    <div className="py-10 sm:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <span className="section-label flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
            Season Leaders
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-titos-white leading-none">STATS</h1>
        </div>

        {/* League selector + view toggle */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <LeagueSelector leagues={leagues} selected={selected} onSelect={handleSelect} />
          <ViewToggle value={view} onChange={onViewChange} />
        </div>

        {loading ? (
          <div className="space-y-6 min-h-[800px]">
            <div className="h-40 bg-titos-card rounded-2xl animate-pulse" />
            <div className="h-12 bg-titos-card rounded-lg animate-pulse w-full max-w-xl" />
            <div className="h-96 bg-titos-card rounded-xl animate-pulse" />
          </div>
        ) : !hasAnyStats && view === 'leaders' ? (
          <div className="rounded-xl bg-titos-card ring-1 ring-titos-border/20 p-12 text-center">
            <Trophy className="w-12 h-12 text-titos-gray-600 mx-auto mb-4" aria-hidden="true" />
            <h2 className="font-display text-xl font-black text-titos-white mb-2">No stats yet</h2>
            <p className="text-titos-gray-400 text-sm max-w-md mx-auto mb-4">
              Player stats appear once the league admin imports the master sheet. Check back after the next game night.
            </p>
            <button
              onClick={() => onViewChange('teams')}
              className="text-titos-gold text-sm font-bold hover:underline cursor-pointer inline-flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" aria-hidden="true" />
              View team rosters anyway
            </button>
          </div>
        ) : view === 'teams' ? (
          <TeamRosters teams={teams} players={players} />
        ) : (
          <div className="space-y-8">
            {/* MVP hero */}
            <MVPCard player={leader} statKey={activeStat} />

            {/* Tabs */}
            <StatTabs activeStat={activeStat} onChange={onStatChange} />

            {/* Leaderboard + team rollup */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PlayerLeaderboard players={players} statKey={activeStat} />
              </div>
              <div className="lg:col-span-1">
                <TeamRollup teams={teams} statKey={activeStat} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
