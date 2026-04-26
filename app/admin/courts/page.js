'use client'

// Admin: edit tier → court mappings per league/season.
// Updating a tier's court number also rewrites the courtNumber on all
// matches scheduled for upcoming weeks so the public schedule reflects
// the change immediately. Completed weeks stay historical.

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, Check, Trash2, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

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

function TierRow({ tier, onSaved }) {
  const [court, setCourt] = useState(String(tier.courtNumber))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const dirty = String(tier.courtNumber) !== court.trim() && court.trim() !== ''

  const save = async () => {
    const ct = parseInt(court, 10)
    if (!Number.isFinite(ct)) { setErr('Enter a number'); return }
    setSaving(true); setErr(''); setMsg('')
    try {
      const res = await fetch('/api/admin/seasons', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-tier-court', tierId: tier.id, courtNumber: ct }),
      })
      const data = await res.json()
      if (!res.ok) setErr(data.error || 'Failed')
      else {
        setMsg(`Saved (${data.matchesUpdated} upcoming match${data.matchesUpdated === 1 ? '' : 'es'} updated)`)
        onSaved?.()
      }
    } catch { setErr('Network error') }
    setSaving(false)
  }

  const remove = async () => {
    if (!confirm(`Delete Tier ${tier.tierNumber}? Only works if it has no placements or matches.`)) return
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
      <div className="min-w-[6rem]">
        <span className="font-display text-base font-black text-titos-white">Tier {tier.tierNumber}</span>
        <span className="block text-[11px] text-titos-gray-500 uppercase tracking-wider">{tier.timeSlot}</span>
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
      <button
        onClick={save}
        disabled={!dirty || saving}
        className={cn('btn-primary text-xs py-2', (!dirty || saving) && 'opacity-50 cursor-not-allowed')}
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Save
      </button>
      <button
        onClick={remove}
        disabled={deleting}
        className="text-titos-gray-500 hover:text-status-live transition-colors px-2 py-1.5 text-xs flex items-center gap-1"
        title="Delete tier (must have no placements or matches)"
      >
        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        Delete
      </button>
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

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('admin_auth') === 'true') setAuthed(true)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/seasons').then(r => r.json())
      const list = (res.seasons || []).filter(s => s.status !== 'archived')
      setSeasons(list)
      if (list.length && !selectedSeasonId) setSelectedSeasonId(list[0].id)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [selectedSeasonId])

  useEffect(() => { if (authed) load() }, [authed, load])

  if (!authed) return <AuthGate onAuth={() => setAuthed(true)} />

  const selected = seasons.find(s => s.id === selectedSeasonId)
  const tiers = (selected?.tiers || []).slice().sort((a, b) => a.tierNumber - b.tierNumber)

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
          Edit which court each tier plays on. Saving updates the tier and rewrites the court number on every match scheduled for an upcoming week. Completed weeks are not touched.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-titos-gray-300 mb-2">Season</label>
          <select
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
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
        ) : tiers.length === 0 ? (
          <p className="text-titos-gray-500 text-sm">No tiers in this season.</p>
        ) : (
          <div className="space-y-3">
            {tiers.map(t => (
              <TierRow key={t.id} tier={t} onSaved={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
