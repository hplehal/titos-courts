'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Shield, Loader2, Save, Check, CheckCircle2, Plus, RefreshCw, AlertTriangle, Calendar, Users, Trophy, FileText, X } from 'lucide-react'
import { cn, getSlotInfo } from '@/lib/utils'

const TABS = ['Scores', 'Results', 'Tiers', 'Next Week']

// ─── Auth Gate ───
function AuthGate({ onAuth }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [checking, setChecking] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setChecking(true)
    setErr('')
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      if (res.ok) { sessionStorage.setItem('admin_auth', 'true'); onAuth() }
      else setErr('Invalid password')
    } catch { setErr('Connection error') }
    setChecking(false)
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <Shield className="w-10 h-10 text-titos-gold mx-auto mb-3" />
          <h1 className="font-display text-2xl font-black text-titos-white">Admin Access</h1>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password" autoFocus
            className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50" />
          {err && <p className="text-status-live text-sm text-center">{err}</p>}
          <button type="submit" className="w-full btn-primary justify-center">Sign In</button>
        </form>
      </div>
    </div>
  )
}

// ─── Score Entry Table (per tier) ───
function TierScoreBlock({ tierNum, tierMatches, inputRefs, onScoreChange, allInputKeys }) {
  const slot = getSlotInfo(parseInt(tierNum), tierMatches[0]?.timeSlot)
  const slotVar = parseInt(tierNum) <= 4 ? 'slot-early' : parseInt(tierNum) <= 8 ? 'slot-late' : 'slot-single'

  const handleKeyDown = (e, matchId, field) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      const cur = `${matchId}-${field}`
      const idx = allInputKeys.indexOf(cur)
      if (idx >= 0 && idx < allInputKeys.length - 1) {
        const next = allInputKeys[idx + 1]
        inputRefs.current[next]?.focus()
        inputRefs.current[next]?.select()
      }
    }
  }

  return (
    <div className="card-flat rounded-2xl overflow-hidden">
      <div className={cn('px-4 py-2.5 flex items-center justify-between', slot.bg)} style={{ borderLeft: `3px solid var(--color-${slotVar})` }}>
        <div className="flex items-center gap-2">
          <span className={cn('font-display text-base font-black', slot.color)}>T{tierNum}</span>
          <span className="text-titos-gray-400 text-xs">Court {tierMatches[0]?.courtNumber}</span>
        </div>
        <span className={cn('text-[10px] font-bold uppercase', slot.color)}>{slot.label}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[9px] font-bold uppercase tracking-wider text-titos-gray-500">
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
              return (
                <tr key={match.id} className={cn('border-t border-titos-border/15 hover:bg-titos-white/[0.02]', idx > 0 && idx % 3 === 0 && 'border-t-2 border-t-titos-border/40')}>
                  <td className="px-3 py-1.5 text-titos-gray-600 text-xs font-bold">{match.gameOrder}</td>
                  <td className="px-3 py-1.5 text-titos-white font-semibold text-sm">{match.homeTeam?.name}</td>
                  <td className="py-1.5 text-center">
                    <input ref={el => { inputRefs.current[homeKey] = el }} type="number" min="0" max="27" value={s.homeScore}
                      onChange={e => onScoreChange(match.id, 'homeScore', e.target.value)}
                      onKeyDown={e => handleKeyDown(e, match.id, 'home')}
                      onFocus={e => e.target.select()}
                      className="w-14 px-1 py-1.5 bg-titos-surface border border-titos-border rounded text-center text-titos-white font-bold text-base focus:outline-none focus:border-titos-gold focus:ring-1 focus:ring-titos-gold/30" placeholder="--" />
                  </td>
                  <td className="py-1.5 text-center text-titos-gray-600 text-xs">vs</td>
                  <td className="py-1.5 text-center">
                    <input ref={el => { inputRefs.current[awayKey] = el }} type="number" min="0" max="27" value={s.awayScore}
                      onChange={e => onScoreChange(match.id, 'awayScore', e.target.value)}
                      onKeyDown={e => handleKeyDown(e, match.id, 'away')}
                      onFocus={e => e.target.select()}
                      className="w-14 px-1 py-1.5 bg-titos-surface border border-titos-border rounded text-center text-titos-white font-bold text-base focus:outline-none focus:border-titos-gold focus:ring-1 focus:ring-titos-gold/30" placeholder="--" />
                  </td>
                  <td className="px-3 py-1.5 text-titos-gray-300 text-sm">{match.awayTeam?.name}</td>
                  <td className="px-3 py-1.5 text-right text-titos-gray-600 text-xs">{match.refTeam?.name || '--'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Results Tab ───
function ResultsView({ matches }) {
  // Group by tier, compute standings
  const byTier = {}
  for (const m of matches) {
    if (!byTier[m.tierNumber]) byTier[m.tierNumber] = []
    byTier[m.tierNumber].push(m)
  }

  return (
    <div className="space-y-4">
      {Object.entries(byTier).sort(([a], [b]) => a - b).map(([tierNum, tierMatches]) => {
        const slot = getSlotInfo(parseInt(tierNum), tierMatches[0]?.timeSlot)
        const slotVar = parseInt(tierNum) <= 4 ? 'slot-early' : parseInt(tierNum) <= 8 ? 'slot-late' : 'slot-single'
        // Build team stats
        const stats = {}
        for (const m of tierMatches) {
          const s = m.scores?.[0]
          if (!s) continue
          for (const side of ['home', 'away']) {
            const team = side === 'home' ? m.homeTeam : m.awayTeam
            const opp = side === 'home' ? 'away' : 'home'
            if (!team) continue
            if (!stats[team.id]) stats[team.id] = { name: team.name, w: 0, l: 0, diff: 0 }
            const myScore = s[`${side}Score`] || 0
            const oppScore = s[`${opp}Score`] || 0
            stats[team.id].diff += myScore - oppScore
            if (myScore > oppScore) stats[team.id].w++
            else if (myScore < oppScore) stats[team.id].l++
          }
        }
        const ranked = Object.values(stats).sort((a, b) => b.w - a.w || b.diff - a.diff)

        return (
          <div key={tierNum} className="card-flat rounded-2xl overflow-hidden">
            <div className={cn('px-4 py-2.5 flex items-center justify-between', slot.bg)} style={{ borderLeft: `3px solid var(--color-${slotVar})` }}>
              <span className={cn('font-display text-base font-black', slot.color)}>T{tierNum}</span>
              <span className={cn('text-[10px] font-bold uppercase', slot.color)}>{slot.label}</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-[9px] font-bold uppercase tracking-wider text-titos-gray-500">
                  <th className="px-4 py-2 text-left w-8">#</th>
                  <th className="px-4 py-2 text-left">Team</th>
                  <th className="px-3 py-2 text-center w-10">W</th>
                  <th className="px-3 py-2 text-center w-10">L</th>
                  <th className="px-3 py-2 text-center w-14">+/-</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((t, i) => (
                  <tr key={t.name} className={cn('border-t border-titos-border/15',
                    i === 0 && 'bg-titos-gold/[0.06]',
                    i === ranked.length - 1 && ranked.length > 1 && 'bg-status-live/[0.04]'
                  )}>
                    <td className={cn('px-4 py-2.5 text-xs font-black', i === 0 ? 'text-titos-gold' : i === ranked.length - 1 ? 'text-status-live' : 'text-titos-gray-400')}>{i + 1}</td>
                    <td className="px-4 py-2.5 text-titos-white font-semibold text-sm">{t.name}</td>
                    <td className="px-3 py-2.5 text-center text-status-success font-bold text-sm">{t.w}</td>
                    <td className="px-3 py-2.5 text-center text-status-live font-bold text-sm">{t.l}</td>
                    <td className={cn('px-3 py-2.5 text-center font-bold text-sm', t.diff > 0 ? 'text-status-success' : t.diff < 0 ? 'text-status-live' : 'text-titos-gray-400')}>
                      {t.diff > 0 ? '+' : ''}{t.diff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
      {matches.length === 0 && <p className="text-titos-gray-400 text-center py-8">No scored matches for this week.</p>}
    </div>
  )
}

// ─── Tiers Tab ───
function TiersView({ weekId, weeks, onReloadMatches }) {
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [swap, setSwap] = useState(null)
  const [swapping, setSwapping] = useState(false)
  const [error, setError] = useState('')

  // Determine next week id for swap calls
  const currentWeek = weeks.find(w => w.id === weekId)
  const nextWeek = currentWeek ? weeks.find(w => w.weekNumber === currentWeek.weekNumber + 1) : null

  const loadPreview = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/tier-movement', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId, action: 'preview' }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else setPreview(data)
    } catch { setError('Failed to load preview') }
    setLoading(false)
  }, [weekId])

  useEffect(() => { if (weekId) loadPreview() }, [weekId, loadPreview])

  const applyMovements = async () => {
    setApplying(true)
    try {
      const res = await fetch('/api/admin/tier-movement', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId, action: 'apply' }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else { setApplied(true); loadPreview() }
    } catch { setError('Failed to apply movements') }
    setApplying(false)
  }

  const handleTeamClick = async (teamId, teamName, tierNumber) => {
    if (!swap) {
      setSwap({ teamId, teamName, tierNumber })
      return
    }
    if (swap.teamId === teamId) { setSwap(null); return }
    if (swap.tierNumber === tierNumber) { setSwap({ teamId, teamName, tierNumber }); return }
    // Perform swap on the CURRENT week — swap placements, delete matches, regenerate
    setSwapping(true)
    try {
      // 1. Swap the tier placements
      await fetch('/api/admin/tier-placements', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId, teamAId: swap.teamId, teamBId: teamId }),
      })
      // 2. Delete existing matches (and their scores)
      await fetch('/api/admin/weeks', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId, matchesOnly: true }),
      })
      // 3. Regenerate matches with the new tier compositions
      await fetch('/api/admin/weeks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-matches', weekId }),
      })
      setSwap(null)
      loadPreview()
      if (onReloadMatches) onReloadMatches()
    } catch { setError('Swap failed') }
    setSwapping(false)
  }

  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') setSwap(null) }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [])

  if (loading) return <div className="text-center py-12"><Loader2 className="w-6 h-6 text-titos-gold mx-auto animate-spin" /></div>
  if (error) return (
    <div className="card rounded-xl p-6 border-status-live/30 bg-status-live/5">
      <div className="flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-status-live" /><p className="text-status-live font-medium">{error}</p></div>
    </div>
  )

  return (
    <div>
      {swap && (
        <div className="mb-4 p-3 rounded-xl bg-titos-gold/10 border border-titos-gold/30 flex items-center justify-between">
          <span className="text-titos-gold text-sm font-bold">Swap {swap.teamName} (T{swap.tierNumber}) → click a team in another tier to swap</span>
          <button onClick={() => setSwap(null)} className="text-titos-gray-400 hover:text-titos-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {!applied && (
        <div className="flex justify-end mb-4">
          <button onClick={applyMovements} disabled={applying || !preview?.tiers} className="btn-primary text-xs py-2 disabled:opacity-50">
            {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Apply Movements
          </button>
        </div>
      )}
      {applied && <div className="mb-4 p-3 rounded-xl bg-status-success/10 border border-status-success/30 text-status-success text-sm font-bold flex items-center gap-2"><Check className="w-4 h-4" />Movements applied. You can still swap teams below.</div>}

      <div className="space-y-4">
        {preview?.tiers?.map(tier => (
          <div key={tier.tierNumber} className="card-flat rounded-2xl overflow-hidden">
            <div className="px-5 py-3 bg-titos-elevated border-b border-titos-border/30">
              <span className="font-display text-base font-black text-titos-white">Tier {tier.tierNumber}</span>
            </div>
            <div className="p-3 space-y-2">
              {tier.teams.map((t, i) => {
                const isSelected = swap?.teamId === t.id
                return (
                  <button key={t.id} onClick={() => handleTeamClick(t.id, t.name, tier.tierNumber)} disabled={swapping}
                    className={cn('w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left',
                      isSelected ? 'bg-titos-gold/20 border-2 border-titos-gold ring-2 ring-titos-gold/20' :
                      swap && swap.tierNumber !== tier.tierNumber ? 'bg-titos-elevated border border-titos-gold/30 hover:border-titos-gold/60 cursor-pointer' :
                      i === 0 ? 'bg-titos-gold/[0.07] border border-titos-gold/20' :
                      i === 2 ? 'bg-status-live/[0.05] border border-status-live/15' :
                      'bg-titos-elevated border border-titos-border/50'
                    )}>
                    <div className="flex items-center gap-3">
                      <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-black',
                        i === 0 ? 'bg-titos-gold/20 text-titos-gold' : i === 2 ? 'bg-status-live/15 text-status-live' : 'bg-titos-charcoal text-titos-gray-400'
                      )}>{i + 1}</span>
                      <span className="text-titos-white font-bold">{t.name}</span>
                      <span className="text-titos-gray-500 text-xs">{t.setsWon}SW, {t.pointDiff > 0 ? '+' : ''}{t.pointDiff}</span>
                    </div>
                    <span className={cn('text-sm font-black px-3 py-1 rounded',
                      t.movement === 'up' ? 'text-status-success bg-status-success/10' :
                      t.movement === 'down' ? 'text-status-live bg-status-live/10' : 'text-titos-gray-500'
                    )}>
                      {t.movement === 'up' ? '\u25B2 UP' : t.movement === 'down' ? '\u25BC DN' : '\u2014 STAY'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Next Week Tab ───
function NextWeekView({ season, weeks, currentWeek, onReload }) {
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')

  const nextWeekNum = currentWeek ? currentWeek.weekNumber + 1 : 1
  const nextWeek = weeks.find(w => w.weekNumber === nextWeekNum)
  const hasMatches = nextWeek ? (nextWeek._count?.matches || 0) > 0 : false
  const hasPlacements = nextWeek ? (nextWeek._count?.tierPlacements || 0) > 0 : false

  const addWeek = async () => {
    setBusy('adding'); setMsg('')
    const res = await fetch('/api/admin/weeks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add-week', seasonId: season.id }) })
    const data = await res.json()
    setMsg(data.success ? `Week ${data.week?.weekNumber} created` : (data.error || 'Error'))
    setBusy(''); onReload()
  }

  const generateMatches = async () => {
    if (!nextWeek) return
    setBusy('generating'); setMsg('')
    const res = await fetch('/api/admin/weeks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'generate-matches', weekId: nextWeek.id }) })
    const data = await res.json()
    setMsg(data.success ? `${data.matchCount} matches generated` : (data.error || 'Error'))
    setBusy(''); onReload()
  }

  const activateWeek = async () => {
    if (!nextWeek) return
    setBusy('activating'); setMsg('')
    await fetch('/api/admin/weeks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weekId: nextWeek.id, status: 'active' }) })
    setMsg(`Week ${nextWeek.weekNumber} activated`)
    setBusy(''); onReload()
  }

  return (
    <div className="space-y-4">
      <div className="card-flat rounded-2xl p-6 text-center space-y-4">
        <h3 className="font-display text-lg font-black text-titos-white">Week {nextWeekNum}</h3>

        {!nextWeek && (
          <button onClick={addWeek} disabled={!!busy} className="btn-primary mx-auto">
            {busy === 'adding' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Week {nextWeekNum}
          </button>
        )}

        {nextWeek && !hasMatches && hasPlacements && (
          <button onClick={generateMatches} disabled={!!busy} className="btn-primary mx-auto">
            {busy === 'generating' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            Generate Matches
          </button>
        )}

        {nextWeek && !hasMatches && !hasPlacements && (
          <p className="text-titos-gray-400 text-sm">Week exists but has no tier placements yet. Apply tier movements first.</p>
        )}

        {nextWeek && hasMatches && nextWeek.status !== 'active' && (
          <button onClick={activateWeek} disabled={!!busy} className="btn-primary mx-auto">
            {busy === 'activating' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Activate Week {nextWeekNum}
          </button>
        )}

        {nextWeek && nextWeek.status === 'active' && (
          <div className="flex items-center justify-center gap-2 text-status-success font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" /> Week {nextWeekNum} is live
          </div>
        )}

        {msg && <p className="text-titos-gold text-sm font-semibold">{msg}</p>}
      </div>

      {/* Summary: next week tier compositions via placements */}
      {nextWeek && hasPlacements && <PlacementSummary weekId={nextWeek.id} />}
    </div>
  )
}

function PlacementSummary({ weekId }) {
  const [placements, setPlacements] = useState([])
  useEffect(() => {
    fetch(`/api/admin/tier-placements?weekId=${weekId}`).then(r => r.json()).then(d => setPlacements(d.placements || []))
  }, [weekId])

  if (!placements.length) return null

  const byTier = {}
  for (const p of placements) {
    if (!byTier[p.tierNumber]) byTier[p.tierNumber] = []
    byTier[p.tierNumber].push(p)
  }

  return (
    <div className="space-y-3">
      <h4 className="text-titos-gray-400 text-xs font-bold uppercase tracking-wider">Next Week Tier Compositions</h4>
      {Object.entries(byTier).sort(([a], [b]) => a - b).map(([tier, teams]) => (
        <div key={tier} className="card-flat rounded-xl p-3">
          <span className="font-display text-sm font-black text-titos-white">T{tier}</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {teams.sort((a, b) => a.position - b.position).map(t => (
              <span key={t.id} className="px-2 py-1 rounded bg-titos-elevated text-titos-gray-300 text-xs font-medium">{t.team?.name || `Team ${t.teamId}`}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Dashboard ───
export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  // Data
  const [leagues, setLeagues] = useState([])
  const [activeLeague, setActiveLeague] = useState(null)
  const [season, setSeason] = useState(null)
  const [weeks, setWeeks] = useState([])
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [matches, setMatches] = useState([])
  const [activeTab, setActiveTab] = useState('Scores')
  // UI
  const [loading, setLoading] = useState(true)
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const inputRefs = useRef({})

  // Auth check
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('admin_auth') === 'true') setAuthed(true)
  }, [])

  // Load leagues
  useEffect(() => {
    if (!authed) return
    fetch('/api/leagues').then(r => r.json()).then(data => {
      const active = (data || []).filter(l => l.isActive)
      setLeagues(active)
      if (active.length > 0) setActiveLeague(active[0])
    })
  }, [authed])

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
    let count = 0
    for (const match of matches) {
      const s = match.scores?.[0]
      if (s && (s.homeScore > 0 || s.awayScore > 0)) {
        await fetch('/api/admin/scores', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchId: match.id, scores: [{ setNumber: 1, homeScore: s.homeScore, awayScore: s.awayScore }], status: 'completed' }),
        })
        count++
      }
    }
    setSaving(false)
    setSaveMsg(`${count} matches saved`)
    return count
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
  const allInputKeys = []
  const matchesByTier = {}
  for (const m of matches) {
    if (!matchesByTier[m.tierNumber]) matchesByTier[m.tierNumber] = []
    matchesByTier[m.tierNumber].push(m)
  }
  for (const [, tierMatches] of Object.entries(matchesByTier).sort(([a], [b]) => a - b)) {
    for (const m of tierMatches) { allInputKeys.push(`${m.id}-home`, `${m.id}-away`) }
  }

  if (!authed) return <AuthGate onAuth={() => setAuthed(true)} />

  return (
    <div className="py-6 px-4">
      <div className="max-w-5xl mx-auto">
        {/* ─── Top Bar ─── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-titos-gold" />
            <h1 className="font-display text-xl font-black text-titos-white">Admin</h1>
          </div>
          <button onClick={() => loadLeagueData(activeLeague)} className="text-titos-gray-400 hover:text-titos-white transition-colors"><RefreshCw className="w-4 h-4" /></button>
        </div>

        {/* League Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {leagues.map(l => (
            <button key={l.slug} onClick={() => setActiveLeague(l)}
              className={cn('px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all',
                activeLeague?.slug === l.slug ? 'bg-titos-gold text-titos-surface' : 'bg-titos-elevated text-titos-gray-400 hover:text-titos-white border border-titos-border/50'
              )}>{l.name}</button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 text-titos-gold mx-auto animate-spin" /></div>
        ) : !season ? (
          <div className="card rounded-xl p-8 text-center"><p className="text-titos-gray-400">No season found for this league.</p></div>
        ) : (
          <>
            {/* ─── Week Pills ─── */}
            <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
              {weeks.map(w => {
                const isSel = selectedWeek?.id === w.id
                return (
                  <button key={w.id} onClick={() => setSelectedWeek(w)}
                    className={cn('w-9 h-9 rounded-full text-xs font-black flex items-center justify-center transition-all flex-shrink-0',
                      isSel ? 'ring-2 ring-titos-gold ring-offset-2 ring-offset-titos-surface' : '',
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
              <p className="text-titos-gray-400 text-xs mb-4">
                Week {selectedWeek.weekNumber} &middot; <span className={cn(
                  selectedWeek.status === 'completed' ? 'text-status-success' :
                  selectedWeek.status === 'active' ? 'text-titos-gold' : 'text-titos-gray-500'
                )}>{selectedWeek.status}</span> &middot; {selectedWeek._count?.matches || 0} matches
              </p>
            )}

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
              <div className="text-center py-12"><Loader2 className="w-6 h-6 text-titos-gold mx-auto animate-spin" /></div>
            ) : (
              <>
                {/* SCORES TAB */}
                {activeTab === 'Scores' && (
                  <div>
                    {matches.length > 0 && (
                      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-xl bg-titos-elevated border border-titos-border/30">
                        <span className="text-titos-gray-400 text-xs flex-1">{matches.length} matches -- Tab/Enter between fields</span>
                        <button onClick={saveAndComplete} className="px-3 py-2 rounded-lg text-xs font-bold bg-status-success/15 text-status-success border border-status-success/30 hover:bg-status-success/25 transition-colors flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Save & Complete
                        </button>
                        <button onClick={saveAllScores} disabled={saving} className="btn-primary text-xs py-2">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          {saving ? 'Saving...' : 'Save All'}
                        </button>
                      </div>
                    )}
                    {saveMsg && (
                      <div className="mb-4 p-3 rounded-xl bg-status-success/5 border border-status-success/20 text-status-success font-semibold text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />{saveMsg}
                      </div>
                    )}
                    <div className="space-y-4">
                      {Object.entries(matchesByTier).sort(([a], [b]) => a - b).map(([tierNum, tierMatches]) => (
                        <TierScoreBlock key={tierNum} tierNum={tierNum} tierMatches={tierMatches} inputRefs={inputRefs}
                          onScoreChange={updateMatchScore} allInputKeys={allInputKeys} />
                      ))}
                    </div>
                    {matches.length === 0 && <p className="text-titos-gray-400 text-center py-8">No matches for this week.</p>}
                  </div>
                )}

                {/* RESULTS TAB */}
                {activeTab === 'Results' && <ResultsView matches={matches} />}

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

        {/* ─── Quick Links ─── */}
        <div className="mt-10 pt-6 border-t border-titos-border/20 flex flex-wrap justify-center gap-4 text-xs">
          {[
            { label: 'Seasons', href: '/admin/seasons', icon: Calendar },
            { label: 'Registrations', href: '/admin/registrations', icon: Users },
            { label: 'Waivers', href: '/admin/waivers', icon: FileText },
            { label: 'Tournaments', href: '/admin/tournaments', icon: Trophy },
          ].map(l => (
            <Link key={l.label} href={l.href} className="flex items-center gap-1.5 text-titos-gray-500 hover:text-titos-gold transition-colors">
              <l.icon className="w-3.5 h-3.5" />{l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
