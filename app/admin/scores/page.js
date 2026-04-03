'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Check, Loader2, ChevronRight, Zap, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { cn, getTierColor } from '@/lib/utils'

export default function ScoreEntryPage() {
  const [leagues, setLeagues] = useState([])
  const [selectedLeague, setSelectedLeague] = useState('')
  const [weeks, setWeeks] = useState([])
  const [selectedWeek, setSelectedWeek] = useState('')
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState({})
  const [saved, setSaved] = useState({})
  const [quickFill, setQuickFill] = useState(false)
  const [saveSummary, setSaveSummary] = useState(null)
  const [markingComplete, setMarkingComplete] = useState(false)

  // Load leagues
  useEffect(() => {
    fetch('/api/leagues').then(r => r.json()).then(data => {
      const active = data.filter(l => l.isActive)
      setLeagues(active)
      if (active.length > 0) setSelectedLeague(active[0].slug)
    })
  }, [])

  // Load weeks when league changes — fetch ALL seasons for this league, not just active
  useEffect(() => {
    if (!selectedLeague) return
    // First get the league's seasons (including registration status)
    fetch(`/api/admin/seasons`).then(r => r.json()).then(async (data) => {
      const seasons = data.seasons || []
      // Find the latest season for this league (by season number)
      const leagueSeasons = seasons
        .filter(s => s.league?.slug === selectedLeague)
        .sort((a, b) => b.seasonNumber - a.seasonNumber)
      const season = leagueSeasons[0]
      if (!season) { setWeeks([]); setSelectedWeek(''); return }

      // Fetch weeks for this season
      const weeksRes = await fetch(`/api/admin/weeks?seasonId=${season.id}`)
      const weeksData = await weeksRes.json()
      const allWeeks = weeksData.weeks || []
      setWeeks(allWeeks)

      // Default to active week first, then first with matches, then upcoming
      const activeW = allWeeks.find(w => w.status === 'active')
      const withMatches = allWeeks.find(w => (w._count?.matches || 0) > 0 && w.status !== 'completed')
      const upcoming = allWeeks.find(w => w.status === 'upcoming')
      const lastCompleted = [...allWeeks].reverse().find(w => w.status === 'completed')
      setSelectedWeek(activeW?.id || withMatches?.id || lastCompleted?.id || upcoming?.id || '')
    })
  }, [selectedLeague])

  // Load matches for selected week
  useEffect(() => {
    if (!selectedWeek) return
    setLoading(true)
    setSaveSummary(null)
    fetch(`/api/admin/scores?weekId=${selectedWeek}`).then(r => r.json()).then(data => {
      setMatches(data.matches || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [selectedWeek])

  const updateScore = (matchId, setNumber, field, value) => {
    setMatches(prev => prev.map(m => {
      if (m.id !== matchId) return m
      const scores = [...(m.scores || [])]
      const idx = scores.findIndex(s => s.setNumber === setNumber)
      if (idx >= 0) {
        scores[idx] = { ...scores[idx], [field]: parseInt(value) || 0 }
      } else {
        scores.push({ setNumber, homeScore: 0, awayScore: 0, [field]: parseInt(value) || 0 })
      }
      return { ...m, scores }
    }))
  }

  const saveMatch = async (matchId) => {
    const match = matches.find(m => m.id === matchId)
    if (!match) return
    setSaving(prev => ({ ...prev, [matchId]: true }))
    try {
      await fetch('/api/admin/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          scores: match.scores.filter(s => s.homeScore > 0 || s.awayScore > 0),
          status: 'completed',
        }),
      })
      setSaved(prev => ({ ...prev, [matchId]: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, [matchId]: false })), 2000)
      return true
    } catch (err) {
      console.error('Save error:', err)
      return false
    } finally {
      setSaving(prev => ({ ...prev, [matchId]: false }))
    }
  }

  const saveAllMatches = async () => {
    let savedCount = 0
    for (const match of matches) {
      if (match.scores?.some(s => s.homeScore > 0 || s.awayScore > 0)) {
        const ok = await saveMatch(match.id)
        if (ok) savedCount++
      }
    }
    setSaveSummary(`${savedCount} match${savedCount !== 1 ? 'es' : ''} saved. Ready to calculate tier movements.`)
  }

  const markWeekComplete = async () => {
    setMarkingComplete(true)
    try {
      // Save all matches with scores first
      let savedCount = 0
      for (const match of matches) {
        if (match.scores?.some(s => s.homeScore > 0 || s.awayScore > 0)) {
          await fetch('/api/admin/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              matchId: match.id,
              scores: match.scores.filter(s => s.homeScore > 0 || s.awayScore > 0),
              status: 'completed',
            }),
          })
          savedCount++
        }
      }

      // Mark the week as completed
      if (selectedWeek) {
        await fetch('/api/admin/scores', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weekId: selectedWeek, status: 'completed' }),
        })
      }

      setSaveSummary(`Week marked complete. ${savedCount} match${savedCount !== 1 ? 'es' : ''} saved. Ready to calculate tier movements.`)

      // Refresh weeks list to show updated status
      if (selectedLeague) {
        const res = await fetch(`/api/leagues/${selectedLeague}/schedule`)
        const data = await res.json()
        setWeeks(data.weeks || [])
      }
    } catch (err) {
      console.error('Mark complete error:', err)
    }
    setMarkingComplete(false)
  }

  // Group matches by tier
  const matchesByTier = {}
  for (const m of matches) {
    if (!matchesByTier[m.tierNumber]) matchesByTier[m.tierNumber] = []
    matchesByTier[m.tierNumber].push(m)
  }

  const selectedWeekObj = weeks.find(w => w.id === selectedWeek)

  return (
    <div className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-titos-gray-400 hover:text-titos-gold transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-2xl font-black text-titos-white">Score Entry</h1>
        </div>

        {/* Selectors */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-titos-gray-300 mb-2">League</label>
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="w-full px-4 py-3 bg-titos-card border border-titos-border rounded-lg text-titos-white focus:outline-none focus:border-titos-gold/50"
            >
              {leagues.map(l => <option key={l.slug} value={l.slug}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-titos-gray-300 mb-2">Week</label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-full px-4 py-3 bg-titos-card border border-titos-border rounded-lg text-titos-white focus:outline-none focus:border-titos-gold/50"
            >
              <option value="">Select week...</option>
              {weeks.map(w => (
                <option key={w.id} value={w.id}>
                  Week {w.weekNumber} {w.isPlayoff ? '(Playoffs)' : ''} — {w.status} — {w._count?.matches || 0} matches
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action bar */}
        {matches.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="text-titos-gray-400 text-xs">Each match = 1 set (to 25, cap 27)</span>
            <div className="flex-1" />

            <button
              onClick={markWeekComplete}
              disabled={markingComplete}
              className="px-4 py-2.5 rounded-lg text-sm font-bold bg-status-success/15 text-status-success border border-status-success/30 hover:bg-status-success/25 transition-colors flex items-center gap-2"
            >
              {markingComplete ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Mark Week Complete
            </button>

            <button onClick={saveAllMatches} className="btn-primary">
              <Save className="w-4 h-4" /> Save All Scores
            </button>
          </div>
        )}

        {/* Save summary */}
        {saveSummary && (
          <div className="mb-6 card-flat rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-status-success/5 border border-status-success/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-status-success" />
              <span className="text-status-success font-semibold text-sm">{saveSummary}</span>
            </div>
            <Link
              href={`/admin/tiers?league=${selectedLeague}&week=${selectedWeek}`}
              className="px-4 py-2 rounded-lg text-sm font-bold bg-titos-gold/15 text-titos-gold border border-titos-gold/30 hover:bg-titos-gold/25 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              Calculate Tier Movements <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 text-titos-gold mx-auto animate-spin" />
            <p className="text-titos-gray-400 mt-3">Loading matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="card rounded-xl p-8 text-center">
            <p className="text-titos-gray-400">
              {selectedWeek ? 'No matches found for this week.' : 'Select a league and week to enter scores.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(matchesByTier).sort(([a], [b]) => a - b).map(([tierNum, tierMatches]) => {
              const tc = getTierColor(parseInt(tierNum))
              return (
                <div key={tierNum} className="card-flat rounded-2xl overflow-hidden">
                  <div className={`px-5 py-3 flex items-center justify-between ${tc.bg}`} style={{ borderLeft: `3px solid var(--color-${tc.accent})` }}>
                    <span className={`font-display text-lg font-black ${tc.text}`}>Tier {tierNum}</span>
                    <span className="text-titos-gray-400 text-xs">Court {tierMatches[0]?.courtNumber}</span>
                  </div>
                  <div className="p-3">
                    {/* Header row */}
                    <div className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-2 items-center px-3 py-1.5 mb-1">
                      <span className="text-titos-gray-500 text-[10px] font-bold uppercase w-6">#</span>
                      <span className="text-titos-gray-500 text-[10px] font-bold uppercase">Home</span>
                      <span className="text-titos-gray-500 text-[10px] font-bold uppercase">Away</span>
                      <span className="text-titos-gray-500 text-[10px] font-bold uppercase text-center w-14">H</span>
                      <span className="text-titos-gray-500 text-[10px] font-bold uppercase text-center w-14">A</span>
                      <div className="w-16" />
                    </div>
                    {tierMatches.map(match => {
                      const s1 = match.scores?.find(s => s.setNumber === 1) || { homeScore: '', awayScore: '' }
                      return (
                        <div key={match.id} className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-2 items-center bg-titos-elevated rounded-lg px-3 py-2.5 mb-1.5 border border-titos-border/30">
                          <span className="text-titos-gray-500 text-xs font-bold w-6">{match.gameOrder}</span>
                          <span className="text-titos-white font-bold text-sm truncate">{match.homeTeam?.name}</span>
                          <span className="text-titos-gray-200 font-medium text-sm truncate">{match.awayTeam?.name}</span>
                          <input
                            type="number"
                            min="0" max="27"
                            value={s1.homeScore}
                            onChange={(e) => updateScore(match.id, 1, 'homeScore', e.target.value)}
                            className="w-14 px-1 py-1.5 bg-titos-surface border border-titos-border rounded-lg text-center text-titos-white font-bold text-base focus:outline-none focus:border-titos-gold/50"
                          />
                          <input
                            type="number"
                            min="0" max="27"
                            value={s1.awayScore}
                            onChange={(e) => updateScore(match.id, 1, 'awayScore', e.target.value)}
                            className="w-14 px-1 py-1.5 bg-titos-surface border border-titos-border rounded-lg text-center text-titos-white font-bold text-base focus:outline-none focus:border-titos-gold/50"
                          />
                          <button
                            onClick={() => saveMatch(match.id)}
                            disabled={saving[match.id]}
                            className={cn(
                              'w-16 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1',
                              saved[match.id]
                                ? 'bg-status-success/15 text-status-success'
                                : 'bg-titos-gold/10 text-titos-gold hover:bg-titos-gold/20'
                            )}
                          >
                            {saving[match.id] ? <Loader2 className="w-3 h-3 animate-spin" /> :
                             saved[match.id] ? <Check className="w-3 h-3" /> :
                             <Save className="w-3 h-3" />}
                          </button>
                        </div>
                      )
                    })}
                    {tierMatches[0]?.refTeam && (
                      <p className="text-titos-gray-500 text-[10px] px-3 mt-1">Ref rotation: sitting-out team refs each game</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
