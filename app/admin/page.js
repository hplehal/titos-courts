'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, Save, CheckCircle2, Plus, RefreshCw, Calendar, Users, Trophy, FileText } from 'lucide-react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import StatCard from '@/components/admin/StatCard'
import TierScoreBlock from '@/components/admin/dashboard/TierScoreBlock'
import ResultsView from '@/components/admin/dashboard/ResultsView'
import TiersView from '@/components/admin/dashboard/TiersView'
import NextWeekView from '@/components/admin/dashboard/NextWeekView'
import { cn } from '@/lib/utils'

const TABS = ['Scores', 'Results', 'Tiers', 'Next Week']

export default function AdminPage() {
  // Data
  const [leagues, setLeagues] = useState([])
  const [activeLeague, setActiveLeague] = useState(null)
  const [season, setSeason] = useState(null)
  const [weeks, setWeeks] = useState([])
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [matches, setMatches] = useState([])
  const [activeTab, setActiveTab] = useState('Scores')
  const [stats, setStats] = useState({ registrations: null, pendingPayments: null, waivers: null })
  // UI
  const [loading, setLoading] = useState(true)
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const inputRefs = useRef({})

  // Load leagues
  useEffect(() => {
    fetch('/api/leagues').then(r => r.json()).then(data => {
      const active = (data || []).filter(l => l.isActive)
      setLeagues(active)
      if (active.length > 0) setActiveLeague(active[0])
    })
  }, [])

  // Load overview stats
  const loadStats = useCallback(() => {
    fetch('/api/admin/registrations').then(r => r.json()).then(d => {
      const regs = d.registrations || []
      setStats(s => ({ ...s, registrations: regs.length, pendingPayments: regs.filter(r => r.paymentStatus === 'pending').length }))
    }).catch(() => {})
    fetch('/api/waiver').then(r => r.json()).then(d => {
      setStats(s => ({ ...s, waivers: (d.waivers || []).length }))
    }).catch(() => {})
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  // Load season + weeks when league changes
  const loadLeagueData = useCallback(async (league) => {
    if (!league) return
    setLoading(true)
    try {
      const seasonsRes = await fetch('/api/admin/seasons').then(r => r.json())
      const leagueSeason = (seasonsRes.seasons || [])
        .filter(s => s.league?.slug === league.slug)
        .sort((a, b) => b.seasonNumber - a.seasonNumber)[0]
      setSeason(leagueSeason || null)
      if (!leagueSeason) { setWeeks([]); setSelectedWeek(null); setLoading(false); return }

      const weeksRes = await fetch(`/api/admin/weeks?seasonId=${leagueSeason.id}`).then(r => r.json())
      const allWeeks = weeksRes.weeks || []
      setWeeks(allWeeks)

      // Auto-select: active first, then latest completed, then first
      const activeW = allWeeks.find(w => w.status === 'active')
      const lastCompleted = [...allWeeks].reverse().find(w => w.status === 'completed')
      const best = activeW || lastCompleted || allWeeks[allWeeks.length - 1] || null
      setSelectedWeek(best)
    } catch (err) { console.error(err) }
    setLoading(false)
  }, [])

  useEffect(() => { loadLeagueData(activeLeague) }, [activeLeague, loadLeagueData])

  // Load matches
  const loadMatches = useCallback(() => {
    if (!selectedWeek?.id) { setMatches([]); return }
    setLoadingMatches(true)
    setSaveMsg('')
    fetch(`/api/admin/scores?weekId=${selectedWeek.id}`).then(r => r.json()).then(data => {
      setMatches(data.matches || [])
      setLoadingMatches(false)
    }).catch(() => setLoadingMatches(false))
  }, [selectedWeek?.id])

  useEffect(() => { loadMatches() }, [loadMatches])

  // Auto-detect tab ONLY when week changes (not when scores are being typed)
  useEffect(() => {
    if (!selectedWeek) return
    const hasMatches = (selectedWeek._count?.matches || 0) > 0
    const isCompleted = selectedWeek.status === 'completed'

    if (isCompleted) setActiveTab('Tiers')
    else if (hasMatches) setActiveTab('Scores')
    else setActiveTab('Next Week')
  }, [selectedWeek?.id])

  // Score handlers
  const updateMatchScore = useCallback((matchId, field, value) => {
    const numVal = value === '' ? '' : parseInt(value) || 0
    setMatches(prev => prev.map(m => {
      if (m.id !== matchId) return m
      const scores = [...(m.scores || [])]
      const idx = scores.findIndex(s => s.setNumber === 1)
      if (idx >= 0) scores[idx] = { ...scores[idx], [field]: numVal }
      else scores.push({ setNumber: 1, homeScore: 0, awayScore: 0, [field]: numVal })
      return { ...m, scores }
    }))
  }, [])

  const saveAllScores = useCallback(async () => {
    setSaving(true); setSaveMsg('')
    const toSave = matches.filter(m => {
      const s = m.scores?.[0]
      return s && (s.homeScore > 0 || s.awayScore > 0)
    })
    await Promise.all(toSave.map(m => {
      const s = m.scores[0]
      return fetch('/api/admin/scores', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: m.id, scores: [{ setNumber: 1, homeScore: s.homeScore, awayScore: s.awayScore }], status: 'completed' }),
      })
    }))
    setSaving(false)
    setSaveMsg(`${toSave.length} matches saved`)
    return toSave.length
  }, [matches])

  const saveAndComplete = useCallback(async () => {
    await saveAllScores()
    await fetch('/api/admin/scores', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekId: selectedWeek.id, status: 'completed' }),
    })
    setSaveMsg('Week completed! All scores saved.')
    loadLeagueData(activeLeague)
  }, [saveAllScores, selectedWeek, activeLeague, loadLeagueData])

  const addWeek = useCallback(async () => {
    if (!season) return
    const res = await fetch('/api/admin/weeks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add-week', seasonId: season.id }) })
    const data = await res.json()
    if (data.success) loadLeagueData(activeLeague)
  }, [season, activeLeague, loadLeagueData])

  // Build ordered input keys for tab navigation
  const scoredCount = matches.filter(m => {
    const s = m.scores?.[0]
    return s && s.homeScore !== '' && s.homeScore != null && s.awayScore !== '' && s.awayScore != null
  }).length
  const allInputKeys = []
  const matchesByTier = {}
  for (const m of matches) {
    if (!matchesByTier[m.tierNumber]) matchesByTier[m.tierNumber] = []
    matchesByTier[m.tierNumber].push(m)
  }
  for (const [, tierMatches] of Object.entries(matchesByTier).sort(([a], [b]) => a - b)) {
    for (const m of tierMatches) { allInputKeys.push(`${m.id}-home`, `${m.id}-away`) }
  }

  return (
    <div>
      {/* ─── Page Header ─── */}
      <AdminPageHeader
        title="Dashboard"
        description="League operations — enter scores, manage tiers, and prep next week."
      >
        <button
          onClick={() => { loadLeagueData(activeLeague); loadStats() }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-titos-gray-300 bg-titos-elevated border border-titos-border/60 hover:text-titos-white hover:border-titos-border-light transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </AdminPageHeader>

      {/* ─── Overview Stats ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard icon={Trophy} label="Active Leagues" value={leagues.length || '--'} sub={activeLeague?.name} tone="gold" />
        <StatCard icon={Calendar} label="Current Week" value={selectedWeek ? `Week ${selectedWeek.weekNumber}` : '--'}
          sub={selectedWeek ? `${selectedWeek._count?.matches || 0} matches · ${selectedWeek.status}` : 'No week selected'} tone="info" />
        <StatCard icon={Users} label="Registrations" value={stats.registrations ?? '--'}
          sub={stats.pendingPayments ? `${stats.pendingPayments} pending payment` : 'All settled'} tone={stats.pendingPayments ? 'warning' : 'success'} />
        <StatCard icon={FileText} label="Waivers Signed" value={stats.waivers ?? '--'} tone="success" />
      </div>

      <div className="max-w-5xl">
        {/* League Tabs */}
        <div className="flex items-center gap-1 mb-5 p-1 rounded-xl bg-titos-elevated border border-titos-border/40 w-fit max-w-full overflow-x-auto">
          {leagues.map(l => (
            <button key={l.slug} onClick={() => setActiveLeague(l)}
              className={cn('px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all',
                activeLeague?.slug === l.slug ? 'bg-titos-gold text-titos-surface shadow-sm' : 'text-titos-gray-400 hover:text-titos-white'
              )}>{l.name}</button>
          ))}
        </div>

        {loading ? (
          <div className="min-h-[2000px]">
            {/* Week pills placeholder (44px) */}
            <div className="flex items-center gap-1.5 mb-5">
              {Array.from({ length: 11 }).map((_, i) => (
                <div key={i} className="w-9 h-9 rounded-full bg-titos-charcoal animate-pulse" />
              ))}
            </div>
            {/* Meta line (20px) */}
            <div className="h-4 bg-titos-charcoal rounded w-48 mb-4 animate-pulse" />
            {/* Tabs bar (44px) */}
            <div className="flex gap-4 mb-5 border-b border-titos-border/30">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-titos-charcoal rounded w-20 animate-pulse" />
              ))}
            </div>
            {/* Tier blocks (8 × 280px) */}
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card-flat rounded-xl min-h-[200px] animate-pulse" />
              ))}
            </div>
          </div>
        ) : !season ? (
          <div className="card rounded-xl p-8 text-center"><p className="text-titos-gray-400">No season found for this league.</p></div>
        ) : (
          <>
            {/* ─── Week Selector ─── */}
            <div className="card-flat rounded-xl p-3 mb-5 flex flex-wrap items-center gap-3">
              <span className="text-titos-gray-500 text-[10px] font-bold uppercase tracking-wider pl-1">Week</span>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {weeks.map(w => {
                  const isSel = selectedWeek?.id === w.id
                  return (
                    <button key={w.id} onClick={() => setSelectedWeek(w)}
                      className={cn('w-9 h-9 rounded-full text-xs font-black flex items-center justify-center transition-all flex-shrink-0',
                        isSel ? 'ring-2 ring-titos-gold ring-offset-2 ring-offset-titos-card' : '',
                        w.status === 'completed' ? 'bg-status-success/20 text-status-success' :
                        w.status === 'active' ? 'bg-titos-gold/20 text-titos-gold' :
                        'bg-titos-charcoal text-titos-gray-500'
                      )}>{w.weekNumber}</button>
                  )
                })}
                {/* Add week button */}
                <button onClick={addWeek} className="w-9 h-9 rounded-full bg-titos-elevated border border-dashed border-titos-border/60 flex items-center justify-center text-titos-gray-500 hover:text-titos-gold hover:border-titos-gold/40 transition-colors flex-shrink-0" title="Add week">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {selectedWeek && (
                <span className="ml-auto text-titos-gray-400 text-xs pr-1">
                  <span className={cn('font-bold uppercase',
                    selectedWeek.status === 'completed' ? 'text-status-success' :
                    selectedWeek.status === 'active' ? 'text-titos-gold' : 'text-titos-gray-500'
                  )}>{selectedWeek.status}</span> &middot; {selectedWeek._count?.matches || 0} matches
                </span>
              )}
            </div>

            {/* ─── Workflow Tabs ─── */}
            <div className="flex gap-1 mb-5 border-b border-titos-border/30 overflow-x-auto">
              {TABS.map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={cn('px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-colors border-b-2 -mb-px',
                    activeTab === t ? 'border-titos-gold text-titos-gold' : 'border-transparent text-titos-gray-500 hover:text-titos-gray-300'
                  )}>{t}</button>
              ))}
            </div>

            {/* ─── Tab Content ─── */}
            {loadingMatches ? (
              <div className="min-h-[1600px] space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="card-flat rounded-xl min-h-[180px] animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {/* SCORES TAB */}
                {activeTab === 'Scores' && (
                  <div>
                    {saveMsg && (
                      <div className="fixed bottom-6 right-6 z-40 max-w-sm p-3 rounded-xl bg-status-success/15 border border-status-success/40 backdrop-blur-md shadow-lg text-status-success font-semibold text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{saveMsg}
                      </div>
                    )}
                    <div className="space-y-4">
                      {Object.entries(matchesByTier).sort(([a], [b]) => a - b).map(([tierNum, tierMatches]) => (
                        <TierScoreBlock key={tierNum} tierNum={tierNum} tierMatches={tierMatches} inputRefs={inputRefs}
                          onScoreChange={updateMatchScore} allInputKeys={allInputKeys} leagueSlug={activeLeague?.slug} />
                      ))}
                    </div>
                    {matches.length === 0 && <p className="text-titos-gray-400 text-center py-8">No matches for this week.</p>}

                    {/* Sticky save bar — always visible while entering scores */}
                    {matches.length > 0 && (
                      <div className="sticky bottom-4 mt-5 z-10">
                        <div className="rounded-xl border border-titos-border/60 bg-titos-elevated/95 backdrop-blur p-3 flex flex-wrap items-center gap-3 shadow-lg shadow-black/40">
                          <div className="flex-1 min-w-[180px]">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={cn('text-xs font-bold', scoredCount === matches.length ? 'text-status-success' : 'text-titos-gray-300')}>
                                {scoredCount} of {matches.length} scored
                              </span>
                              <span className="text-titos-gray-500 text-[10px] hidden sm:inline">Tab / Enter to move · 2 digits auto-advance</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-titos-charcoal overflow-hidden">
                              <div className={cn('h-full rounded-full transition-all', scoredCount === matches.length ? 'bg-status-success' : 'bg-titos-gold')}
                                style={{ width: `${(scoredCount / matches.length) * 100}%` }} />
                            </div>
                          </div>
                          <button onClick={saveAllScores} disabled={saving}
                            className="px-3 py-2 rounded-lg text-xs font-bold bg-titos-card text-titos-gray-200 border border-titos-border hover:text-titos-white hover:border-titos-border-light transition-colors flex items-center gap-1.5">
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            {saving ? 'Saving...' : 'Save All'}
                          </button>
                          <button onClick={saveAndComplete} disabled={saving}
                            className={cn('px-3 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5',
                              scoredCount === matches.length
                                ? 'bg-status-success text-black border-status-success hover:bg-status-success/90'
                                : 'bg-status-success/15 text-status-success border-status-success/30 hover:bg-status-success/25')}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Save & Complete Week
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* RESULTS TAB */}
                {activeTab === 'Results' && <ResultsView matches={matches} leagueSlug={activeLeague?.slug} />}

                {/* TIERS TAB */}
                {activeTab === 'Tiers' && selectedWeek && <TiersView weekId={selectedWeek.id} weeks={weeks} onReloadMatches={loadMatches} />}

                {/* NEXT WEEK TAB */}
                {activeTab === 'Next Week' && selectedWeek && season && (
                  <NextWeekView season={season} weeks={weeks} currentWeek={selectedWeek} onReload={() => loadLeagueData(activeLeague)} />
                )}
              </>
            )}
          </>
        )}

      </div>
    </div>
  )
}
