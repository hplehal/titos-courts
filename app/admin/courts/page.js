'use client'

// Admin: manage each season's tiers — add a tier, remove the bottom tier, and
// edit which court / time slot each tier plays on.
// Updating a tier's court number also rewrites the courtNumber on all
// matches scheduled for upcoming weeks so the public schedule reflects
// the change immediately. Completed weeks stay historical.

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, Check, Trash2, Shield, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const TEAMS_PER_TIER = 3

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
      <div className="card rounded-xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <Shield className="w-10 h-10 text-titos-gold mx-auto mb-3" />
          <h1 className="font-display text-2xl font-black text-titos-white">Admin Access</h1>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password" autoFocus
            className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50" />
          {err && <p className="text-status-live text-sm text-center">{err}</p>}
          <button type="submit" disabled={checking} className="w-full btn-primary justify-center">
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

function TierRow({ tier, isBottom, onSaved }) {
  const [court, setCourt] = useState(String(tier.courtNumber))
  const [slot, setSlot] = useState(tier.timeSlot || 'early')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const courtDirty = String(tier.courtNumber) !== court.trim() && court.trim() !== ''
  const slotDirty = tier.timeSlot !== slot
  const dirty = courtDirty || slotDirty

  const save = async () => {
    const ct = parseInt(court, 10)
    if (!Number.isFinite(ct)) { setErr('Enter a number'); return }
    setSaving(true); setErr(''); setMsg('')
    try {
      const messages = []
      if (courtDirty) {
        const res = await fetch('/api/admin/seasons', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update-tier-court', tierId: tier.id, courtNumber: ct }),
        })
        const data = await res.json()
        if (!res.ok) { setErr(data.error || 'Failed'); setSaving(false); return }
        messages.push(`court → ${ct} (${data.matchesUpdated} match${data.matchesUpdated === 1 ? '' : 'es'} updated)`)
      }
      if (slotDirty) {
        const res = await fetch('/api/admin/seasons', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update-tier-slot', tierId: tier.id, timeSlot: slot }),
        })
        const data = await res.json()
        if (!res.ok) { setErr(data.error || 'Failed'); setSaving(false); return }
        messages.push(`slot → ${slot}`)
      }
      setMsg(`Saved: ${messages.join(', ')}`)
      onSaved?.()
    } catch { setErr('Network error') }
    setSaving(false)
  }

  const remove = async () => {
    if (!confirm(`Remove Tier ${tier.tierNumber}? Only works if no week has placements or matches in it.`)) return
    setDeleting(true); setErr(''); setMsg('')
    try {
      const res = await fetch('/api/admin/seasons', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-tier', tierId: tier.id }),
      })
      const data = await res.json()
      if (!res.ok) setErr(data.error || 'Failed')
      else { setMsg('Tier deleted'); onSaved?.() }
    } catch { setErr('Network error') }
    setDeleting(false)
  }

  return (
    <div className="card-flat rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
      <div className="min-w-[5rem]">
        <span className="font-display text-base font-black text-titos-white">Tier {tier.tierNumber}</span>
      </div>
      <label className="flex items-center gap-2 text-sm text-titos-gray-300">
        Court
        <input
          type="number"
          min="1"
          max="20"
          value={court}
          onChange={(e) => setCourt(e.target.value)}
          className="w-20 px-2 py-1.5 bg-titos-surface border border-titos-border rounded text-center text-titos-white font-bold focus:outline-none focus:border-titos-gold focus:ring-1 focus:ring-titos-gold/30"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-titos-gray-300">
        Slot
        <select
          value={slot}
          onChange={(e) => setSlot(e.target.value)}
          className="px-2 py-1.5 bg-titos-surface border border-titos-border rounded text-titos-white font-semibold focus:outline-none focus:border-titos-gold focus:ring-1 focus:ring-titos-gold/30"
        >
          <option value="early">early</option>
          <option value="late">late</option>
          <option value="single">single</option>
        </select>
      </label>
      <button
        onClick={save}
        disabled={!dirty || saving}
        className={cn('btn-primary text-xs py-2', (!dirty || saving) && 'opacity-50 cursor-not-allowed')}
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Save
      </button>
      {/* Only the bottom tier can be removed — tiers must stay numbered 1..N
          for weekly placement and up/down movement. */}
      {isBottom && (
        <button
          onClick={remove}
          disabled={deleting}
          className="text-titos-gray-500 hover:text-status-live transition-colors px-2 py-1.5 text-xs flex items-center gap-1"
          title="Remove the bottom tier (must have no placements or matches)"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Delete
        </button>
      )}
      <div className="flex-1 min-w-[10rem] text-right">
        {msg && <span className="text-status-success text-xs flex items-center justify-end gap-1"><Check className="w-3 h-3" />{msg}</span>}
        {err && <span className="text-status-live text-xs">{err}</span>}
      </div>
    </div>
  )
}

