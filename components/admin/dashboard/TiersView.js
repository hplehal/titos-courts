'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Check, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Tier movement preview + apply, with click-to-swap between tiers
export default function TiersView({ weekId, weeks, onReloadMatches }) {
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [swap, setSwap] = useState(null)
  const [swapping, setSwapping] = useState(false)
  const [error, setError] = useState('')

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
      {/* Swap prompt — fixed toast so it doesn't push content (no CLS) */}
      {swap && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 max-w-md w-[calc(100%-2rem)] p-3 rounded-xl bg-titos-gold/15 border border-titos-gold/40 backdrop-blur-md shadow-lg flex items-center justify-between gap-3">
          <span className="text-titos-gold text-sm font-bold">Swap {swap.teamName} (T{swap.tierNumber}) → click a team in another tier to swap</span>
          <button onClick={() => setSwap(null)} className="text-titos-gray-400 hover:text-titos-white flex-shrink-0"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Apply movements button — reserve 56px even when 'applied' toast is showing */}
      <div className="flex justify-end mb-4 min-h-[40px]">
        {!applied && (
          <button onClick={applyMovements} disabled={applying || !preview?.tiers} className="btn-primary text-xs py-2 disabled:opacity-50">
            {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Apply Movements
          </button>
        )}
      </div>

      {/* Applied confirmation — fixed toast so it doesn't push content */}
      {applied && (
        <div className="fixed bottom-6 right-6 z-40 max-w-sm p-3 rounded-xl bg-status-success/15 border border-status-success/40 backdrop-blur-md shadow-lg text-status-success text-sm font-bold flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0" />Movements applied. You can still swap teams below.
        </div>
      )}

      <div className="space-y-4">
        {preview?.tiers?.map(tier => (
          <div key={tier.tierNumber} className="card-flat rounded-xl overflow-hidden">
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
                      {t.movement === 'up' ? '▲ UP' : t.movement === 'down' ? '▼ DN' : '— STAY'}
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
