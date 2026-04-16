'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Check, Loader2, ChevronRight, CheckCircle2 } from 'lucide-react'
import { cn, getTierColor, getSlotInfo } from '@/lib/utils'

export default function ScoreEntryPage() {
  const [leagues, setLeagues] = useState([])
  const [selectedLeague, setSelectedLeague] = useState('')
  const [weeks, setWeeks] = useState([])
  const [selectedWeek, setSelectedWeek] = useState('')
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveSummary, setSaveSummary] = useState(null)
  const inputRefs = useRef({})

  useEffect(() => {
    fetch('/api/leagues').then(r => r.json()).then(data => {
      const active = data.filter(l => l.isActive)
      setLeagues(active)
      if (active.length > 0) setSelectedLeague(active[0].slug)
    })
  }, [])

  useEffect(() => {
    if (!selectedLeague) return
    fetch(`/api/admin/seasons`).then(r => r.json()).then(async (data) => {
      const seasons = data.seasons || []
      const leagueSeasons = seasons.filter(s => s.league?.slug === selectedLeague).sort((a, b) => b.seasonNumber - a.seasonNumber)
      const season = leagueSeasons[0]
      if (!season) { setWeeks([]); setSelectedWeek(''); return }
      const weeksRes = await fetch(`/api/admin/weeks?seasonId=${season.id}`)
      const weeksData = await weeksRes.json()
      const allWeeks = weeksData.weeks || []
      setWeeks(allWeeks)
      const activeW = allWeeks.find(w => w.status === 'active')
      const withMatches = allWeeks.find(w => (w._count?.matches || 0) > 0 && w.status !== 'completed')
      const lastCompleted = [...allWeeks].reverse().find(w => w.status === 'completed')
      setSelectedWeek(activeW?.id || withMatches?.id || lastCompleted?.id || '')
    })
  }, [selectedLeague])

  useEffect(() => {
    if (!selectedWeek) return
    setLoading(true)
    setSaved(false)
    setSaveSummary(null)
    fetch(`/api/admin/scores?weekId=${selectedWeek}`).then(r => r.json()).then(data => {
      setMatches(data.matches || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [selectedWeek])

  const updateScore = useCallback((matchId, value) => {
    const numVal = value === '' ? '' : parseInt(value) || 0
    setMatches(prev => prev.map(m => {
      if (m.id !== matchId) return m
      const scores = [...(m.scores || [])]
      const idx = scores.findIndex(s => s.setNumber === 1)
      if (idx >= 0) {
        scores[idx] = { ...scores[idx], homeScore: typeof numVal === 'number' ? numVal : scores[idx].homeScore }
      }
      return { ...m, scores }
    }))
  }, [])

  const updateMatchScore = useCallback((matchId, field, value) => {
    const numVal = value === '' ? '' : parseInt(value) || 0
    setMatches(prev => prev.map(m => {
      if (m.id !== matchId) return m
      const scores = [...(m.scores || [])]
      const idx = scores.findIndex(s => s.setNumber === 1)
      if (idx >= 0) {
        scores[idx] = { ...scores[idx], [field]: numVal }
      } else {
        scores.push({ setNumber: 1, homeScore: 0, awayScore: 0, [field]: numVal })
      }
      return { ...m, scores }
    }))
  }, [])

  const saveAllScores = async () => {
    setSaving(true)
    let count = 0
    for (const match of matches) {
      const s = match.scores?.[0]
      if (s && (s.homeScore > 0 || s.awayScore > 0)) {
        await fetch('/api/admin/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId: match.id,
            scores: [{ setNumber: 1, homeScore: s.homeScore, awayScore: s.awayScore }],
            status: 'completed',
          }),
        })
        count++
      }
    }
    setSaving(false)
    setSaved(true)
    setSaveSummary(`${count} matches saved`)
    setTimeout(() => setSaved(false), 3000)
  }

  const markWeekComplete = async () => {
    await saveAllScores()
    await fetch('/api/admin/scores', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekId: selectedWeek, status: 'completed' }),
    })
    setSaveSummary('Week marked complete! All scores saved.')
    // Reload weeks
    const season = weeks.find(w => w.id === selectedWeek)
    if (season) {
      const weeksRes = await fetch(`/api/admin/weeks?seasonId=${weeks[0]?.seasonId || ''}`).then(r => r.json())
      setWeeks(weeksRes.weeks || [])
    }
  }

  // Handle Enter/Tab navigation between score inputs
  const handleKeyDown = (e, matchId, field) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      // Find next input
      const allInputs = Object.keys(inputRefs.current).sort()
      const currentKey = `${matchId}-${field}`
      const currentIdx = allInputs.indexOf(currentKey)
      if (currentIdx >= 0 && currentIdx < allInputs.length - 1) {
        const nextKey = allInputs[currentIdx + 1]
        inputRefs.current[nextKey]?.focus()
        inputRefs.current[nextKey]?.select()
      }
    }
  }

  // Group matches by tier
  const matchesByTier = {}
  for (const m of matches) {
    if (!matchesByTier[m.tierNumber]) matchesByTier[m.tierNumber] = []
    matchesByTier[m.tierNumber].push(m)
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-titos-gray-400 hover:text-titos-gold transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-display text-2xl font-black text-titos-white">Score Entry</h1>
        </div>

        {/* Selectors */}
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <select value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)}
            className="px-4 py-3 bg-titos-card border border-titos-border rounded-lg text-titos-white text-sm focus:outline-none focus:border-titos-gold/50">
            {leagues.map(l => <option key={l.slug} value={l.slug}>{l.name}</option>)}
          </select>
          <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}
            className="px-4 py-3 bg-titos-card border border-titos-border rounded-lg text-titos-white text-sm focus:outline-none focus:border-titos-gold/50">
            <option value="">Select week...</option>
            {weeks.map(w => (
              <option key={w.id} value={w.id}>
                Week {w.weekNumber} — {w.status} — {w._count?.matches || 0} matches
              </option>
            ))}
          </select>
        </div>

        {/* Action bar */}
        {matches.length > 0 && (
          <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-titos-elevated border border-titos-border/30">
            <span className="text-titos-gray-400 text-xs flex-1">
              {matches.length} matches · Tab/Enter to move between fields · Each match = 1 set
            </span>
            <button onClick={markWeekComplete} className="px-4 py-2 rounded-lg text-xs font-bold bg-status-success/15 text-status-success border border-status-success/30 hover:bg-status-success/25 transition-colors flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Complete Week
            </button>
            <button onClick={saveAllScores} disabled={saving} className="btn-primary text-xs py-2">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save All'}
            </button>
          </div>
        )}

        {/* Summary */}
        {saveSummary && (
          <div className="mb-6 p-3 rounded-xl bg-status-success/5 border border-status-success/20 flex items-center justify-between">
            <span className="text-status-success font-semibold text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{saveSummary}</span>
            <Link href="/admin/tiers" className="px-3 py-1.5 rounded-lg text-xs font-bold bg-titos-gold/15 text-titos-gold border border-titos-gold/30 flex items-center gap-1">
              Calculate Tiers <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 text-titos-gold mx-auto animate-spin" /></div>
        ) : matches.length === 0 ? (
          <div className="card rounded-xl p-8 text-center"><p className="text-titos-gray-400">Select a league and week to enter scores.</p></div>
        ) : (
          <div className="space-y-4">
            {Object.entries(matchesByTier).sort(([a], [b]) => a - b).map(([tierNum, tierMatches]) => {
              const slot = getSlotInfo(parseInt(tierNum), tierMatches[0]?.timeSlot)
              const slotVar = parseInt(tierNum) <= 4 ? 'slot-early' : parseInt(tierNum) <= 8 ? 'slot-late' : 'slot-single'

              return (
                <div key={tierNum} className="card-flat rounded-xl overflow-hidden">
                  <div className={cn('px-4 py-2.5 flex items-center justify-between', slot.bg)} style={{ borderLeft: `3px solid var(--color-${slotVar})` }}>
                    <div className="flex items-center gap-2">
                      <span className={cn('font-display text-base font-black', slot.color)}>T{tierNum}</span>
                      <span className="text-titos-gray-400 text-xs">Court {tierMatches[0]?.courtNumber}</span>
                    </div>
                    <span className={cn('text-[11px] font-bold uppercase', slot.color)}>{slot.label}</span>
                  </div>

                  {/* Score grid — spreadsheet style */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-[11px] font-bold uppercase tracking-wider text-titos-gray-500">
                          <th className="px-3 py-2 text-left w-8">#</th>
                          <th className="px-3 py-2 text-left">Home</th>
                          <th className="py-2 text-center w-16">H</th>
                          <th className="py-2 text-center w-4">-</th>
                          <th className="py-2 text-center w-16">A</th>
                          <th className="px-3 py-2 text-left">Away</th>
                          <th className="px-3 py-2 text-right">Ref</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tierMatches.map((match, idx) => {
                          const s = match.scores?.[0] || { homeScore: '', awayScore: '' }
                          const homeKey = `${match.id}-home`
                          const awayKey = `${match.id}-away`
                          const isNewRound = idx > 0 && idx % 3 === 0

                          return (
                            <tr key={match.id} className={cn(
                              'border-t border-titos-border/15 hover:bg-titos-white/[0.02] transition-colors',
                              isNewRound && 'border-t-2 border-t-titos-border/40'
                            )}>
                              <td className="px-3 py-1.5 text-titos-gray-500 text-xs font-bold">{match.gameOrder}</td>
                              <td className="px-3 py-1.5 text-titos-white font-semibold text-sm">{match.homeTeam?.name}</td>
                              <td className="py-1.5 text-center">
                                <input
                                  ref={el => inputRefs.current[homeKey] = el}
                                  type="number"
                                  min="0"
                                  max="27"
                                  value={s.homeScore}
                                  onChange={(e) => updateMatchScore(match.id, 'homeScore', e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, match.id, 'home')}
                                  onFocus={(e) => e.target.select()}
                                  className="w-14 px-1 py-1.5 bg-titos-surface border border-titos-border rounded text-center text-titos-white font-bold text-base focus:outline-none focus:border-titos-gold focus:ring-1 focus:ring-titos-gold/30"
                                  placeholder="—"
                                />
                              </td>
                              <td className="py-1.5 text-center text-titos-gray-500 text-xs">vs</td>
                              <td className="py-1.5 text-center">
                                <input
                                  ref={el => inputRefs.current[awayKey] = el}
                                  type="number"
                                  min="0"
                                  max="27"
                                  value={s.awayScore}
                                  onChange={(e) => updateMatchScore(match.id, 'awayScore', e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, match.id, 'away')}
                                  onFocus={(e) => e.target.select()}
                                  className="w-14 px-1 py-1.5 bg-titos-surface border border-titos-border rounded text-center text-titos-white font-bold text-base focus:outline-none focus:border-titos-gold focus:ring-1 focus:ring-titos-gold/30"
                                  placeholder="—"
                                />
                              </td>
                              <td className="px-3 py-1.5 text-titos-gray-300 text-sm">{match.awayTeam?.name}</td>
                              <td className="px-3 py-1.5 text-right text-titos-gray-500 text-xs">{match.refTeam?.name || '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
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
