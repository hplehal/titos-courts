'use client'

// Admin "Playoff Brackets" page. Lists active seasons, builds the playoff
// draft from end-of-season standings + each season's division sizes, and
// opens the schedule editor so every match's week, time, court, teams and
// winner wiring can be adjusted by hand. Wipes via DELETE when admin wants to
// start over.

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Trophy, Check, AlertCircle, Trash2, Shield, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'
import PlayoffScheduleEditor from '@/components/admin/PlayoffScheduleEditor'

function AuthGate({ onAuth }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [checking, setChecking] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setChecking(true); setErr('')
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
          <Shield className="w-10 h-10 text-titos-gold mx-auto mb-3" aria-hidden="true" />
          <h1 className="font-display text-2xl font-black text-titos-white">Admin Access</h1>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label htmlFor="pw" className="sr-only">Password</label>
          <input
            id="pw" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password" autoFocus
            className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50"
          />
          {err && <p className="text-status-live text-sm text-center" role="alert">{err}</p>}
          <button type="submit" disabled={checking} className="w-full btn-primary justify-center cursor-pointer">
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function PlayoffAdminPage() {
  const [authed, setAuthed] = useState(false)
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [msg, setMsg] = useState({ kind: '', text: '' })
  const [editingId, setEditingId] = useState(null)
  // Bumped after Build/Wipe so an open editor reloads its matches.
  const [editorVersion, setEditorVersion] = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('admin_auth') === 'true') setAuthed(true)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/seasons').then(r => r.json())
      const list = (res.seasons || []).filter(s => s.status !== 'archived')
      setSeasons(list)
    } catch { setMsg({ kind: 'err', text: 'Failed to load seasons' }) }
    setLoading(false)
  }, [])
  useEffect(() => { if (authed) load() }, [authed, load])

  const generate = async (seasonId, leagueName, seasonName) => {
    if (!confirm(`Build the playoff bracket for ${leagueName} — ${seasonName}?\n\nUses the end-of-season standings and this season's division sizes. You can edit every match afterwards.`)) return
    setBusyId(seasonId); setMsg({ kind: '', text: '' })
    try {
      const res = await fetch(`/api/admin/seasons/${seasonId}/playoffs`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) setMsg({ kind: 'err', text: data.error || 'Failed' })
      else {
        const { qfs, sfs, finals } = data.counts || {}
        setMsg({ kind: 'ok', text: `Created ${qfs} QFs + ${sfs} SFs + ${finals} Finals. Open Edit Schedule to adjust times and courts.` })
        setEditingId(seasonId)
        setEditorVersion(v => v + 1)
      }
    } catch { setMsg({ kind: 'err', text: 'Network error' }) }
    setBusyId(null)
  }

  const wipe = async (seasonId, leagueName, seasonName) => {
    if (!confirm(`Wipe ALL playoff matches for ${leagueName} — ${seasonName}? This cannot be undone.`)) return
    setBusyId(seasonId); setMsg({ kind: '', text: '' })
    try {
      const res = await fetch(`/api/admin/seasons/${seasonId}/playoffs`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) setMsg({ kind: 'err', text: data.error || 'Failed' })
      else { setMsg({ kind: 'ok', text: `Deleted ${data.deleted} playoff matches.` }); setEditorVersion(v => v + 1) }
    } catch { setMsg({ kind: 'err', text: 'Network error' }) }
    setBusyId(null)
  }

  if (!authed) return <AuthGate onAuth={() => setAuthed(true)} />

  return (
    <div className="py-10 sm:py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin" className="text-titos-gray-400 hover:text-titos-gold transition-colors cursor-pointer" aria-label="Back to admin home">
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-titos-white">Playoff Brackets</h1>
        </div>
        <p className="text-titos-gray-400 text-sm mb-8 ml-8">
          Build a single-elimination bracket per division from the final standings, sized by the season&apos;s division settings. Then edit any match&apos;s week, time, court, teams, or where the winner goes.
        </p>

        {msg.text && (
          <div className={cn(
            'mb-6 p-4 rounded-lg border flex items-start gap-3',
            msg.kind === 'ok' ? 'bg-status-success/10 border-status-success/30 text-status-success' : 'bg-status-live/10 border-status-live/30 text-status-live',
          )} role="alert">
            {msg.kind === 'ok' ? <Check className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            <p className="text-sm">{msg.text}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="card-flat rounded-xl h-24 animate-pulse" />)}
          </div>
        ) : seasons.length === 0 ? (
          <p className="text-titos-gray-500 text-sm">No active seasons.</p>
        ) : (
          <div className="space-y-3">
            {seasons.map(s => (
              <div key={s.id} className="card-flat rounded-xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-base font-black text-titos-white">
                      {s.league?.name}
                      <span className="text-titos-gray-400 font-medium ml-2">— {s.name}</span>
                    </div>
                    <div className="text-xs text-titos-gray-500 mt-0.5">Status: {s.status}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => generate(s.id, s.league?.name, s.name)}
                      disabled={busyId === s.id}
                      className={cn('btn-primary text-xs py-2 px-3 cursor-pointer', busyId === s.id && 'opacity-50 cursor-not-allowed')}
                    >
                      {busyId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trophy className="w-3.5 h-3.5" />}
                      Build Bracket
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(editingId === s.id ? null : s.id)}
                      aria-expanded={editingId === s.id}
                      className={cn(
                        'px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer',
                        editingId === s.id ? 'bg-titos-gold/15 text-titos-gold border-titos-gold/30' : 'bg-titos-card text-titos-gray-300 border-titos-border hover:text-titos-white',
                      )}
                    >
                      <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />
                      Edit Schedule
                    </button>
                    <button
                      type="button"
                      onClick={() => wipe(s.id, s.league?.name, s.name)}
                      disabled={busyId === s.id}
                      className="text-titos-gray-500 hover:text-status-live transition-colors text-xs flex items-center gap-1.5 px-2 py-2 cursor-pointer"
                      title="Delete playoff matches for this season"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Wipe
                    </button>
                  </div>
                </div>
                {editingId === s.id && (
                  <div className="mt-4 pt-4 border-t border-titos-border/40">
                    <PlayoffScheduleEditor key={editorVersion} seasonId={s.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
