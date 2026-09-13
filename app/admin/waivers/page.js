'use client'

// Admin: signed player waivers, filterable by league, team and a free-text
// search. Waivers keep the league and team names as they were when the player
// signed, so filtering goes through lib/waivers.js to line up renamed leagues
// and group spelling variants of the same team.

import { useEffect, useMemo, useState } from 'react'
import { Shield, Loader2, Search, Check, X } from 'lucide-react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { adminFetch } from '@/lib/adminFetch'
import { formatDate } from '@/lib/utils'
import { NO_LEAGUE_KEY, TOURNAMENT_KEY, teamKey, teamOptions, waiverLeagueKey } from '@/lib/waivers'

const ALL = 'all'
const NO_TEAM = 'no-team'
const fieldLabel = 'block text-xs font-semibold text-titos-gray-400 mb-1'
const selectCls = 'w-full px-3 py-2.5 bg-titos-card border border-titos-border rounded-lg text-titos-white text-sm focus:outline-none focus:border-titos-gold/50'

export default function WaiversPage() {
  const [waivers, setWaivers] = useState([])
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [leagueFilter, setLeagueFilter] = useState(ALL)
  const [teamFilter, setTeamFilter] = useState(ALL)

  useEffect(() => {
    Promise.all([
      adminFetch('/api/waiver').then(async r => ({ ok: r.ok, data: await r.json().catch(() => ({})) })),
      adminFetch('/api/admin/leagues').then(r => r.json()).catch(() => ({})),
    ])
      .then(([waiverRes, leagueRes]) => {
        if (!waiverRes.ok) setError(waiverRes.data.error || 'Could not load waivers')
        setWaivers(waiverRes.data.waivers || [])
        setLeagues(leagueRes.leagues || [])
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [])

  // Tag each waiver once with its league bucket and grouped team key.
  const tagged = useMemo(
    () => waivers.map(w => ({ ...w, leagueKey: waiverLeagueKey(w, leagues), teamKey: teamKey(w.teamName) })),
    [waivers, leagues],
  )

  const leagueOptions = useMemo(() => {
    const countFor = key => tagged.filter(w => w.leagueKey === key).length
    return [
      ...leagues.map(l => ({ key: l.slug, label: l.name, count: countFor(l.slug) })),
      { key: TOURNAMENT_KEY, label: 'Tournaments', count: countFor(TOURNAMENT_KEY) },
      { key: NO_LEAGUE_KEY, label: 'No league given', count: countFor(NO_LEAGUE_KEY) },
    ].filter(o => o.count > 0 || leagues.some(l => l.slug === o.key))
  }, [tagged, leagues])

  const inLeague = useMemo(
    () => (leagueFilter === ALL ? tagged : tagged.filter(w => w.leagueKey === leagueFilter)),
    [tagged, leagueFilter],
  )
  const teams = useMemo(() => teamOptions(inLeague), [inLeague])
  const noTeamCount = inLeague.filter(w => !w.teamKey).length

  const query = search.trim().toLowerCase()
  const filtered = inLeague.filter(w => {
    if (teamFilter === NO_TEAM && w.teamKey) return false
    if (teamFilter !== ALL && teamFilter !== NO_TEAM && w.teamKey !== teamFilter) return false
    if (!query) return true
    return [w.fullName, w.email, w.teamName, w.tournamentName].some(v => v?.toLowerCase().includes(query))
  })

  const leagueName = slug => leagues.find(l => l.slug === slug)?.name
  const filtersOn = leagueFilter !== ALL || teamFilter !== ALL || query

  const changeLeague = (key) => {
    setLeagueFilter(key)
    setTeamFilter(ALL) // team choices depend on the league
  }

  const clearFilters = () => {
    setLeagueFilter(ALL)
    setTeamFilter(ALL)
    setSearch('')
  }

  return (
    <div>
      <div className="max-w-5xl">
        <AdminPageHeader title="Waivers" description={`${waivers.length} signed player waivers.`}>
          <a href="/waiver" target="_blank" className="text-titos-gold text-xs font-bold uppercase tracking-wider hover:text-titos-gold-light transition-colors">
            Waiver Form →
          </a>
        </AdminPageHeader>

        {/* Filters */}
        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          <label className="block">
            <span className={fieldLabel}>League</span>
            <select value={leagueFilter} onChange={(e) => changeLeague(e.target.value)} className={selectCls}>
              <option value={ALL}>All leagues ({tagged.length})</option>
              {leagueOptions.map(o => <option key={o.key} value={o.key}>{o.label} ({o.count})</option>)}
            </select>
          </label>
          <label className="block">
            <span className={fieldLabel}>Team</span>
            <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className={selectCls}>
              <option value={ALL}>All teams ({inLeague.length})</option>
              {teams.map(t => <option key={t.key} value={t.key}>{t.name} ({t.count})</option>)}
              {noTeamCount > 0 && <option value={NO_TEAM}>No team given ({noTeamCount})</option>}
            </select>
          </label>
          <label className="block">
            <span className={fieldLabel}>Search</span>
            <span className="relative block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-titos-gray-500" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, team…"
                className="w-full pl-9 pr-3 py-2.5 bg-titos-card border border-titos-border rounded-lg text-titos-white text-sm placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50"
              />
            </span>
          </label>
        </div>
        <div className="flex items-center justify-between gap-3 mb-4 text-xs text-titos-gray-400">
          <span>Showing {filtered.length} of {waivers.length} waivers</span>
          {filtersOn && (
            <button type="button" onClick={clearFilters} className="text-titos-gold font-semibold hover:underline">
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 text-titos-gold mx-auto animate-spin" /></div>
        ) : error ? (
          <div className="card rounded-xl p-8 text-center" role="alert">
            <p className="text-status-live">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card rounded-xl p-8 text-center">
            <Shield className="w-10 h-10 text-titos-gray-500 mx-auto mb-3" />
            <p className="text-titos-gray-400">{filtersOn ? 'No waivers match these filters.' : 'No waivers signed yet.'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(w => {
              const currentLeague = leagueName(w.leagueKey)
              return (
                <div key={w.id} className="card-flat rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-titos-white text-sm">{w.fullName}</h3>
                        <span className="text-titos-gray-500 text-xs">{w.email}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-titos-gray-400">
                        {w.leagueDay && (
                          <span
                            className="px-2 py-0.5 bg-titos-card rounded border border-titos-border/30"
                            title={currentLeague && currentLeague !== w.leagueDay ? `Signed as "${w.leagueDay}"` : undefined}
                          >
                            {currentLeague || w.leagueDay}
                          </span>
                        )}
                        {w.tournamentName && <span className="px-2 py-0.5 bg-titos-gold/10 text-titos-gold rounded border border-titos-gold/30">{w.tournamentName}</span>}
                        {w.teamName && <span>{w.teamName}</span>}
                        {w.phone && <span>{w.phone}</span>}
                        <span>{formatDate(w.signedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        {w.agreedToTerms && <span className="w-5 h-5 rounded-full bg-status-success/15 flex items-center justify-center"><Check className="w-3 h-3 text-status-success" /></span>}
                        {w.agreedToLiability && <span className="w-5 h-5 rounded-full bg-status-success/15 flex items-center justify-center"><Check className="w-3 h-3 text-status-success" /></span>}
                        {w.agreedToMedia ? (
                          <span className="w-5 h-5 rounded-full bg-status-success/15 flex items-center justify-center"><Check className="w-3 h-3 text-status-success" /></span>
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-titos-charcoal flex items-center justify-center"><X className="w-3 h-3 text-titos-gray-500" /></span>
                        )}
                      </div>
                      <span className="text-status-success text-[11px] font-bold uppercase tracking-wider">Signed</span>
                    </div>
                  </div>
                  {(w.emergencyName || w.emergencyPhone) && (
                    <div className="mt-2 text-titos-gray-500 text-[11px]">
                      Emergency: {w.emergencyName} {w.emergencyPhone ? `· ${w.emergencyPhone}` : ''}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
