'use client'

// Admin: bulk-import player stats from the league master sheet.
//
// Flow: pick league → pick week → paste rows from Google Sheets → preview
// (shows team/player matches + warns about unknown teams or new players) →
// commit. Commit upserts Player records and writes one PlayerStat per
// player per week, then busts the public /stats cache tag so the change
// shows up immediately.

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Upload, Eye, Check, AlertCircle, Shield, Trash2 } from 'lucide-react'
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
          <Shield className="w-10 h-10 text-titos-gold mx-auto mb-3" aria-hidden="true" />
          <h1 className="font-display text-2xl font-black text-titos-white">Admin Access</h1>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label htmlFor="pw" className="sr-only">Password</label>
          <input
            id="pw" type="password" value={pw} onChange={e => setPw(e.target.value)}
            placeholder="Password" autoFocus
            className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50"
          />
          {err && <p className="text-status-live text-sm text-center" role="alert">{err}</p>}
          <button type="submit" disabled={checking} className="w-full btn-primary justify-center cursor-pointer">
            {checking ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

const EXAMPLE_PASTE = `# Paste tab-separated rows copied from the master sheet.
# Format: TEAM<tab>PLAYER<tab>#<tab>KILLS<tab>ASSISTS<tab>DIGS<tab>ACES<tab>BLOCKS
# The "#" jersey column is optional.
SNORLAX SIX\tAndrea Enriquez\t11\t1\t1\t2\t0\t0
SNORLAX SIX\tDominic Medalle\t1\t12\t1\t2\t2\t2
HOUSE OF HOPS\tLong Nguyen\t14\t13\t0\t1\t0\t10`

export default function StatsAdminPage() {
  const [authed, setAuthed] = useState(false)
  const [meta, setMeta] = useState(null) // { league, season, teams, weeks }
  const [leagueSlug, setLeagueSlug] = useState('thursday-rec-coed')
  const [weekNumber, setWeekNumber] = useState('')
  const [paste, setPaste] = useState('')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('admin_auth') === 'true') setAuthed(true)
  }, [])

  const loadMeta = useCallback(async () => {
    if (!leagueSlug) return
    setErr('')
    try {
      const res = await fetch(`/api/admin/player-stats?leagueSlug=${leagueSlug}`)
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Failed to load league'); setMeta(null); return }
      setMeta(data)
      if (!weekNumber && data.weeks?.length) {
        const active = data.weeks.find(w => w.status === 'active') || data.weeks[0]
        setWeekNumber(String(active.weekNumber))
      }
    } catch { setErr('Network error') }
  }, [leagueSlug, weekNumber])

  useEffect(() => { if (authed) loadMeta() }, [authed, loadMeta])

  const onPreview = async () => {
    setLoading(true); setErr(''); setPreview(null); setResult(null)
    try {
      const res = await fetch('/api/admin/player-stats?action=preview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueSlug, weekNumber: parseInt(weekNumber, 10), paste }),
      })
      const data = await res.json()
      if (!res.ok) setErr(data.error || 'Preview failed')
      else setPreview(data)
    } catch { setErr('Network error') }
    setLoading(false)
  }

  const onCommit = async () => {
    if (!preview?.rows?.length) return
    if (!confirm(`Commit ${preview.rows.filter(r => r.teamMatch).length} player-stat rows for Week ${weekNumber}?`)) return
    setCommitting(true); setErr(''); setResult(null)
    try {
      const res = await fetch('/api/admin/player-stats?action=commit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueSlug, weekNumber: parseInt(weekNumber, 10),
          rows: preview.rows.filter(r => r.teamMatch),
        }),
      })
      const data = await res.json()
      if (!res.ok) setErr(data.error || 'Commit failed')
      else { setResult(data); setPreview(null); setPaste(''); loadMeta() }
    } catch { setErr('Network error') }
    setCommitting(false)
  }

  const onWipe = async () => {
    if (!confirm(`Wipe ALL player stats for Week ${weekNumber}? This cannot be undone.`)) return
    setErr(''); setResult(null)
    try {
      const res = await fetch('/api/admin/player-stats', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueSlug, weekNumber: parseInt(weekNumber, 10) }),
      })
      const data = await res.json()
      if (!res.ok) setErr(data.error || 'Delete failed')
      else setResult({ wiped: data.deleted })
    } catch { setErr('Network error') }
  }

  if (!authed) return <AuthGate onAuth={() => setAuthed(true)} />

  const matched = preview?.rows?.filter(r => r.teamMatch) || []
  const willCreate = matched.filter(r => r.willCreate)
  const unmatched = preview?.rows?.filter(r => !r.teamMatch) || []

  return (
    <div className="py-10 sm:py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin" className="text-titos-gray-400 hover:text-titos-gold transition-colors cursor-pointer" aria-label="Back to admin home">
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-titos-white">Player Stats Import</h1>
        </div>
        <p className="text-titos-gray-400 text-sm mb-8 ml-8">
          Paste tab-separated rows from the master sheet → preview → commit. One <code className="text-titos-gold">PlayerStat</code> row is written per player per week.
        </p>

        {/* League + Week pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="leagueSlug" className="block text-sm font-medium text-titos-gray-300 mb-2">League</label>
            <select
              id="leagueSlug" value={leagueSlug} onChange={e => setLeagueSlug(e.target.value)}
              className="w-full px-4 py-3 bg-titos-card border border-titos-border rounded-lg text-titos-white focus:outline-none focus:border-titos-gold/50 cursor-pointer"
            >
              <option value="thursday-rec-coed">Thursday REC COED</option>
              <option value="tuesday-coed">Tuesday COED</option>
              <option value="sunday-mens">Sunday MENS</option>
            </select>
          </div>
          <div>
            <label htmlFor="weekNumber" className="block text-sm font-medium text-titos-gray-300 mb-2">Week</label>
            <select
              id="weekNumber" value={weekNumber} onChange={e => setWeekNumber(e.target.value)}
              className="w-full px-4 py-3 bg-titos-card border border-titos-border rounded-lg text-titos-white focus:outline-none focus:border-titos-gold/50 cursor-pointer"
            >
              {(meta?.weeks || []).map(w => (
                <option key={w.id} value={w.weekNumber}>
                  Week {w.weekNumber} — {new Date(w.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })} ({w.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Teams summary (helps the user know which canonical team names to expect) */}
        {meta?.teams?.length > 0 && (
          <div className="mb-6 p-4 bg-titos-card border border-titos-border/40 rounded-lg">
            <span className="block text-titos-gray-400 text-xs uppercase tracking-wider font-bold mb-2">Teams in this season</span>
            <div className="flex flex-wrap gap-2">
              {meta.teams.map(t => (
                <span key={t.id} className="px-2.5 py-1 bg-titos-elevated rounded-md text-titos-gray-200 text-xs font-medium border border-titos-border/20">
                  {t.name} <span className="text-titos-gray-500">· {t.players.length}p</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Paste area */}
        <div className="mb-4">
          <label htmlFor="paste" className="block text-sm font-medium text-titos-gray-300 mb-2">
            Paste rows (tab-separated from Google Sheets)
          </label>
          <textarea
            id="paste" value={paste} onChange={e => setPaste(e.target.value)}
            placeholder={EXAMPLE_PASTE}
            spellCheck={false}
            className="w-full min-h-[200px] px-4 py-3 bg-titos-card border border-titos-border rounded-lg text-titos-white text-sm font-mono placeholder-titos-gray-600 focus:outline-none focus:border-titos-gold/50 resize-y"
          />
          <p className="text-titos-gray-500 text-xs mt-2">
            Columns: TEAM · PLAYER · # (optional) · KILLS · ASSISTS · DIGS · ACES · BLOCKS. Lines starting with <code>#</code> are skipped.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={onPreview} disabled={!paste.trim() || !weekNumber || loading}
            className={cn('btn-primary cursor-pointer', (!paste.trim() || !weekNumber || loading) && 'opacity-50 cursor-not-allowed')}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
            Preview
          </button>
          {preview && matched.length > 0 && (
            <button
              onClick={onCommit} disabled={committing}
              className={cn('btn-primary bg-status-success/15 border-status-success/40 text-status-success cursor-pointer', committing && 'opacity-50 cursor-not-allowed')}
            >
              {committing ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Upload className="w-4 h-4" aria-hidden="true" />}
              Commit {matched.length} rows
            </button>
          )}
          <button
            onClick={onWipe}
            className="px-4 py-2.5 text-titos-gray-400 hover:text-status-live transition-colors text-sm flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Wipe Week {weekNumber}
          </button>
        </div>

        {err && (
          <div className="mb-6 p-4 bg-status-live/10 border border-status-live/30 rounded-lg flex items-start gap-3" role="alert">
            <AlertCircle className="w-5 h-5 text-status-live flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-status-live text-sm">{err}</p>
          </div>
        )}

        {result && (
          <div className="mb-6 p-4 bg-status-success/10 border border-status-success/30 rounded-lg flex items-start gap-3" role="status" aria-live="polite">
            <Check className="w-5 h-5 text-status-success flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-status-success text-sm">
              {result.wiped !== undefined ? (
                <p>Wiped {result.wiped} stat rows for Week {weekNumber}.</p>
              ) : (
                <p>
                  Saved {result.created || 0} new + {result.updated || 0} updated stat rows for Week {result.week?.weekNumber}.
                  {result.skipped > 0 && <span className="block text-status-success/80 mt-1">Skipped {result.skipped}: {result.skippedReasons?.join('; ')}</span>}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Preview table */}
        {preview && (
          <div className="space-y-4">
            {unmatched.length > 0 && (
              <div className="p-4 bg-status-live/8 border border-status-live/30 rounded-lg">
                <span className="block font-bold text-status-live text-sm mb-2">Unmatched teams ({unmatched.length} rows)</span>
                <p className="text-titos-gray-300 text-xs">
                  These team names don&apos;t match any team in this season. Fix the team name in your paste, then re-preview.
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {[...new Set(unmatched.map(r => r.team))].map(name => (
                    <li key={name} className="px-2 py-1 bg-status-live/10 rounded text-status-live text-xs font-mono">{name}</li>
                  ))}
                </ul>
              </div>
            )}

            {willCreate.length > 0 && (
              <div className="p-4 bg-titos-gold/8 border border-titos-gold/30 rounded-lg">
                <span className="block font-bold text-titos-gold text-sm mb-2">New players to be created ({willCreate.length})</span>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {willCreate.map((r, i) => (
                    <li key={i} className="px-2 py-1 bg-titos-gold/10 rounded text-titos-gold text-xs font-medium">
                      {r.player} <span className="text-titos-gold/60">· {r.teamMatch?.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-titos-border/40">
              <table className="w-full text-sm">
                <thead className="bg-titos-elevated">
                  <tr className="text-titos-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-3 py-2 text-left font-bold">Team</th>
                    <th className="px-3 py-2 text-left font-bold">Player</th>
                    <th className="px-3 py-2 text-right font-bold">#</th>
                    <th className="px-3 py-2 text-right font-bold">K</th>
                    <th className="px-3 py-2 text-right font-bold">A</th>
                    <th className="px-3 py-2 text-right font-bold">D</th>
                    <th className="px-3 py-2 text-right font-bold">Ace</th>
                    <th className="px-3 py-2 text-right font-bold">Blk</th>
                    <th className="px-3 py-2 text-left font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-titos-card">
                  {preview.rows.map((r, i) => (
                    <tr key={i} className="border-t border-titos-border/20">
                      <td className="px-3 py-2 text-titos-gray-200">
                        {r.teamMatch ? (
                          <span>{r.teamMatch.name}<span className="text-titos-gray-500 text-xs"> ({r.team})</span></span>
                        ) : (
                          <span className="text-status-live font-mono">{r.team}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-semibold text-titos-white">{r.player}</td>
                      <td className="px-3 py-2 text-right text-titos-gray-400">{r.jerseyNumber ?? '—'}</td>
                      <td className="px-3 py-2 text-right font-mono text-titos-white">{r.kills}</td>
                      <td className="px-3 py-2 text-right font-mono text-titos-white">{r.assists}</td>
                      <td className="px-3 py-2 text-right font-mono text-titos-white">{r.digs}</td>
                      <td className="px-3 py-2 text-right font-mono text-titos-white">{r.aces}</td>
                      <td className="px-3 py-2 text-right font-mono text-titos-white">{r.blocks}</td>
                      <td className="px-3 py-2 text-xs">
                        {!r.teamMatch
                          ? <span className="text-status-live">no team</span>
                          : r.playerMatch
                            ? <span className="text-status-success">update</span>
                            : <span className="text-titos-gold">new player</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {preview.errors?.length > 0 && (
              <div className="p-3 bg-titos-elevated/50 border border-titos-border/40 rounded-lg">
                <span className="block text-xs uppercase tracking-wider text-titos-gray-500 mb-1">Parse warnings</span>
                <ul className="text-titos-gray-400 text-xs space-y-1">
                  {preview.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
