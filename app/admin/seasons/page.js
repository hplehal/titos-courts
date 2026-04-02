'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Archive, Loader2, Check, Users, Calendar, ChevronDown, ChevronRight, Pencil, Save, X, Trash2, ListOrdered } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState([])
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [showAddTeams, setShowAddTeams] = useState(false)
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState({})
  const [message, setMessage] = useState('')

  // Week management state
  const [weeksBySeason, setWeeksBySeason] = useState({})
  const [expandedWeeks, setExpandedWeeks] = useState({})
  const [generatingMatches, setGeneratingMatches] = useState({})
  const [addingWeek, setAddingWeek] = useState({})

  // Team editing state
  const [expandedTeams, setExpandedTeams] = useState({})
  const [editingTeam, setEditingTeam] = useState(null)
  const [teamEditData, setTeamEditData] = useState({})
  const [savingTeam, setSavingTeam] = useState(false)
  const [expandedPlayers, setExpandedPlayers] = useState({})
  const [newPlayer, setNewPlayer] = useState({})
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [removingPlayer, setRemovingPlayer] = useState({})

  // New season form
  const [newSeason, setNewSeason] = useState({
    leagueId: '',
    name: '',
    seasonNumber: '',
    startDate: '',
    endDate: '',
  })

  // Add teams form
  const [selectedSeasonId, setSelectedSeasonId] = useState('')
  const [teamsBulk, setTeamsBulk] = useState('')
  const [addingTeams, setAddingTeams] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [seasonsRes, leaguesRes] = await Promise.all([
        fetch('/api/admin/seasons'),
        fetch('/api/leagues'),
      ])
      const seasonsData = await seasonsRes.json()
      const leaguesData = await leaguesRes.json()
      setSeasons(seasonsData.seasons || [])
      setLeagues(leaguesData || [])
    } catch (err) {
      console.error('Load error:', err)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const loadWeeks = async (seasonId) => {
    try {
      const res = await fetch(`/api/admin/weeks?seasonId=${seasonId}`)
      const data = await res.json()
      setWeeksBySeason(prev => ({ ...prev, [seasonId]: data.weeks || [] }))
    } catch (err) {
      console.error('Load weeks error:', err)
    }
  }

  const toggleWeeks = (seasonId) => {
    const isExpanded = expandedWeeks[seasonId]
    setExpandedWeeks(prev => ({ ...prev, [seasonId]: !isExpanded }))
    if (!isExpanded && !weeksBySeason[seasonId]) {
      loadWeeks(seasonId)
    }
  }

  const handleCreateSeason = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSeason),
      })
      const data = await res.json()
      if (data.error) {
        setMessage(data.error)
      } else {
        setMessage('Season created successfully.')
        setShowNewForm(false)
        setNewSeason({ leagueId: '', name: '', seasonNumber: '', startDate: '', endDate: '' })
        await loadData()
      }
    } catch (err) {
      setMessage('Failed to create season.')
    }
    setSaving(false)
  }

  const handleArchive = async (seasonId) => {
    setArchiving(prev => ({ ...prev, [seasonId]: true }))
    try {
      await fetch('/api/admin/seasons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonId, status: 'completed' }),
      })
      await loadData()
    } catch (err) {
      console.error('Archive error:', err)
    }
    setArchiving(prev => ({ ...prev, [seasonId]: false }))
  }

  const handleAddTeams = async (e) => {
    e.preventDefault()
    if (!selectedSeasonId || !teamsBulk.trim()) return
    setAddingTeams(true)
    setMessage('')
    try {
      const lines = teamsBulk.trim().split('\n').filter(l => l.trim())
      const teams = lines.map(line => {
        const parts = line.split(',').map(p => p.trim())
        return {
          name: parts[0] || '',
          captainName: parts[1] || 'TBD',
          captainEmail: parts[2] || '',
        }
      }).filter(t => t.name)

      const res = await fetch('/api/admin/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-teams',
          seasonId: selectedSeasonId,
          teams,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setMessage(data.error)
      } else {
        setMessage(`${data.count || teams.length} teams added successfully.`)
        setTeamsBulk('')
        await loadData()
      }
    } catch (err) {
      setMessage('Failed to add teams.')
    }
    setAddingTeams(false)
  }

  // ─── WEEK MANAGEMENT HANDLERS ───

  const handleAddWeek = async (seasonId) => {
    setAddingWeek(prev => ({ ...prev, [seasonId]: true }))
    setMessage('')
    try {
      const res = await fetch('/api/admin/weeks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-week', seasonId }),
      })
      const data = await res.json()
      if (data.error) {
        setMessage(data.error)
      } else {
        setMessage(`Week ${data.week?.weekNumber || ''} added successfully.`)
        await loadWeeks(seasonId)
      }
    } catch (err) {
      setMessage('Failed to add week.')
    }
    setAddingWeek(prev => ({ ...prev, [seasonId]: false }))
  }

  const handleGenerateMatches = async (weekId, seasonId) => {
    setGeneratingMatches(prev => ({ ...prev, [weekId]: true }))
    setMessage('')
    try {
      const res = await fetch('/api/admin/weeks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-matches', weekId }),
      })
      const data = await res.json()
      if (data.error) {
        setMessage(data.error)
      } else {
        setMessage(`${data.matchCount} matches generated.`)
        await loadWeeks(seasonId)
      }
    } catch (err) {
      setMessage('Failed to generate matches.')
    }
    setGeneratingMatches(prev => ({ ...prev, [weekId]: false }))
  }

  // ─── TEAM EDITING HANDLERS ───

  const toggleTeams = (seasonId) => {
    setExpandedTeams(prev => ({ ...prev, [seasonId]: !prev[seasonId] }))
  }

  const startEditTeam = (team) => {
    setEditingTeam(team.id)
    setTeamEditData({
      name: team.name,
      captainName: team.captainName,
      captainEmail: team.captainEmail,
    })
  }

  const cancelEditTeam = () => {
    setEditingTeam(null)
    setTeamEditData({})
  }

  const saveTeam = async (teamId) => {
    setSavingTeam(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/seasons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-team', teamId, ...teamEditData }),
      })
      const data = await res.json()
      if (data.error) {
        setMessage(data.error)
      } else {
        setMessage('Team updated.')
        setEditingTeam(null)
        await loadData()
      }
    } catch (err) {
      setMessage('Failed to update team.')
    }
    setSavingTeam(false)
  }

  const togglePlayers = (teamId) => {
    setExpandedPlayers(prev => ({ ...prev, [teamId]: !prev[teamId] }))
  }

  const handleAddPlayer = async (teamId) => {
    const { name, jerseyNumber } = newPlayer[teamId] || {}
    if (!name?.trim()) return
    setAddingPlayer(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-player',
          teamId,
          playerName: name.trim(),
          jerseyNumber: jerseyNumber || null,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setMessage(data.error)
      } else {
        setNewPlayer(prev => ({ ...prev, [teamId]: { name: '', jerseyNumber: '' } }))
        await loadData()
      }
    } catch (err) {
      setMessage('Failed to add player.')
    }
    setAddingPlayer(false)
  }

  const handleRemovePlayer = async (playerId) => {
    setRemovingPlayer(prev => ({ ...prev, [playerId]: true }))
    try {
      await fetch(`/api/admin/seasons?action=remove-player&playerId=${playerId}`, {
        method: 'DELETE',
      })
      await loadData()
    } catch (err) {
      console.error('Remove player error:', err)
    }
    setRemovingPlayer(prev => ({ ...prev, [playerId]: false }))
  }

  // Group seasons by league
  const seasonsByLeague = {}
  for (const s of seasons) {
    const leagueName = s.league?.name || 'Unknown'
    if (!seasonsByLeague[leagueName]) seasonsByLeague[leagueName] = []
    seasonsByLeague[leagueName].push(s)
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-titos-gray-400 hover:text-titos-gold transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-2xl font-black text-titos-white">Season Management</h1>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => { setShowNewForm(!showNewForm); setShowAddTeams(false) }}
            className={cn(
              'px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors',
              showNewForm
                ? 'bg-titos-gold/15 text-titos-gold border border-titos-gold/30'
                : 'bg-titos-card text-titos-gray-300 border border-titos-border hover:text-titos-white'
            )}
          >
            <Plus className="w-4 h-4" /> New Season
          </button>
          <button
            onClick={() => { setShowAddTeams(!showAddTeams); setShowNewForm(false) }}
            className={cn(
              'px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors',
              showAddTeams
                ? 'bg-titos-gold/15 text-titos-gold border border-titos-gold/30'
                : 'bg-titos-card text-titos-gray-300 border border-titos-border hover:text-titos-white'
            )}
          >
            <Users className="w-4 h-4" /> Add Teams
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 card-flat rounded-xl p-4 bg-titos-gold/5 border border-titos-gold/20">
            <span className="text-titos-gold text-sm font-medium">{message}</span>
          </div>
        )}

        {/* New Season Form */}
        {showNewForm && (
          <div className="card rounded-xl p-6 mb-8">
            <h3 className="font-display text-lg font-bold text-titos-white mb-4">Create New Season</h3>
            <form onSubmit={handleCreateSeason} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-titos-gray-300 mb-1">League</label>
                  <select
                    value={newSeason.leagueId}
                    onChange={(e) => setNewSeason(prev => ({ ...prev, leagueId: e.target.value }))}
                    className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white focus:outline-none focus:border-titos-gold/50"
                    required
                  >
                    <option value="">Select league...</option>
                    {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-titos-gray-300 mb-1">Season Name</label>
                  <input
                    type="text"
                    value={newSeason.name}
                    onChange={(e) => setNewSeason(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Season 11 — Summer 2026"
                    className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-titos-gray-300 mb-1">Season Number</label>
                  <input
                    type="number"
                    value={newSeason.seasonNumber}
                    onChange={(e) => setNewSeason(prev => ({ ...prev, seasonNumber: e.target.value }))}
                    placeholder="e.g., 11"
                    className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-titos-gray-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newSeason.startDate}
                    onChange={(e) => setNewSeason(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white focus:outline-none focus:border-titos-gold/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-titos-gray-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newSeason.endDate}
                    onChange={(e) => setNewSeason(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white focus:outline-none focus:border-titos-gold/50"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Season
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Teams Form */}
        {showAddTeams && (
          <div className="card rounded-xl p-6 mb-8">
            <h3 className="font-display text-lg font-bold text-titos-white mb-4">Add Teams to Season</h3>
            <form onSubmit={handleAddTeams} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-titos-gray-300 mb-1">Select Season</label>
                <select
                  value={selectedSeasonId}
                  onChange={(e) => setSelectedSeasonId(e.target.value)}
                  className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white focus:outline-none focus:border-titos-gold/50"
                  required
                >
                  <option value="">Select season...</option>
                  {seasons.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.league?.name} — {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-titos-gray-300 mb-1">
                  Team Names (one per line, format: Team Name, Captain Name, email)
                </label>
                <textarea
                  value={teamsBulk}
                  onChange={(e) => setTeamsBulk(e.target.value)}
                  placeholder={"Block Party, Jessica Chen, jessica@email.com\nNet Worth, Amanda Patel, amanda@email.com\nSpike Lee"}
                  rows={8}
                  className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50 font-mono text-sm"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={addingTeams} className="btn-primary">
                  {addingTeams ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  Add Teams
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Current Seasons */}
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 text-titos-gold mx-auto animate-spin" />
            <p className="text-titos-gray-400 mt-3">Loading seasons...</p>
          </div>
        ) : (
          <div className="space-y-6">
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
                              <span className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                                season.status === 'active' ? 'bg-status-success/15 text-status-success' :
                                season.status === 'completed' ? 'bg-titos-gray-400/15 text-titos-gray-400' :
                                season.status === 'registration' ? 'bg-status-info/15 text-status-info' :
                                'bg-titos-gray-400/15 text-titos-gray-400'
                              )}>
                                {season.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-titos-gray-400 text-sm">
                              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Season {season.seasonNumber}</span>
                              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {season._count?.teams || 0} teams</span>
                              <span>{new Date(season.startDate).toLocaleDateString()} – {new Date(season.endDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {season.status === 'active' && (
                              <button
                                onClick={() => handleArchive(season.id)}
                                disabled={archiving[season.id]}
                                className="px-3 py-2 rounded-lg text-xs font-semibold bg-titos-card text-titos-gray-300 border border-titos-border hover:text-titos-white transition-colors flex items-center gap-1.5"
                              >
                                {archiving[season.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                                Archive
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expandable sections */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          <button
                            onClick={() => toggleWeeks(season.id)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors',
                              expandedWeeks[season.id]
                                ? 'bg-titos-gold/15 text-titos-gold border border-titos-gold/30'
                                : 'bg-titos-elevated text-titos-gray-300 border border-titos-border hover:text-titos-white'
                            )}
                          >
                            <ListOrdered className="w-3.5 h-3.5" />
                            Weeks
                            {expandedWeeks[season.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => toggleTeams(season.id)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors',
                              expandedTeams[season.id]
                                ? 'bg-titos-gold/15 text-titos-gold border border-titos-gold/30'
                                : 'bg-titos-elevated text-titos-gray-300 border border-titos-border hover:text-titos-white'
                            )}
                          >
                            <Users className="w-3.5 h-3.5" />
                            Teams
                            {expandedTeams[season.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* ─── WEEK MANAGEMENT ─── */}
                      {expandedWeeks[season.id] && (
                        <div className="border-t border-titos-border/50 px-5 py-4 bg-titos-surface/50">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-display text-sm font-bold text-titos-gold uppercase tracking-wider">Week Management</h5>
                            <button
                              onClick={() => handleAddWeek(season.id)}
                              disabled={addingWeek[season.id]}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-titos-gold/15 text-titos-gold border border-titos-gold/30 hover:bg-titos-gold/25 transition-colors flex items-center gap-1.5"
                            >
                              {addingWeek[season.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                              Add Next Week
                            </button>
                          </div>

                          {weeksBySeason[season.id] ? (
                            weeksBySeason[season.id].length > 0 ? (
                              <div className="space-y-2">
                                {weeksBySeason[season.id].map(week => (
                                  <div key={week.id} className="card-flat rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                      <span className={cn(
                                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                                        week.isPlayoff ? 'bg-titos-gold/20 text-titos-gold' : 'bg-titos-charcoal text-titos-gray-300'
                                      )}>
                                        {week.weekNumber}
                                      </span>
                                      <div>
                                        <span className="text-titos-white text-sm font-medium">
                                          {week.isPlayoff ? 'Playoffs' : `Week ${week.weekNumber}`}
                                        </span>
                                        <span className="text-titos-gray-400 text-xs ml-2">
                                          {new Date(week.date).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <span className={cn(
                                        'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider',
                                        week.status === 'completed' ? 'bg-status-success/15 text-status-success' :
                                        week.status === 'active' ? 'bg-titos-gold/15 text-titos-gold' :
                                        'bg-titos-gray-400/15 text-titos-gray-400'
                                      )}>
                                        {week.status}
                                      </span>
                                      <span className="text-titos-gray-500 text-xs">
                                        {week._count?.matches || 0} matches
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {week.status === 'upcoming' && (week._count?.matches || 0) === 0 && (week._count?.tierPlacements || 0) > 0 && (
                                        <button
                                          onClick={() => handleGenerateMatches(week.id, season.id)}
                                          disabled={generatingMatches[week.id]}
                                          className="px-2.5 py-1 rounded text-[10px] font-semibold bg-titos-card text-titos-gray-300 border border-titos-border hover:text-titos-white transition-colors flex items-center gap-1"
                                        >
                                          {generatingMatches[week.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                          Generate Matches
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-titos-gray-500 text-sm">No weeks yet.</p>
                            )
                          ) : (
                            <div className="flex items-center gap-2 text-titos-gray-400 text-sm">
                              <Loader2 className="w-4 h-4 animate-spin" /> Loading weeks...
                            </div>
                          )}
                        </div>
                      )}

                      {/* ─── TEAMS SECTION ─── */}
                      {expandedTeams[season.id] && (
                        <div className="border-t border-titos-border/50 px-5 py-4 bg-titos-surface/50">
                          <h5 className="font-display text-sm font-bold text-titos-gold uppercase tracking-wider mb-3">Teams</h5>
                          {season.teams && season.teams.length > 0 ? (
                            <div className="space-y-2">
                              {season.teams.map(team => {
                                const isEditing = editingTeam === team.id
                                const currentTier = team.tierPlacements?.[0]?.tier
                                return (
                                  <div key={team.id} className="card-flat rounded-lg overflow-hidden">
                                    {/* Team row */}
                                    <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      {isEditing ? (
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                          <input
                                            type="text"
                                            value={teamEditData.name || ''}
                                            onChange={(e) => setTeamEditData(prev => ({ ...prev, name: e.target.value }))}
                                            className="px-2 py-1.5 bg-titos-elevated border border-titos-border rounded text-titos-white text-sm focus:outline-none focus:border-titos-gold/50"
                                            placeholder="Team name"
                                          />
                                          <input
                                            type="text"
                                            value={teamEditData.captainName || ''}
                                            onChange={(e) => setTeamEditData(prev => ({ ...prev, captainName: e.target.value }))}
                                            className="px-2 py-1.5 bg-titos-elevated border border-titos-border rounded text-titos-white text-sm focus:outline-none focus:border-titos-gold/50"
                                            placeholder="Captain name"
                                          />
                                          <input
                                            type="email"
                                            value={teamEditData.captainEmail || ''}
                                            onChange={(e) => setTeamEditData(prev => ({ ...prev, captainEmail: e.target.value }))}
                                            className="px-2 py-1.5 bg-titos-elevated border border-titos-border rounded text-titos-white text-sm focus:outline-none focus:border-titos-gold/50"
                                            placeholder="Captain email"
                                          />
                                        </div>
                                      ) : (
                                        <div className="flex-1">
                                          <div className="flex items-center gap-3">
                                            <span className="text-titos-white text-sm font-semibold">{team.name}</span>
                                            {currentTier && (
                                              <span className="text-titos-gray-500 text-[10px] font-bold uppercase">Tier {currentTier.tierNumber}</span>
                                            )}
                                          </div>
                                          <div className="text-titos-gray-400 text-xs mt-0.5">
                                            {team.captainName} &middot; {team.captainEmail || 'No email'}
                                          </div>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1.5">
                                        {isEditing ? (
                                          <>
                                            <button
                                              onClick={() => saveTeam(team.id)}
                                              disabled={savingTeam}
                                              className="px-2 py-1 rounded text-[10px] font-semibold bg-status-success/15 text-status-success border border-status-success/30 flex items-center gap-1"
                                            >
                                              {savingTeam ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                                            </button>
                                            <button
                                              onClick={cancelEditTeam}
                                              className="px-2 py-1 rounded text-[10px] font-semibold bg-titos-card text-titos-gray-300 border border-titos-border flex items-center gap-1"
                                            >
                                              <X className="w-3 h-3" /> Cancel
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            <button
                                              onClick={() => startEditTeam(team)}
                                              className="px-2 py-1 rounded text-[10px] font-semibold bg-titos-card text-titos-gray-300 border border-titos-border hover:text-titos-white transition-colors flex items-center gap-1"
                                            >
                                              <Pencil className="w-3 h-3" /> Edit
                                            </button>
                                            <button
                                              onClick={() => togglePlayers(team.id)}
                                              className={cn(
                                                'px-2 py-1 rounded text-[10px] font-semibold border flex items-center gap-1 transition-colors',
                                                expandedPlayers[team.id]
                                                  ? 'bg-titos-gold/15 text-titos-gold border-titos-gold/30'
                                                  : 'bg-titos-card text-titos-gray-300 border-titos-border hover:text-titos-white'
                                              )}
                                            >
                                              <Users className="w-3 h-3" /> Players ({team.players?.length || 0})
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {/* Players sub-section */}
                                    {expandedPlayers[team.id] && (
                                      <div className="border-t border-titos-border/30 px-3 py-2 bg-titos-elevated/50">
                                        {team.players && team.players.length > 0 ? (
                                          <div className="space-y-1 mb-2">
                                            {team.players.map(player => (
                                              <div key={player.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-titos-surface/50">
                                                <div className="flex items-center gap-2">
                                                  {player.jerseyNumber != null && (
                                                    <span className="text-titos-gold text-[10px] font-bold w-5 text-center">#{player.jerseyNumber}</span>
                                                  )}
                                                  <span className="text-titos-white text-xs">{player.name}</span>
                                                </div>
                                                <button
                                                  onClick={() => handleRemovePlayer(player.id)}
                                                  disabled={removingPlayer[player.id]}
                                                  className="text-status-live/60 hover:text-status-live transition-colors p-0.5"
                                                >
                                                  {removingPlayer[player.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-titos-gray-500 text-xs mb-2">No players yet.</p>
                                        )}
                                        {/* Add player form */}
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="text"
                                            value={newPlayer[team.id]?.name || ''}
                                            onChange={(e) => setNewPlayer(prev => ({ ...prev, [team.id]: { ...prev[team.id], name: e.target.value } }))}
                                            placeholder="Player name"
                                            className="flex-1 px-2 py-1 bg-titos-surface border border-titos-border rounded text-titos-white text-xs focus:outline-none focus:border-titos-gold/50"
                                          />
                                          <input
                                            type="number"
                                            value={newPlayer[team.id]?.jerseyNumber || ''}
                                            onChange={(e) => setNewPlayer(prev => ({ ...prev, [team.id]: { ...prev[team.id], jerseyNumber: e.target.value } }))}
                                            placeholder="#"
                                            className="w-12 px-2 py-1 bg-titos-surface border border-titos-border rounded text-titos-white text-xs focus:outline-none focus:border-titos-gold/50"
                                          />
                                          <button
                                            onClick={() => handleAddPlayer(team.id)}
                                            disabled={addingPlayer}
                                            className="px-2 py-1 rounded text-[10px] font-semibold bg-titos-gold/15 text-titos-gold border border-titos-gold/30 flex items-center gap-1"
                                          >
                                            {addingPlayer ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="text-titos-gray-500 text-sm">No teams in this season.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {Object.keys(seasonsByLeague).length === 0 && (
              <div className="card rounded-xl p-8 text-center">
                <p className="text-titos-gray-400">No seasons found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
