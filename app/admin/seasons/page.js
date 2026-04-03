'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Plus, Archive, Loader2, Check, Users, Calendar, ChevronDown, ChevronRight, Pencil, Save, X, Trash2, ListOrdered } from 'lucide-react'
import Link from 'next/link'
import { cn, getTierColor } from '@/lib/utils'

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState([])
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  // Forms
  const [showNewForm, setShowNewForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newSeason, setNewSeason] = useState({ leagueId: '', name: '', seasonNumber: '', startDate: '', endDate: '' })

  // Season actions
  const [archiving, setArchiving] = useState({})
  const [deletingSeason, setDeletingSeason] = useState({})

  // Expanded sections
  const [expandedWeeks, setExpandedWeeks] = useState({})
  const [expandedTeams, setExpandedTeams] = useState({})

  // Week data
  const [weeksBySeason, setWeeksBySeason] = useState({})
  const [addingWeek, setAddingWeek] = useState({})
  const [newWeekDate, setNewWeekDate] = useState({})
  const [generatingMatches, setGeneratingMatches] = useState({})

  // Team editing
  const [editingTeam, setEditingTeam] = useState(null)
  const [teamEditData, setTeamEditData] = useState({})
  const [savingTeam, setSavingTeam] = useState(false)
  const [expandedPlayers, setExpandedPlayers] = useState({})
  const [newPlayer, setNewPlayer] = useState({})
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [removingPlayer, setRemovingPlayer] = useState({})

  const loadData = useCallback(async () => {
    try {
      const [seasonsRes, leaguesRes] = await Promise.all([
        fetch('/api/admin/seasons').then(r => r.json()),
        fetch('/api/leagues').then(r => r.json()),
      ])
      setSeasons(seasonsRes.seasons || seasonsRes || [])
      setLeagues(leaguesRes || [])
    } catch (err) { console.error(err) }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const loadWeeks = async (seasonId) => {
    try {
      const res = await fetch(`/api/admin/weeks?seasonId=${seasonId}`)
      const data = await res.json()
      setWeeksBySeason(prev => ({ ...prev, [seasonId]: data.weeks || [] }))
    } catch (err) { console.error(err) }
  }

  const toggleWeeks = (seasonId) => {
    const isOpen = expandedWeeks[seasonId]
    setExpandedWeeks(prev => ({ ...prev, [seasonId]: !isOpen }))
    if (!isOpen && !weeksBySeason[seasonId]) loadWeeks(seasonId)
  }

  const toggleTeams = (seasonId) => {
    setExpandedTeams(prev => ({ ...prev, [seasonId]: !prev[seasonId] }))
  }

  // ─── Season Actions ───
  const handleNewSeason = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSeason),
      })
      const data = await res.json()
      if (data.success) {
        setMessage('Season created!')
        setShowNewForm(false)
        setNewSeason({ leagueId: '', name: '', seasonNumber: '', startDate: '', endDate: '' })
        await loadData()
      } else { setMessage(data.error || 'Error') }
    } catch (err) { setMessage('Error creating season') }
    setSaving(false)
  }

  const handleArchive = async (seasonId) => {
    setArchiving(prev => ({ ...prev, [seasonId]: true }))
    await fetch('/api/admin/seasons', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seasonId, status: 'completed' }) })
    await loadData()
    setArchiving(prev => ({ ...prev, [seasonId]: false }))
  }

  const handleDeleteSeason = async (seasonId, name) => {
    if (!confirm(`Delete "${name}"? This permanently removes ALL teams, matches, scores, and weeks. Cannot be undone.`)) return
    setDeletingSeason(prev => ({ ...prev, [seasonId]: true }))
    await fetch('/api/admin/seasons', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seasonId }) })
    setMessage(`Deleted "${name}"`)
    await loadData()
    setDeletingSeason(prev => ({ ...prev, [seasonId]: false }))
  }

  // ─── Week Actions ───
  const handleAddWeek = async (seasonId) => {
    setAddingWeek(prev => ({ ...prev, [seasonId]: true }))
    const date = newWeekDate[seasonId] || null
    const res = await fetch('/api/admin/weeks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add-week', seasonId, date }) })
    const data = await res.json()
    if (data.success) { setMessage(`Week ${data.week?.weekNumber} added`); await loadWeeks(seasonId) }
    else { setMessage(data.error || 'Error') }
    setAddingWeek(prev => ({ ...prev, [seasonId]: false }))
  }

  const handleGenerateMatches = async (weekId, seasonId) => {
    setGeneratingMatches(prev => ({ ...prev, [weekId]: true }))
    const res = await fetch('/api/admin/weeks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'generate-matches', weekId }) })
    const data = await res.json()
    if (data.success) { setMessage(`${data.matchCount} matches generated`); await loadWeeks(seasonId) }
    else { setMessage(data.error || 'Error') }
    setGeneratingMatches(prev => ({ ...prev, [weekId]: false }))
  }

  const handleWeekStatus = async (weekId, status, seasonId) => {
    await fetch('/api/admin/weeks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weekId, status }) })
    await loadWeeks(seasonId)
  }

  // ─── Team Actions ───
  const startEditTeam = (team) => { setEditingTeam(team.id); setTeamEditData({ name: team.name, captainName: team.captainName, captainEmail: team.captainEmail }) }
  const cancelEditTeam = () => { setEditingTeam(null); setTeamEditData({}) }

  const saveTeam = async (teamId) => {
    setSavingTeam(true)
    await fetch('/api/admin/seasons', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update-team', teamId, ...teamEditData }) })
    setEditingTeam(null)
    await loadData()
    setSavingTeam(false)
  }

  const handleAddPlayer = async (teamId) => {
    const p = newPlayer[teamId]
    if (!p?.name) return
    setAddingPlayer(true)
    await fetch('/api/admin/seasons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add-player', teamId, name: p.name, jerseyNumber: p.jerseyNumber ? parseInt(p.jerseyNumber) : null }) })
    setNewPlayer(prev => ({ ...prev, [teamId]: { name: '', jerseyNumber: '' } }))
    await loadData()
    setAddingPlayer(false)
  }

  const handleRemovePlayer = async (playerId) => {
    setRemovingPlayer(prev => ({ ...prev, [playerId]: true }))
    await fetch(`/api/admin/seasons?action=remove-player&playerId=${playerId}`, { method: 'DELETE' })
    await loadData()
    setRemovingPlayer(prev => ({ ...prev, [playerId]: false }))
  }

  // Group seasons by league
  const seasonsByLeague = {}
  for (const s of seasons) {
    const name = s.league?.name || 'Unknown'
    if (!seasonsByLeague[name]) seasonsByLeague[name] = []
    seasonsByLeague[name].push(s)
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-titos-gray-400 hover:text-titos-gold transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-display text-2xl font-black text-titos-white">Season Management</h1>
          </div>
          <button onClick={() => setShowNewForm(!showNewForm)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> New Season
          </button>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-lg bg-titos-gold/10 border border-titos-gold/30 text-titos-gold text-sm font-medium flex items-center justify-between">
            {message}
            <button onClick={() => setMessage('')} className="text-titos-gold/60 hover:text-titos-gold"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* New Season Form */}
        {showNewForm && (
          <div className="card rounded-xl p-6 mb-8">
            <h3 className="font-display text-lg font-bold text-titos-white mb-4">Create New Season</h3>
            <form onSubmit={handleNewSeason} className="grid sm:grid-cols-2 gap-4">
              <select value={newSeason.leagueId} onChange={(e) => setNewSeason(p => ({ ...p, leagueId: e.target.value }))} required
                className="px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white focus:outline-none focus:border-titos-gold/50">
                <option value="">Select league...</option>
                {leagues.map(l => <option key={l.id || l.slug} value={l.id}>{l.name}</option>)}
              </select>
              <input type="text" placeholder="Season Name (e.g. Season 10)" value={newSeason.name} onChange={(e) => setNewSeason(p => ({ ...p, name: e.target.value }))} required
                className="px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50" />
              <input type="number" placeholder="Season #" value={newSeason.seasonNumber} onChange={(e) => setNewSeason(p => ({ ...p, seasonNumber: e.target.value }))} required
                className="px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50" />
              <div className="flex gap-2">
                <input type="date" value={newSeason.startDate} onChange={(e) => setNewSeason(p => ({ ...p, startDate: e.target.value }))} required
                  className="flex-1 px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white focus:outline-none focus:border-titos-gold/50 [color-scheme:dark]" />
                <input type="date" value={newSeason.endDate} onChange={(e) => setNewSeason(p => ({ ...p, endDate: e.target.value }))} required
                  className="flex-1 px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white focus:outline-none focus:border-titos-gold/50 [color-scheme:dark]" />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowNewForm(false)} className="px-4 py-2 text-titos-gray-400 hover:text-titos-white text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary text-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Season
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Seasons List */}
        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 text-titos-gold mx-auto animate-spin" /></div>
        ) : (
          <div className="space-y-8">
            {Object.entries(seasonsByLeague).map(([leagueName, leagueSeasons]) => (
              <div key={leagueName}>
                <h3 className="font-display text-lg font-bold text-titos-white mb-3">{leagueName}</h3>
                <div className="space-y-3">
                  {leagueSeasons.map(season => (
                    <div key={season.id} className="card rounded-xl overflow-hidden">
                      {/* Season Header */}
                      <div className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-titos-white">{season.name}</h4>
                              <select
                                value={season.status}
                                onChange={async (e) => {
                                  await fetch('/api/admin/seasons', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ seasonId: season.id, status: e.target.value }),
                                  })
                                  loadData()
                                }}
                                className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase appearance-none cursor-pointer border-0 focus:outline-none',
                                  season.status === 'active' ? 'bg-status-success/15 text-status-success' :
                                  season.status === 'completed' ? 'bg-titos-gray-400/15 text-titos-gray-400' :
                                  season.status === 'playoffs' ? 'bg-titos-gold/15 text-titos-gold' :
                                  'bg-status-info/15 text-status-info'
                                )}
                              >
                                <option value="registration">Registration</option>
                                <option value="active">Active</option>
                                <option value="playoffs">Playoffs</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-titos-gray-400 text-sm">
                              <span>{season._count?.teams || season.teams?.length || 0} teams</span>
                              <span>{new Date(season.startDate).toLocaleDateString()} – {new Date(season.endDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {season.status !== 'completed' && (
                              <button onClick={() => handleArchive(season.id)} disabled={archiving[season.id]}
                                className="px-3 py-2 rounded-lg text-xs font-semibold bg-titos-card text-titos-gray-300 border border-titos-border hover:text-titos-white transition-colors flex items-center gap-1.5">
                                {archiving[season.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />} Archive
                              </button>
                            )}
                            <button onClick={() => handleDeleteSeason(season.id, season.name)} disabled={deletingSeason[season.id]}
                              className="px-3 py-2 rounded-lg text-xs font-semibold bg-status-live/10 text-status-live border border-status-live/20 hover:bg-status-live/20 transition-colors flex items-center gap-1.5">
                              {deletingSeason[season.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
                            </button>
                          </div>
                        </div>

                        {/* Expand toggles */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          <button onClick={() => toggleWeeks(season.id)} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors',
                            expandedWeeks[season.id] ? 'bg-titos-gold/15 text-titos-gold border border-titos-gold/30' : 'bg-titos-elevated text-titos-gray-300 border border-titos-border hover:text-titos-white')}>
                            <ListOrdered className="w-3.5 h-3.5" /> Weeks {expandedWeeks[season.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </button>
                          <button onClick={() => toggleTeams(season.id)} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors',
                            expandedTeams[season.id] ? 'bg-titos-gold/15 text-titos-gold border border-titos-gold/30' : 'bg-titos-elevated text-titos-gray-300 border border-titos-border hover:text-titos-white')}>
                            <Users className="w-3.5 h-3.5" /> Teams {expandedTeams[season.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* ─── WEEKS ─── */}
                      {expandedWeeks[season.id] && (
                        <div className="border-t border-titos-border/50 px-5 py-4 bg-titos-surface/50">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <h5 className="font-display text-sm font-bold text-titos-gold uppercase tracking-wider">Weeks</h5>
                            <div className="flex items-center gap-2">
                              <input type="date" value={newWeekDate[season.id] || ''} onChange={(e) => setNewWeekDate(prev => ({ ...prev, [season.id]: e.target.value }))}
                                className="px-3 py-1.5 bg-titos-elevated border border-titos-border rounded-lg text-titos-white text-xs focus:outline-none focus:border-titos-gold/50 [color-scheme:dark]" />
                              <button onClick={() => handleAddWeek(season.id)} disabled={addingWeek[season.id]}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-titos-gold/15 text-titos-gold border border-titos-gold/30 hover:bg-titos-gold/25 transition-colors flex items-center gap-1.5 whitespace-nowrap">
                                {addingWeek[season.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add Week
                              </button>
                            </div>
                          </div>

                          {weeksBySeason[season.id] ? (
                            weeksBySeason[season.id].length > 0 ? (
                              <div className="space-y-2">
                                {weeksBySeason[season.id].map(week => (
                                  <div key={week.id} className="card-flat rounded-lg p-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      <div className="flex items-center gap-3">
                                        <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                                          week.weekNumber <= 2 ? 'bg-titos-gold/20 text-titos-gold' : 'bg-titos-charcoal text-titos-gray-300'
                                        )}>{week.weekNumber}</span>
                                        <div>
                                          <span className="text-titos-white text-sm font-medium">
                                            {week.weekNumber === 1 ? 'Placement' : week.weekNumber === 2 ? 'Week 2 (Manual)' : week.isPlayoff ? 'Playoffs' : `Week ${week.weekNumber}`}
                                          </span>
                                          <span className="text-titos-gray-400 text-xs ml-2">{new Date(week.date).toLocaleDateString()}</span>
                                        </div>
                                        <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold uppercase',
                                          week.status === 'completed' ? 'bg-status-success/15 text-status-success' :
                                          week.status === 'active' ? 'bg-titos-gold/15 text-titos-gold' : 'bg-titos-gray-400/15 text-titos-gray-400'
                                        )}>{week.status}</span>
                                        <span className="text-titos-gray-500 text-xs">{week._count?.matches || 0} matches · {week._count?.tierPlacements || 0} placements</span>
                                      </div>

                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {/* Setup Tiers — for weeks 1-2 with no placements */}
                                        {week.weekNumber <= 2 && (week._count?.tierPlacements || 0) === 0 && (
                                          <SetupTiersButton weekId={week.id} seasonId={season.id} teams={season.teams || []} tiers={season.tiers || []} onDone={() => loadWeeks(season.id)} />
                                        )}
                                        {/* Edit Tiers — for weeks 1-2 WITH placements */}
                                        {week.weekNumber <= 2 && (week._count?.tierPlacements || 0) > 0 && week.status !== 'completed' && (
                                          <SetupTiersButton weekId={week.id} seasonId={season.id} teams={season.teams || []} tiers={season.tiers || []} onDone={() => loadWeeks(season.id)} editMode />
                                        )}
                                        {/* Gen Matches */}
                                        {(week._count?.matches || 0) === 0 && (week._count?.tierPlacements || 0) > 0 && (
                                          <button onClick={() => handleGenerateMatches(week.id, season.id)} disabled={generatingMatches[week.id]}
                                            className="px-2.5 py-1 rounded text-[10px] font-semibold bg-titos-card text-titos-gray-300 border border-titos-border hover:text-titos-white transition-colors flex items-center gap-1">
                                            {generatingMatches[week.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Gen Matches
                                          </button>
                                        )}
                                        {/* Status controls */}
                                        {week.status === 'upcoming' && (
                                          <button onClick={() => handleWeekStatus(week.id, 'active', season.id)}
                                            className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-titos-gold/10 text-titos-gold border border-titos-gold/30 hover:bg-titos-gold/20 transition-colors">Activate</button>
                                        )}
                                        {week.status === 'active' && (
                                          <button onClick={() => handleWeekStatus(week.id, 'completed', season.id)}
                                            className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-status-success/10 text-status-success border border-status-success/30 hover:bg-status-success/20 transition-colors">Complete</button>
                                        )}
                                        {(week._count?.matches || 0) > 0 && week.status !== 'completed' && (
                                          <a href="/admin/scores" className="px-2.5 py-1 rounded text-[10px] font-semibold bg-status-info/10 text-status-info border border-status-info/30 hover:bg-status-info/20 transition-colors">Scores</a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : <p className="text-titos-gray-500 text-sm">No weeks yet. Add one above.</p>
                          ) : <div className="flex items-center gap-2 text-titos-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>}
                        </div>
                      )}

                      {/* ─── TEAMS ─── */}
                      {expandedTeams[season.id] && (
                        <div className="border-t border-titos-border/50 px-5 py-4 bg-titos-surface/50">
                          <h5 className="font-display text-sm font-bold text-titos-gold uppercase tracking-wider mb-3">Teams ({season.teams?.length || 0})</h5>
                          {season.teams?.length > 0 ? (
                            <div className="space-y-2">
                              {season.teams.map(team => {
                                const isEditing = editingTeam === team.id
                                return (
                                  <div key={team.id} className="card-flat rounded-lg overflow-hidden">
                                    <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      {isEditing ? (
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                          <input type="text" value={teamEditData.name || ''} onChange={(e) => setTeamEditData(p => ({ ...p, name: e.target.value }))}
                                            className="px-2 py-1.5 bg-titos-elevated border border-titos-border rounded text-titos-white text-sm focus:outline-none focus:border-titos-gold/50" placeholder="Team name" />
                                          <input type="text" value={teamEditData.captainName || ''} onChange={(e) => setTeamEditData(p => ({ ...p, captainName: e.target.value }))}
                                            className="px-2 py-1.5 bg-titos-elevated border border-titos-border rounded text-titos-white text-sm focus:outline-none focus:border-titos-gold/50" placeholder="Captain" />
                                          <input type="email" value={teamEditData.captainEmail || ''} onChange={(e) => setTeamEditData(p => ({ ...p, captainEmail: e.target.value }))}
                                            className="px-2 py-1.5 bg-titos-elevated border border-titos-border rounded text-titos-white text-sm focus:outline-none focus:border-titos-gold/50" placeholder="Email" />
                                        </div>
                                      ) : (
                                        <div className="flex-1">
                                          <span className="text-titos-white text-sm font-semibold">{team.name}</span>
                                          <div className="text-titos-gray-400 text-xs mt-0.5">{team.captainName} · {team.captainEmail || 'No email'}</div>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1.5">
                                        {isEditing ? (
                                          <>
                                            <button onClick={() => saveTeam(team.id)} disabled={savingTeam}
                                              className="px-2 py-1 rounded text-[10px] font-semibold bg-status-success/15 text-status-success border border-status-success/30 flex items-center gap-1">
                                              {savingTeam ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                                            </button>
                                            <button onClick={cancelEditTeam} className="px-2 py-1 rounded text-[10px] font-semibold bg-titos-card text-titos-gray-300 border border-titos-border flex items-center gap-1">
                                              <X className="w-3 h-3" /> Cancel
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            <button onClick={() => startEditTeam(team)} className="px-2 py-1 rounded text-[10px] font-semibold bg-titos-card text-titos-gray-300 border border-titos-border hover:text-titos-white transition-colors flex items-center gap-1">
                                              <Pencil className="w-3 h-3" /> Edit
                                            </button>
                                            <button onClick={() => setExpandedPlayers(p => ({ ...p, [team.id]: !p[team.id] }))}
                                              className={cn('px-2 py-1 rounded text-[10px] font-semibold border flex items-center gap-1 transition-colors',
                                                expandedPlayers[team.id] ? 'bg-titos-gold/15 text-titos-gold border-titos-gold/30' : 'bg-titos-card text-titos-gray-300 border-titos-border hover:text-titos-white')}>
                                              <Users className="w-3 h-3" /> Players ({team.players?.length || 0})
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    {/* Players */}
                                    {expandedPlayers[team.id] && (
                                      <div className="border-t border-titos-border/30 px-3 py-2 bg-titos-elevated/50">
                                        {team.players?.length > 0 && (
                                          <div className="space-y-1 mb-2">
                                            {team.players.map(player => (
                                              <div key={player.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-titos-surface/50">
                                                <div className="flex items-center gap-2">
                                                  {player.jerseyNumber != null && <span className="text-titos-gold text-[10px] font-bold w-5 text-center">#{player.jerseyNumber}</span>}
                                                  <span className="text-titos-white text-xs">{player.name}</span>
                                                </div>
                                                <button onClick={() => handleRemovePlayer(player.id)} disabled={removingPlayer[player.id]} className="text-status-live/60 hover:text-status-live transition-colors p-0.5">
                                                  {removingPlayer[player.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                          <input type="text" value={newPlayer[team.id]?.name || ''} onChange={(e) => setNewPlayer(p => ({ ...p, [team.id]: { ...p[team.id], name: e.target.value } }))}
                                            placeholder="Player name" className="flex-1 px-2 py-1 bg-titos-surface border border-titos-border rounded text-titos-white text-xs focus:outline-none focus:border-titos-gold/50" />
                                          <input type="number" value={newPlayer[team.id]?.jerseyNumber || ''} onChange={(e) => setNewPlayer(p => ({ ...p, [team.id]: { ...p[team.id], jerseyNumber: e.target.value } }))}
                                            placeholder="#" className="w-12 px-2 py-1 bg-titos-surface border border-titos-border rounded text-titos-white text-xs focus:outline-none focus:border-titos-gold/50" />
                                          <button onClick={() => handleAddPlayer(team.id)} disabled={addingPlayer}
                                            className="px-2 py-1 rounded text-[10px] font-semibold bg-titos-gold/15 text-titos-gold border border-titos-gold/30 flex items-center gap-1">
                                            {addingPlayer ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ) : <p className="text-titos-gray-500 text-sm mb-3">No teams yet.</p>}
                          <div className="mt-3 pt-3 border-t border-titos-border/30">
                            <InlineAddTeam seasonId={season.id} onAdded={loadData} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Setup Tiers Button + Modal ───
function SetupTiersButton({ weekId, seasonId, teams, tiers: initialTiers, onDone, editMode = false }) {
  const [open, setOpen] = useState(false)
  const [assignments, setAssignments] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [liveTiers, setLiveTiers] = useState(initialTiers || [])

  const openSetup = async () => {
    setOpen(true)
    setLoading(true)
    try {
      // Always fetch fresh tiers — they may have been auto-created on season create
      // or may need to be created now
      let fetchedTiers = initialTiers || []

      if (!fetchedTiers.length) {
        // Try to create tiers for this season first
        await fetch('/api/admin/tier-placements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ensure-tiers', seasonId }),
        })
        // Then fetch the season to get tiers
        const seasonsRes = await fetch('/api/admin/seasons')
        const seasonsData = await seasonsRes.json()
        const season = seasonsData.seasons?.find(s => s.id === seasonId)
        fetchedTiers = season?.tiers || []
      }

      setLiveTiers(fetchedTiers)

      if (editMode) {
        const placementsRes = await fetch(`/api/admin/tier-placements?weekId=${weekId}`)
        const placementsData = await placementsRes.json()
        const a = {}
        for (const t of fetchedTiers) { a[t.id] = [] }
        for (const p of (placementsData.placements || [])) {
          if (!a[p.tierId]) a[p.tierId] = []
          a[p.tierId].push(p.teamId)
        }
        setAssignments(a)
      } else {
        const a = {}
        for (const t of fetchedTiers) { a[t.id] = [] }
        setAssignments(a)
      }
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const assignedTeamIds = new Set(Object.values(assignments).flat())
  const unassignedTeams = teams.filter(t => !assignedTeamIds.has(t.id))

  const addToTier = (tierId, teamId) => {
    setAssignments(prev => {
      const current = prev[tierId] || []
      if (current.length >= 3) return prev // max 3 per tier
      return { ...prev, [tierId]: [...current, teamId] }
    })
  }

  const removeFromTier = (tierId, teamId) => {
    setAssignments(prev => ({ ...prev, [tierId]: (prev[tierId] || []).filter(id => id !== teamId) }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/tier-placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId, assignments }),
      })
      const data = await res.json()
      if (data.success) { setOpen(false); onDone() }
    } catch (err) { console.error(err) }
    setSaving(false)
  }

  const getTeamName = (teamId) => teams.find(t => t.id === teamId)?.name || 'Unknown'

  const modal = open && typeof document !== 'undefined' ? createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="bg-titos-elevated border border-titos-border rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-titos-border flex items-center justify-between">
          <h3 className="font-display text-lg font-black text-titos-white">
            {editMode ? 'Edit Tier Assignments' : 'Setup Tier Assignments'}
          </h3>
          <button onClick={() => setOpen(false)} className="text-titos-gray-400 hover:text-titos-white"><X className="w-5 h-5" /></button>
        </div>

        {loading ? (
          <div className="p-12 text-center"><Loader2 className="w-6 h-6 text-titos-gold mx-auto animate-spin" /></div>
        ) : (
          <div className="p-6">
            {/* Unassigned Teams */}
            {unassignedTeams.length > 0 && (
              <div className="mb-6">
                <h4 className="text-titos-gray-300 text-xs font-bold uppercase tracking-wider mb-2">Unassigned Teams ({unassignedTeams.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {unassignedTeams.map(team => (
                    <span key={team.id} className="px-3 py-1.5 bg-titos-card border border-titos-border rounded-lg text-titos-white text-sm font-medium cursor-grab">
                      {team.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tier slots */}
            <div className="grid sm:grid-cols-2 gap-4">
              {liveTiers.sort((a, b) => a.tierNumber - b.tierNumber).map(tier => {
                const tc = getTierColor(tier.tierNumber)
                const assigned = assignments[tier.id] || []
                return (
                  <div key={tier.id} className="card-flat rounded-xl overflow-hidden">
                    <div className={`px-4 py-2 flex items-center justify-between ${tc.bg}`}>
                      <span className={`font-display font-bold text-sm ${tc.text}`}>Tier {tier.tierNumber}</span>
                      <span className="text-titos-gray-400 text-xs">Court {tier.courtNumber} · {assigned.length}/3</span>
                    </div>
                    <div className="p-3 space-y-1.5 min-h-[80px]">
                      {assigned.map(teamId => (
                        <div key={teamId} className="flex items-center justify-between bg-titos-elevated rounded-lg px-3 py-2">
                          <span className="text-titos-white text-sm font-medium">{getTeamName(teamId)}</span>
                          <button onClick={() => removeFromTier(tier.id, teamId)} className="text-status-live/60 hover:text-status-live"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                      {assigned.length < 3 && (
                        <select
                          value=""
                          onChange={(e) => { if (e.target.value) addToTier(tier.id, e.target.value) }}
                          className="w-full px-3 py-2 bg-titos-surface border border-dashed border-titos-border rounded-lg text-titos-gray-400 text-sm focus:outline-none focus:border-titos-gold/50"
                        >
                          <option value="">+ Add team...</option>
                          {unassignedTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setOpen(false)} className="px-4 py-2 text-titos-gray-400 hover:text-titos-white text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving || unassignedTeams.length > 0} className="btn-primary text-sm disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {unassignedTeams.length > 0 ? `${unassignedTeams.length} unassigned` : 'Save Assignments'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      <button onClick={openSetup}
        className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-titos-gold/10 text-titos-gold border border-titos-gold/30 hover:bg-titos-gold/20 transition-colors flex items-center gap-1">
        <Users className="w-3 h-3" /> {editMode ? 'Edit Tiers' : 'Setup Tiers'}
      </button>
      {modal}
    </>
  )
}

// ─── Inline Add Team ───
function InlineAddTeam({ seasonId, onAdded }) {
  const [mode, setMode] = useState(null)
  const [name, setName] = useState('')
  const [captain, setCaptain] = useState('')
  const [email, setEmail] = useState('')
  const [bulk, setBulk] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const handleAddSingle = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const res = await fetch('/api/admin/seasons', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add-teams', seasonId, teams: [{ name: name.trim(), captainName: captain.trim() || 'TBD', captainEmail: email.trim() || '' }] }) })
    const data = await res.json()
    if (data.success) { setMsg(`Added "${name.trim()}"`); setName(''); setCaptain(''); setEmail(''); onAdded() }
    setSaving(false)
  }

  const handleAddBulk = async (e) => {
    e.preventDefault()
    if (!bulk.trim()) return
    setSaving(true)
    const teams = bulk.trim().split('\n').filter(Boolean).map(line => {
      const parts = line.split(',').map(p => p.trim())
      return { name: parts[0], captainName: parts[1] || 'TBD', captainEmail: parts[2] || '' }
    })
    const res = await fetch('/api/admin/seasons', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add-teams', seasonId, teams }) })
    const data = await res.json()
    if (data.success) { setMsg(`Added ${data.count} teams`); setBulk(''); onAdded() }
    setSaving(false)
  }

  if (!mode) return (
    <div className="flex items-center gap-2">
      <button onClick={() => setMode('single')} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-titos-gold/15 text-titos-gold border border-titos-gold/30 hover:bg-titos-gold/25 transition-colors flex items-center gap-1.5">
        <Plus className="w-3 h-3" /> Add Team
      </button>
      <button onClick={() => setMode('bulk')} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-titos-elevated text-titos-gray-300 border border-titos-border hover:text-titos-white transition-colors flex items-center gap-1.5">
        <Plus className="w-3 h-3" /> Bulk Add
      </button>
    </div>
  )

  if (mode === 'single') return (
    <form onSubmit={handleAddSingle} className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name *" required className="px-3 py-2 bg-titos-elevated border border-titos-border rounded-lg text-titos-white text-sm placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50" />
        <input type="text" value={captain} onChange={(e) => setCaptain(e.target.value)} placeholder="Captain" className="px-3 py-2 bg-titos-elevated border border-titos-border rounded-lg text-titos-white text-sm placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50" />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="px-3 py-2 bg-titos-elevated border border-titos-border rounded-lg text-titos-white text-sm placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50" />
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={saving} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-titos-gold/15 text-titos-gold border border-titos-gold/30 flex items-center gap-1">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add
        </button>
        <button type="button" onClick={() => { setMode(null); setMsg('') }} className="px-3 py-1.5 text-xs text-titos-gray-400 hover:text-titos-white">Cancel</button>
        {msg && <span className="text-status-success text-xs font-semibold">{msg}</span>}
      </div>
    </form>
  )

  return (
    <form onSubmit={handleAddBulk} className="space-y-2">
      <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={4} required placeholder="Block Party, Jessica Chen, jessica@email.com\nNet Worth, Amanda Patel"
        className="w-full px-3 py-2 bg-titos-elevated border border-titos-border rounded-lg text-titos-white text-sm placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50 font-mono" />
      <p className="text-titos-gray-500 text-[10px]">One per line: Team Name, Captain, Email</p>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={saving} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-titos-gold/15 text-titos-gold border border-titos-gold/30 flex items-center gap-1">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add All
        </button>
        <button type="button" onClick={() => { setMode(null); setMsg('') }} className="px-3 py-1.5 text-xs text-titos-gray-400 hover:text-titos-white">Cancel</button>
        {msg && <span className="text-status-success text-xs font-semibold">{msg}</span>}
      </div>
    </form>
  )
}