export default function CourtsAdminPage() {
  const [authed, setAuthed] = useState(false)
  const [seasons, setSeasons] = useState([])
  const [selectedSeasonId, setSelectedSeasonId] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [pageMsg, setPageMsg] = useState({ kind: '', text: '' })

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('admin_auth') === 'true') setAuthed(true)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/seasons').then(r => r.json())
      const list = (res.seasons || []).filter(s => s.status !== 'archived')
      setSeasons(list)
      if (list.length && !selectedSeasonId) {
        // ?season=<id> (linked from Seasons → Tiers & Divisions) preselects it.
        const requested = new URLSearchParams(window.location.search).get('season')
        setSelectedSeasonId(list.some(s => s.id === requested) ? requested : list[0].id)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [selectedSeasonId])

  useEffect(() => { if (authed) load() }, [authed, load])

  if (!authed) return <AuthGate onAuth={() => setAuthed(true)} />

  const selected = seasons.find(s => s.id === selectedSeasonId)
  const tiers = (selected?.tiers || []).slice().sort((a, b) => a.tierNumber - b.tierNumber)
  const nextTierNumber = (tiers[tiers.length - 1]?.tierNumber || 0) + 1
  const teamCount = selected?.teams?.length || 0
  const spots = tiers.length * TEAMS_PER_TIER

  const addTier = async () => {
    setAdding(true)
    setPageMsg({ kind: '', text: '' })
    try {
      const res = await fetch('/api/admin/seasons', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-tier', seasonId: selectedSeasonId }),
      })
      const data = await res.json()
      if (!res.ok) setPageMsg({ kind: 'err', text: data.error || 'Failed to add tier' })
      else {
        const { tierNumber, courtNumber, timeSlot } = data.tier
        setPageMsg({ kind: 'ok', text: `Tier ${tierNumber} added on Court ${courtNumber} (${timeSlot}) — change it above if needed.` })
        await load()
      }
    } catch { setPageMsg({ kind: 'err', text: 'Network error' }) }
    setAdding(false)
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-titos-gray-400 hover:text-titos-gold transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-2xl font-black text-titos-white">Court Assignments</h1>
        </div>

        <p className="text-titos-gray-400 text-sm mb-6">
          Add or remove tiers and edit which court each tier plays on. Saving a court rewrites the court number on every match scheduled for an upcoming week; completed weeks are not touched. Only the bottom tier can be removed, and only while no week uses it.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-titos-gray-300 mb-2">Season</label>
          <select
            value={selectedSeasonId}
            onChange={(e) => { setSelectedSeasonId(e.target.value); setPageMsg({ kind: '', text: '' }) }}
            className="w-full px-4 py-3 bg-titos-card border border-titos-border rounded-lg text-titos-white focus:outline-none focus:border-titos-gold/50"
          >
            {seasons.map(s => (
              <option key={s.id} value={s.id}>
                {s.league?.name} — {s.name} ({s.status})
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card-flat rounded-xl h-16 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {tiers.length === 0 ? (
              <p className="text-titos-gray-500 text-sm">No tiers in this season.</p>
            ) : (
              <div className="space-y-3">
                {tiers.map((t, i) => (
                  <TierRow key={t.id} tier={t} isBottom={i === tiers.length - 1} onSaved={load} />
                ))}
              </div>
            )}
            {selected && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={addTier}
                  disabled={adding}
                  className={cn('btn-primary text-xs py-2', adding && 'opacity-50 cursor-not-allowed')}
                >
                  {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Add Tier {nextTierNumber}
                </button>
                <span className={cn('text-xs', spots === teamCount ? 'text-status-success' : 'text-titos-gold')}>
                  {tiers.length} tier{tiers.length === 1 ? '' : 's'} · {spots} spots ({TEAMS_PER_TIER} per tier) · {teamCount} teams
                </span>
                {pageMsg.text && (
                  <span className={cn('text-xs', pageMsg.kind === 'ok' ? 'text-status-success' : 'text-status-live')}>{pageMsg.text}</span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
