'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, Plus, Trash2, RefreshCw, Check, AlertTriangle,
  ExternalLink, Trophy, ClipboardList, Pencil, X,
} from 'lucide-react'
import AuthGate from '@/components/admin/AuthGate'
import { adminFetch, adminPost, adminPatch, adminDelete } from '@/lib/adminFetch'
import { TOURNAMENT_STATUS } from '@/lib/tournament/constants'

function Panel({ title, children, action }) {
  return (
    <section className="card-flat rounded-xl overflow-hidden">
      <header className="px-4 sm:px-5 py-3 border-b border-titos-border/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="font-display font-bold text-titos-white">{title}</h2>
        {action && <div className="flex flex-wrap gap-2">{action}</div>}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

// Convert a UTC ISO string to a local-time string suitable for
// <input type="datetime-local">. Native datetime-local expects "YYYY-MM-DDTHH:mm"
// interpreted as the user's local zone — so we offset by getTimezoneOffset
// before serializing so the displayed time matches what the admin typed.
function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

// Inverse of toLocalInput. <input type="datetime-local"> returns a bare
// "YYYY-MM-DDTHH:mm" string with no timezone designator. The browser's Date
// constructor interprets that as *local time* (which is what the admin typed),
// so .toISOString() produces the correct UTC instant.
//
// If we skip this step and send the raw string to the server, `new Date(str)`
// on a UTC-runtime server (Vercel) parses it as UTC — shifting the saved time
// by the admin's TZ offset (e.g. EST admin types 10:00, DB ends up with 10:00
// UTC = 6:00 EST). Convert here so the server never has to guess.
function localInputToISO(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function ConfigForm({ tournament, onSaved }) {
  const [form, setForm] = useState({
    name: tournament.name,
    venue: tournament.venue || '',
    // datetime-local so the admin can set the exact kickoff time (10:00 AM
    // etc). This feeds scheduledTime stamping in the schedule generator
    // (round 1 at tournament.date, each subsequent round +30 min).
    date: toLocalInput(tournament.date),
    endDate: toLocalInput(tournament.endDate),
    poolSize: tournament.poolSize || 4,
    poolCount: tournament.poolCount || 4,
    status: tournament.status,
    description: tournament.description || '',
  })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const save = async (e) => {
    e.preventDefault()
    setBusy(true); setMsg('')
    try {
      // Convert datetime-local strings from "admin's local time" to proper UTC
      // ISO before sending. Otherwise the server (Vercel = UTC) treats them as
      // UTC and the stored time is off by the admin's TZ offset.
      const payload = {
        ...form,
        date: localInputToISO(form.date),
        endDate: form.endDate ? localInputToISO(form.endDate) : null,
      }
      const res = await adminPatch(`/api/admin/tournaments/${tournament.slug}`, payload)
      if (!res.ok) {
        const d = await res.json()
        setMsg(d.error || 'Failed to save')
      } else {
        setMsg('Saved')
        onSaved()
      }
    } catch { setMsg('Connection error') }
    setBusy(false)
  }

  const inputCls =
    'w-full mt-1 px-3 py-2.5 bg-titos-elevated border border-titos-border rounded-md text-titos-white text-base md:text-sm min-h-[44px] focus:outline-none focus:border-titos-gold/50 focus:ring-2 focus:ring-titos-gold/20'

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <label className="block"><span className="text-xs text-titos-gray-400">Name</span>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
        </label>
        <label className="block"><span className="text-xs text-titos-gray-400">Venue</span>
          <input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} className={inputCls} />
        </label>
        <label className="block"><span className="text-xs text-titos-gray-400">Kickoff (first match)</span>
          <input
            type="datetime-local"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
            className={inputCls}
            aria-describedby={`${tournament.slug}-kickoff-hint`}
          />
          <span id={`${tournament.slug}-kickoff-hint`} className="mt-1 block text-[11px] text-titos-gray-500">
            Round 1 fires at this time. Each round is 30 min later.
          </span>
        </label>
        <label className="block"><span className="text-xs text-titos-gray-400">End (optional)</span>
          <input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className={inputCls} />
        </label>
        <label className="block"><span className="text-xs text-titos-gray-400">Pool Size</span>
          <input type="number" inputMode="numeric" min="2" max="10" value={form.poolSize} onChange={e => setForm({ ...form, poolSize: e.target.value })} className={inputCls} />
        </label>
        <label className="block"><span className="text-xs text-titos-gray-400">Pool Count</span>
          <input type="number" inputMode="numeric" min="2" max="12" value={form.poolCount} onChange={e => setForm({ ...form, poolCount: e.target.value })} className={inputCls} />
        </label>
        <label className="block md:col-span-2"><span className="text-xs text-titos-gray-400">Status</span>
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}>
            <option value={TOURNAMENT_STATUS.REGISTRATION}>Registration</option>
            <option value={TOURNAMENT_STATUS.FULL}>Full</option>
            <option value={TOURNAMENT_STATUS.ACTIVE}>Active</option>
            <option value={TOURNAMENT_STATUS.COMPLETED}>Completed</option>
          </select>
        </label>
        <label className="block md:col-span-2"><span className="text-xs text-titos-gray-400">Description</span>
          <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`${inputCls} min-h-[5rem]`} />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
        </button>
        {msg && <span className="text-sm text-titos-gray-400">{msg}</span>}
      </div>
    </form>
  )
}

