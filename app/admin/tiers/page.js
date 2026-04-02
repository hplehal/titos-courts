'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUpDown, Check, Loader2, AlertTriangle } from 'lucide-react'
import { cn, getTierColor, getMovementIcon } from '@/lib/utils'

export default function TierMovementPage() {
  const [leagues, setLeagues] = useState([])
  const [selectedLeague, setSelectedLeague] = useState('')
  const [weeks, setWeeks] = useState([])
  const [selectedWeek, setSelectedWeek] = useState('')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    fetch('/api/leagues').then(r => r.json()).then(data => {
      const active = data.filter(l => l.isActive)
      setLeagues(active)
      if (active.length > 0) setSelectedLeague(active[0].slug)
    })
  }, [])

  useEffect(() => {
    if (!selectedLeague) return
    fetch(`/api/leagues/${selectedLeague}/schedule`).then(r => r.json()).then(data => {
      setWeeks(data.weeks || [])
      const completed = (data.weeks || []).filter(w => w.status === 'completed')
      setSelectedWeek(completed[completed.length - 1]?.id || '')
    })
  }, [selectedLeague])

  const calculateMovement = async () => {
    if (!selectedWeek) return
    setLoading(true)
    setPreview(null)
    try {
      const res = await fetch('/api/admin/tier-movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId: selectedWeek, action: 'preview' }),
      })
      const data = await res.json()
      setPreview(data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const applyMovement = async () => {
    if (!selectedWeek) return
    setApplying(true)
    try {
      await fetch('/api/admin/tier-movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId: selectedWeek, action: 'apply' }),
      })
      setApplied(true)
    } catch (err) {
      console.error(err)
    }
    setApplying(false)
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-titos-gray-400 hover:text-titos-gold transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-2xl font-black text-titos-white">Tier Movement</h1>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-titos-gray-300 mb-2">League</label>
            <select value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)}
              className="w-full px-4 py-3 bg-titos-card border border-titos-border rounded-lg text-titos-white focus:outline-none focus:border-titos-gold/50">
              {leagues.map(l => <option key={l.slug} value={l.slug}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-titos-gray-300 mb-2">Completed Week</label>
            <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-full px-4 py-3 bg-titos-card border border-titos-border rounded-lg text-titos-white focus:outline-none focus:border-titos-gold/50">
              <option value="">Select week...</option>
              {weeks.filter(w => w.status === 'completed').map(w => (
                <option key={w.id} value={w.id}>Week {w.weekNumber}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={calculateMovement}
          disabled={!selectedWeek || loading}
          className="btn-primary mb-8 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpDown className="w-4 h-4" />}
          Calculate Movements
        </button>

        {/* Preview */}
        {preview?.tiers && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-bold text-titos-white">Movement Preview</h2>
              {!applied ? (
                <button onClick={applyMovement} disabled={applying} className="btn-primary">
                  {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Apply Movements
                </button>
              ) : (
                <span className="text-status-success font-bold text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" /> Movements Applied
                </span>
              )}
            </div>

            <div className="space-y-4">
              {preview.tiers.map(tier => {
                const tc = getTierColor(tier.tierNumber)
                return (
                  <div key={tier.tierNumber} className="card-flat rounded-2xl overflow-hidden">
                    <div className={`px-5 py-3 ${tc.bg}`} style={{ borderLeft: `3px solid var(--color-${tc.accent})` }}>
                      <span className={`font-display text-lg font-black ${tc.text}`}>Tier {tier.tierNumber}</span>
                    </div>
                    <div className="p-4 space-y-2">
                      {tier.teams.map((t, idx) => (
                        <div key={t.id} className={cn(
                          'flex items-center justify-between px-4 py-3 rounded-xl',
                          idx === 0 ? 'bg-titos-gold/[0.07] border border-titos-gold/20' :
                          idx === 2 ? 'bg-status-live/[0.05] border border-status-live/15' :
                          'bg-titos-elevated border border-titos-border/50'
                        )}>
                          <div className="flex items-center gap-3">
                            <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-black',
                              idx === 0 ? 'bg-titos-gold/20 text-titos-gold' :
                              idx === 2 ? 'bg-status-live/15 text-status-live' :
                              'bg-titos-charcoal text-titos-gray-400'
                            )}>{idx + 1}</span>
                            <span className="text-titos-white font-bold">{t.name}</span>
                            <span className="text-titos-gray-500 text-xs">{t.setsWon}SW, {t.pointDiff > 0 ? '+' : ''}{t.pointDiff} diff</span>
                          </div>
                          <span className={cn('text-sm font-black px-3 py-1 rounded',
                            t.movement === 'up' ? 'text-status-success bg-status-success/10' :
                            t.movement === 'down' ? 'text-status-live bg-status-live/10' :
                            'text-titos-gray-500'
                          )}>
                            {t.movement === 'up' ? '↑ UP' : t.movement === 'down' ? '↓ DOWN' : '— STAY'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {preview?.error && (
          <div className="card rounded-xl p-6 border-status-live/30 bg-status-live/5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-status-live" />
              <p className="text-status-live font-medium">{preview.error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
