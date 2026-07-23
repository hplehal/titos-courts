'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, Calendar, Check, CheckCircle2 } from 'lucide-react'

// Next-week workflow: create week → generate matches → activate
export default function NextWeekView({ season, weeks, currentWeek, onReload }) {
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
      <div className="card-flat rounded-xl p-6 text-center space-y-4">
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