/**
 * Single team row. Two modes:
 *   - 'view' (default) — name + captain line, edit + delete icon buttons
 *   - 'edit' — inline 4-field form (name / captain / email / phone) with Save/Cancel
 *
 * Editing is disabled once a team has been placed in a pool, because name changes
 * propagate through matches/standings and may confuse scorekeepers mid-tournament.
 */
function TeamRow({ team, slug, onChange }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: team.name,
    captainName: team.captainName || '',
    captainEmail: team.captainEmail || '',
    captainPhone: team.captainPhone || '',
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const startEdit = () => {
    setForm({
      name: team.name,
      captainName: team.captainName || '',
      captainEmail: team.captainEmail || '',
      captainPhone: team.captainPhone || '',
    })
    setErr('')
    setEditing(true)
  }

  const cancel = () => { setErr(''); setEditing(false) }

  const save = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setErr('Team name is required'); return }
    setBusy(true); setErr('')
    try {
      const res = await adminPatch(`/api/admin/tournaments/${slug}/teams`, {
        teamId: team.id,
        name: form.name.trim(),
        captainName: form.captainName.trim() || 'TBD',
        captainEmail: form.captainEmail.trim() || null,
        captainPhone: form.captainPhone.trim() || null,
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setErr(d.error || 'Failed to save')
      } else {
        setEditing(false)
        onChange()
      }
    } catch {
      setErr('Connection error')
    }
    setBusy(false)
  }

  const remove = async () => {
    if (!confirm(`Remove ${team.name}?`)) return
    const res = await adminDelete(`/api/admin/tournaments/${slug}/teams?teamId=${team.id}`)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      alert(d.error || 'Failed to delete')
    } else {
      onChange()
    }
  }

  const inputCls =
    'w-full px-3 py-2.5 bg-titos-elevated border border-titos-border rounded-md text-titos-white text-base md:text-sm placeholder:text-titos-gray-500 focus:outline-none focus:border-titos-gold/50 focus:ring-2 focus:ring-titos-gold/20 min-h-[44px]'

  if (editing) {
    return (
      <form onSubmit={save} className="py-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <label className="block">
            <span className="sr-only">Team name</span>
            <input
              required
              autoFocus
              placeholder="Team name *"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="sr-only">Captain name</span>
            <input
              placeholder="Captain name"
              autoComplete="name"
              value={form.captainName}
              onChange={e => setForm({ ...form, captainName: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="sr-only">Email</span>
            <input
              type="email"
              placeholder="Email"
              autoComplete="email"
              inputMode="email"
              value={form.captainEmail}
              onChange={e => setForm({ ...form, captainEmail: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="sr-only">Phone</span>
            <input
              type="tel"
              placeholder="Phone"
              autoComplete="tel"
              inputMode="tel"
              value={form.captainPhone}
              onChange={e => setForm({ ...form, captainPhone: e.target.value })}
              className={inputCls}
            />
          </label>
        </div>
        {err && <p className="text-status-live text-xs" role="alert">{err}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-titos-gold px-4 py-2 text-sm font-semibold text-titos-surface min-h-[44px] hover:bg-titos-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold focus-visible:ring-offset-2 focus-visible:ring-offset-titos-card"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Check className="w-4 h-4" aria-hidden="true" />}
            Save
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-titos-gray-300 hover:text-titos-white hover:bg-titos-elevated min-h-[44px] transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex items-center justify-between gap-2 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-titos-white font-medium text-sm truncate">{team.name}</div>
        <div className="text-titos-gray-500 text-xs truncate">
          {team.captainName}{team.captainEmail ? ` · ${team.captainEmail}` : ''}
          {team.poolId && <> · <span className="text-titos-gold">Pool assigned</span></>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={startEdit}
          aria-label={`Edit ${team.name}`}
          className="inline-flex items-center justify-center rounded-md text-titos-gray-500 hover:text-titos-gold hover:bg-titos-gold/10 transition-colors min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold"
        >
          <Pencil className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={remove}
          aria-label={`Remove ${team.name}`}
          className="inline-flex items-center justify-center rounded-md text-titos-gray-500 hover:text-status-live hover:bg-status-live/10 transition-colors min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-live"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function TeamsPanel({ tournament, onChange }) {
  const [mode, setMode] = useState('single') // 'single' | 'bulk'
  const [form, setForm] = useState({ name: '', captainName: '', captainEmail: '', captainPhone: '' })
  const [bulk, setBulk] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')

  const addTeam = async (e) => {
    e.preventDefault()
    if (!form.name || !form.captainName) return
    setBusy(true); setErr(''); setInfo('')
    try {
      const res = await adminPost(`/api/admin/tournaments/${tournament.slug}/teams`, form)
      if (!res.ok) { const d = await res.json(); setErr(d.error || 'Failed') }
      else { setForm({ name: '', captainName: '', captainEmail: '', captainPhone: '' }); onChange() }
    } catch { setErr('Connection error') }
    setBusy(false)
  }

  const addBulk = async (e) => {
    e.preventDefault()
    const lines = bulk.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) { setErr('Paste at least one team name'); return }
    // Parse each line: "Team Name, Captain Name, Email, Phone" — all but first are optional
    const teams = lines.map(line => {
      const parts = line.split(',').map(p => p.trim())
      return {
        name: parts[0],
        captainName: parts[1] || '',
        captainEmail: parts[2] || '',
        captainPhone: parts[3] || '',
      }
    })
    setBusy(true); setErr(''); setInfo('')
    try {
      const res = await adminPost(`/api/admin/tournaments/${tournament.slug}/teams`, { teams })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(data.error || 'Bulk add failed')
      } else {
        const msg = `Added ${data.count} team${data.count === 1 ? '' : 's'}` +
          (data.skipped ? ` · skipped ${data.skipped} blank` : '') +
          (data.errors?.length ? ` · ${data.errors.length} error(s)` : '')
        setInfo(msg)
        if (data.errors?.length) setErr(data.errors.join('; '))
        setBulk('')
        onChange()
      }
    } catch { setErr('Connection error') }
    setBusy(false)
  }

  const inputCls =
    'w-full px-3 py-2.5 bg-titos-elevated border border-titos-border rounded-md text-titos-white text-base md:text-sm placeholder:text-titos-gray-500 focus:outline-none focus:border-titos-gold/50 focus:ring-2 focus:ring-titos-gold/20 min-h-[44px]'

  // Mode tab styling — active tab gets gold accent, inactive tabs muted
  const tabCls = (active) =>
    `inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md min-h-[40px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold ` +
    (active
      ? 'bg-titos-gold/15 text-titos-gold'
      : 'text-titos-gray-400 hover:text-titos-white')

  return (
    <Panel title={`Teams (${tournament.tournamentTeams.length})`}>
      {/* Mode toggle */}
      <div className="flex gap-1 mb-4" role="tablist" aria-label="Team add mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'single'}
          onClick={() => { setMode('single'); setErr(''); setInfo('') }}
          className={tabCls(mode === 'single')}
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          Single
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'bulk'}
          onClick={() => { setMode('bulk'); setErr(''); setInfo('') }}
          className={tabCls(mode === 'bulk')}
        >
          <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" />
          Bulk paste
        </button>
      </div>

      {mode === 'single' ? (
        <form onSubmit={addTeam} className="space-y-3 mb-5">
          {/* Inputs: 1 col on mobile, 2 cols ≥sm, 4 cols ≥lg. Button ALWAYS on its own row
              so it never gets clipped and is easy to thumb-tap on mobile. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="block">
              <span className="sr-only">Team name</span>
              <input
                required
                placeholder="Team name *"
                autoComplete="off"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="sr-only">Captain name</span>
              <input
                required
                placeholder="Captain name *"
                autoComplete="name"
                value={form.captainName}
                onChange={e => setForm({ ...form, captainName: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="sr-only">Email</span>
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                inputMode="email"
                value={form.captainEmail}
                onChange={e => setForm({ ...form, captainEmail: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="sr-only">Phone</span>
              <input
                type="tel"
                placeholder="Phone"
                autoComplete="tel"
                inputMode="tel"
                value={form.captainPhone}
                onChange={e => setForm({ ...form, captainPhone: e.target.value })}
                className={inputCls}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-titos-gold px-5 py-3 text-sm font-semibold text-titos-surface min-h-[44px] hover:bg-titos-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold focus-visible:ring-offset-2 focus-visible:ring-offset-titos-card"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Plus className="w-4 h-4" aria-hidden="true" />}
            Add team
          </button>
        </form>
      ) : (
        <form onSubmit={addBulk} className="space-y-3 mb-5">
          <label className="block">
            <span className="text-xs text-titos-gray-400 block mb-1.5">
              One team per line. Optional comma-separated fields: <code className="text-titos-gray-300">name, captain, email, phone</code>
            </span>
            <textarea
              value={bulk}
              onChange={e => setBulk(e.target.value)}
              rows={6}
              placeholder={'Block Party, Jessica Chen, jessica@email.com\nNet Worth, Amanda Patel\nSpikezilla'}
              spellCheck={false}
              className="w-full px-3 py-2.5 bg-titos-elevated border border-titos-border rounded-md text-titos-white text-base md:text-sm placeholder:text-titos-gray-500 focus:outline-none focus:border-titos-gold/50 focus:ring-2 focus:ring-titos-gold/20 font-mono resize-y min-h-[160px]"
            />
            <span className="block mt-1.5 text-xs text-titos-gray-500" aria-live="polite">
              {(() => {
                const n = bulk.split('\n').map(l => l.trim()).filter(Boolean).length
                return n === 0 ? 'No teams yet' : `${n} team${n === 1 ? '' : 's'} ready to add`
              })()}
            </span>
          </label>
          <button
            type="submit"
            disabled={busy || bulk.trim().length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-titos-gold px-5 py-3 text-sm font-semibold text-titos-surface min-h-[44px] hover:bg-titos-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold focus-visible:ring-offset-2 focus-visible:ring-offset-titos-card"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <ClipboardList className="w-4 h-4" aria-hidden="true" />}
            Add all
          </button>
        </form>
      )}
      {info && <p className="text-titos-gold text-sm mb-3" role="status">{info}</p>}
      {err && <p className="text-status-live text-sm mb-3" role="alert">{err}</p>}
      <div className="divide-y divide-titos-border/20">
        {tournament.tournamentTeams.map(t => (
          <TeamRow key={t.id} team={t} slug={tournament.slug} onChange={onChange} />
        ))}
        {tournament.tournamentTeams.length === 0 && (
          <p className="text-titos-gray-500 text-center py-6 text-sm">No teams yet.</p>
        )}
      </div>
    </Panel>
  )
}

function PoolsPanel({ tournament, onChange }) {
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')

  const generatePools = async () => {
    setBusy('generate'); setErr(''); setInfo('')
    const res = await adminPost(`/api/admin/tournaments/${tournament.slug}/pools`, {})
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setErr(data.error || 'Failed') }
    else {
      // Surface how many teams were randomly drawn in, plus any leftovers.
      if (typeof data.assigned === 'number') {
        const msg = `Drew ${data.assigned} team${data.assigned === 1 ? '' : 's'} into ${data.pools?.length ?? 0} pool${data.pools?.length === 1 ? '' : 's'}` +
          (data.skipped ? ` · ${data.skipped} unassigned (pool size cap)` : '')
        setInfo(msg)
      }
      onChange()
    }
    setBusy('')
  }
  const tearDownPools = async () => {
    if (!confirm('Tear down all pools? Teams will be unassigned.')) return
    setBusy('teardown'); setErr(''); setInfo('')
    const res = await adminDelete(`/api/admin/tournaments/${tournament.slug}/pools`)
    if (!res.ok) { const d = await res.json(); setErr(d.error || 'Failed') }
    else onChange()
    setBusy('')
  }
  const generateSchedule = async () => {
    setBusy('schedule'); setErr('')
    const res = await adminPost(`/api/admin/tournaments/${tournament.slug}/schedule`, {})
    if (!res.ok) { const d = await res.json(); setErr(d.error || 'Failed') }
    else onChange()
    setBusy('')
  }
  const reseedPools = async () => {
    setBusy('reseed'); setErr(''); setInfo('')
    const res = await adminPost(`/api/admin/tournaments/${tournament.slug}/reseed`, {})
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setErr(data.error || 'Failed') }
    else { setInfo(data.message || `Reseeded ${data.reseeded ?? 0} team(s)`); onChange() }
    setBusy('')
  }
  const clearSchedule = async () => {
    if (!confirm('Clear all pool matches?')) return
    setBusy('clear'); setErr('')
    const res = await adminDelete(`/api/admin/tournaments/${tournament.slug}/schedule`)
    if (!res.ok) { const d = await res.json(); setErr(d.error || 'Failed') }
    else onChange()
    setBusy('')
  }
  const resetScores = async () => {
    if (!confirm('Reset ALL pool scores? Matches, pairings, and seeds stay — only scores + winners are wiped. Useful for re-running pool play in testing.')) return
    setBusy('reset'); setErr(''); setInfo('')
    const res = await adminPost(`/api/admin/tournaments/${tournament.slug}/reset-scores`, {})
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setErr(data.error || 'Failed') }
    else {
      setInfo(`Reset ${data.reset ?? 0} match${data.reset === 1 ? '' : 'es'} · cleared ${data.scoresDeleted ?? 0} set score${data.scoresDeleted === 1 ? '' : 's'}`)
      onChange()
    }
    setBusy('')
  }

  const assignTeam = async (teamId, poolId) => {
    const res = await adminPatch(`/api/admin/tournaments/${tournament.slug}/pool-teams`, { teamId, poolId })
    if (!res.ok) { const d = await res.json(); alert(d.error || 'Failed') }
    else onChange()
  }

  const poolsHaveMatches = tournament.pools.some(p => p._count.matches > 0)
  const allTeamsAssigned = tournament.tournamentTeams.length > 0 && tournament.tournamentTeams.every(t => t.poolId)

  return (
    <Panel
      title={`Pools (${tournament.pools.length})`}
      action={
        <div className="flex flex-wrap gap-2">
          {tournament.pools.length === 0 && (
            <button onClick={generatePools} disabled={busy === 'generate'} className="btn-primary text-xs py-2">
              {busy === 'generate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Generate Pools
            </button>
          )}
          {tournament.pools.length > 0 && !poolsHaveMatches && (
            <button onClick={tearDownPools} disabled={busy === 'teardown'} className="text-xs py-2 px-3 text-status-live border border-status-live/30 rounded-lg hover:bg-status-live/10">
              Tear Down
            </button>
          )}
          {tournament.pools.length > 0 && (
            <button
              onClick={reseedPools}
              disabled={busy === 'reseed'}
              title="Re-stamp seeds 1..N per pool — fixes ref rotation when seeds are missing or stale. Safe to run with matches in progress (doesn't touch pairings)."
              className="inline-flex items-center gap-1.5 text-xs py-2 px-3 text-titos-gray-300 border border-titos-border rounded-lg hover:border-titos-gold/40 hover:text-titos-white transition-colors"
            >
              {busy === 'reseed' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Reseed
            </button>
          )}
          {tournament.pools.length > 0 && !poolsHaveMatches && allTeamsAssigned && (
            <button onClick={generateSchedule} disabled={busy === 'schedule'} className="btn-primary text-xs py-2">
              {busy === 'schedule' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Generate Schedule
            </button>
          )}
          {poolsHaveMatches && (
            <button
              onClick={resetScores}
              disabled={busy === 'reset'}
              title="Wipe every pool-match score and flip all matches back to 'scheduled'. Keeps pairings, courts, and seeds intact — perfect for re-running pool play while testing."
              className="inline-flex items-center gap-1.5 text-xs py-2 px-3 text-titos-gray-300 border border-titos-border rounded-lg hover:border-titos-gold/40 hover:text-titos-white transition-colors"
            >
              {busy === 'reset' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Reset Scores
            </button>
          )}
          {poolsHaveMatches && (
            <button onClick={clearSchedule} disabled={busy === 'clear'} className="text-xs py-2 px-3 text-status-live border border-status-live/30 rounded-lg hover:bg-status-live/10">
              Clear Schedule
            </button>
          )}
        </div>
      }
    >
      {err && <p className="text-status-live text-sm mb-3" role="alert">{err}</p>}
      {info && <p className="text-titos-gold text-sm mb-3" role="status">{info}</p>}
      {tournament.pools.length === 0 ? (
        <p className="text-titos-gray-500 text-sm">
          No pools yet. Add teams above, then click <span className="text-titos-white font-medium">Generate Pools</span> — teams get shuffled into pools at random.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            {tournament.pools.map(pool => (
              <div key={pool.id} className="card rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-titos-gold text-sm">{pool.name}</span>
                  <span className="text-titos-gray-500 text-xs">{pool.teams.length} teams · {pool._count.matches} matches</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {pool.teams
                    .slice()
                    .sort((a, b) => (a.seed ?? 99) - (b.seed ?? 99))
                    .map(t => (
                      <span
                        key={t.id}
                        className="text-xs px-2 py-1 bg-titos-elevated rounded text-titos-gray-300 inline-flex items-center gap-1.5"
                      >
                        {t.seed != null && (
                          <span className="text-[10px] font-bold text-titos-gold tabular-nums">
                            {t.seed}
                          </span>
                        )}
                        {t.name}
                      </span>
                    ))}
                  {pool.teams.length === 0 && <span className="text-titos-gray-500 text-xs">No teams assigned</span>}
                </div>
              </div>
            ))}
          </div>

          {!poolsHaveMatches && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-titos-gray-500 mb-2">Assign Teams</h4>
              <div className="divide-y divide-titos-border/20">
                {tournament.tournamentTeams.map(t => (
                  <div key={t.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="text-titos-white text-sm min-w-0 truncate flex-1" title={t.name}>{t.name}</span>
                    <select
                      value={t.poolId || ''}
                      onChange={e => assignTeam(t.id, e.target.value || null)}
                      aria-label={`Assign ${t.name} to pool`}
                      className="shrink-0 px-2 py-2 min-h-[40px] bg-titos-elevated border border-titos-border rounded text-titos-white text-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titos-gold"
                    >
                      <option value="">Unassigned</option>
                      {tournament.pools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}

function BracketPanel({ tournament, onChange }) {
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [pending, setPending] = useState([])

  const generateBrackets = async () => {
    setBusy('generate'); setErr(''); setPending([])
    const res = await adminPost(`/api/admin/tournaments/${tournament.slug}/brackets`, {})
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setErr(d.error || 'Failed')
      // Surface the specific pool matches still blocking bracket generation,
      // so the admin sees exactly what to fix instead of a generic error.
      if (Array.isArray(d.pending)) setPending(d.pending)
    }
    else onChange()
    setBusy('')
  }
  const deleteBrackets = async () => {
    // Explicit: this wipes every bracket match AND any scores already entered
    // on them. Pool play is untouched. We prompt plainly so nobody trips the
    // button expecting a no-op.
    if (!confirm('Delete all brackets? This also wipes any bracket match scores. Pool play is untouched.')) return
    setBusy('delete'); setErr(''); setPending([])
    const res = await adminDelete(`/api/admin/tournaments/${tournament.slug}/brackets`)
    if (!res.ok) { const d = await res.json(); setErr(d.error || 'Failed') }
    else onChange()
    setBusy('')
  }

  return (
    <Panel
      title="Brackets"
      action={
        <div className="flex flex-wrap gap-2">
          {tournament.brackets.length === 0 ? (
            <button onClick={generateBrackets} disabled={busy === 'generate'} className="btn-primary text-xs py-2">
              {busy === 'generate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trophy className="w-3.5 h-3.5" />}
              Generate Brackets
            </button>
          ) : (
            <>
              <Link href={`/admin/tournaments/${tournament.slug}/bracket`} className="btn-primary text-xs py-2">
                Enter Bracket Scores
              </Link>
              <button onClick={deleteBrackets} disabled={busy === 'delete'} className="text-xs py-2 px-3 text-status-live border border-status-live/30 rounded-lg hover:bg-status-live/10">
                Delete
              </button>
            </>
          )}
        </div>
      }
    >
      {err && <p className="text-status-live text-sm mb-3">{err}</p>}
      {pending.length > 0 && (
        <div className="mb-3 p-3 rounded-lg border border-status-live/30 bg-status-live/5">
          <p className="text-titos-gray-300 text-xs mb-2">Pool matches still pending:</p>
          <ul className="space-y-1">
            {pending.map(m => (
              <li key={m.id} className="text-titos-white text-sm">
                <span className="text-titos-gray-500">Pool {m.pool} · {m.status}</span> — {m.label}
              </li>
            ))}
          </ul>
        </div>
      )}
      {tournament.brackets.length === 0 ? (
        <p className="text-titos-gray-500 text-sm">
          Brackets appear once all pool matches are FINAL. Click Generate Brackets to seed Gold + Silver.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tournament.brackets.map(b => (
            <span key={b.id} className="px-3 py-2 bg-titos-elevated rounded text-titos-white text-sm">
              {b.division} · {b._count.matches} matches
            </span>
          ))}
        </div>
      )}
    </Panel>
  )
}

function Inner({ slug }) {
  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try {
      const res = await adminFetch(`/api/admin/tournaments/${slug}`)
      if (!res.ok) { setErr('Not found'); setLoading(false); return }
      const data = await res.json()
      setTournament(data.tournament)
    } catch { setErr('Connection error') }
    setLoading(false)
  }, [slug])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-titos-gold mx-auto animate-spin" /></div>
  if (err || !tournament) return (
    <div className="py-12 px-4 max-w-3xl mx-auto">
      <div className="card rounded-xl p-6 border-status-live/30 bg-status-live/5 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-status-live" />
        <p className="text-status-live">{err || 'Tournament not found'}</p>
      </div>
    </div>
  )

  return (
    <div className="py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin/tournaments" className="text-titos-gray-400 hover:text-titos-gold shrink-0"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-display text-xl sm:text-2xl font-black text-titos-white truncate">{tournament.name}</h1>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Link href={`/admin/tournaments/${slug}/scores`} className="btn-primary text-xs py-2">Enter Pool Scores</Link>
            <Link href={`/tournaments/${slug}`} target="_blank" className="inline-flex items-center gap-1 text-titos-gray-400 hover:text-titos-gold text-xs font-bold px-3 py-2 min-h-[40px]">
              Public <ExternalLink className="w-3 h-3" />
            </Link>
            <button onClick={load} aria-label="Refresh" className="inline-flex items-center justify-center text-titos-gray-400 hover:text-titos-white p-2 min-h-[40px] min-w-[40px]"><RefreshCw className="w-4 h-4" /></button>
          </div>
        </div>

        <Panel title="Config">
          <ConfigForm tournament={tournament} onSaved={load} />
        </Panel>

        <TeamsPanel tournament={tournament} onChange={load} />
        <PoolsPanel tournament={tournament} onChange={load} />
        <BracketPanel tournament={tournament} onChange={load} />
      </div>
    </div>
  )
}

export default function AdminTournamentDetailPage({ params }) {
  const { slug } = use(params)
  return <AuthGate><Inner slug={slug} /></AuthGate>
}
