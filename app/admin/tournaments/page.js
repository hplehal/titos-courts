'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trophy, Plus, Loader2, ExternalLink, Trash2 } from 'lucide-react'
import AuthGate from '@/components/admin/AuthGate'
import { adminFetch, adminPost, adminDelete } from '@/lib/adminFetch'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'

// <input type="datetime-local"> returns "YYYY-MM-DDTHH:mm" with no timezone.
// The browser's Date constructor parses that as *local time* (what the admin
// typed), so .toISOString() yields the correct UTC instant. Without this
// conversion, the UTC-runtime server (Vercel) parses the raw string as UTC
// and shifts the stored time by the admin's TZ offset.
function localInputToISO(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function CreateTournamentForm({ onCreated }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [form, setForm] = useState({
    name: '', slug: '', date: '', endDate: '', venue: '',
    poolSize: 4, poolCount: 4,
  })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      // Convert local-time inputs to proper UTC ISO before sending so the
      // server-side `new Date(...)` can't re-interpret them as UTC.
      const payload = {
        ...form,
        date: localInputToISO(form.date),
        endDate: form.endDate ? localInputToISO(form.endDate) : null,
      }
      const res = await adminPost('/api/admin/tournaments', payload)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create')
      onCreated()
      setOpen(false)
      setForm({ name: '', slug: '', date: '', endDate: '', venue: '', poolSize: 4, poolCount: 4 })
    } catch (e) {
      setErr(e.message)
    }
    setBusy(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" /> New Tournament
      </button>
    )
  }

  const inputCls =
    'w-full mt-1 px-3 py-2.5 bg-titos-elevated border border-titos-border rounded-md text-titos-white text-base md:text-sm min-h-[44px] focus:outline-none focus:border-titos-gold/50 focus:ring-2 focus:ring-titos-gold/20'

  return (
    <form onSubmit={submit} className="card-flat rounded-xl p-5 space-y-3 w-full">
      <div className="grid md:grid-cols-2 gap-3">
        <label className="block"><span className="text-xs text-titos-gray-400">Name *</span>
          <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
        </label>
        <label className="block"><span className="text-xs text-titos-gray-400">Slug (auto from name)</span>
          <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className={inputCls} />
        </label>
        <label className="block"><span className="text-xs text-titos-gray-400">Kickoff (first match) *</span>
          <input required type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} />
          <span className="mt-1 block text-[11px] text-titos-gray-500">
            Round 1 fires at this time; each subsequent round is +30 min.
          </span>
        </label>
        <label className="block"><span className="text-xs text-titos-gray-400">End (optional)</span>
          <input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className={inputCls} />
        </label>
        <label className="block md:col-span-2"><span className="text-xs text-titos-gray-400">Venue</span>
          <input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} className={inputCls} />
        </label>
        <label className="block"><span className="text-xs text-titos-gray-400">Pool Size (teams per pool)</span>
          <input type="number" inputMode="numeric" min="2" max="10" value={form.poolSize} onChange={e => setForm({ ...form, poolSize: e.target.value })} className={inputCls} />
        </label>
        <label className="block"><span className="text-xs text-titos-gray-400">Pool Count</span>
          <input type="number" inputMode="numeric" min="2" max="12" value={form.poolCount} onChange={e => setForm({ ...form, poolCount: e.target.value })} className={inputCls} />
        </label>
      </div>
      {err && <p className="text-status-live text-sm" role="alert">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary min-h-[44px]">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-titos-gray-400 hover:text-titos-white min-h-[44px]">Cancel</button>
      </div>
    </form>
  )
}

function Inner() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingSlug, setDeletingSlug] = useState(null)
  const [deleteErr, setDeleteErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminFetch('/api/admin/tournaments')
      const data = await res.json()
      setTournaments(data.tournaments || [])
    } catch {/* non-fatal */}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (t) => {
    const teamCount = t._count?.tournamentTeams || 0
    const msg = teamCount > 0
      ? `Delete "${t.name}"? This will also delete ${teamCount} team(s), all pools, matches, brackets, and scores. This cannot be undone.`
      : `Delete "${t.name}"? This cannot be undone.`
    if (!confirm(msg)) return
    setDeletingSlug(t.slug); setDeleteErr('')
    try {
      const res = await adminDelete(`/api/admin/tournaments/${t.slug}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed to delete (${res.status})`)
      }
      await load()
    } catch (e) {
      setDeleteErr(e.message)
    }
    setDeletingSlug(null)
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-titos-gray-400 hover:text-titos-gold transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-display text-2xl font-black text-titos-white">Tournaments</h1>
          </div>
          <CreateTournamentForm onCreated={load} />
        </div>

        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 text-titos-gold mx-auto animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {tournaments.map(t => (
              <div key={t.id} className="card-flat rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="font-display text-lg font-bold text-titos-white">{t.name}</h3>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="text-titos-gray-400 text-sm">
                    {formatDate(t.date)} · {t._count?.tournamentTeams || 0} teams · {t._count?.pools || 0} pools
                    {t.venue && <> · {t.venue}</>}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <Link href={`/admin/tournaments/${t.slug}`} className="btn-primary text-xs py-2">
                    Manage
                  </Link>
                  <Link href={`/tournaments/${t.slug}`} target="_blank" className="flex items-center gap-1 text-titos-gray-400 hover:text-titos-gold text-xs font-bold px-3 py-2">
                    View <ExternalLink className="w-3 h-3" />
                  </Link>
                  <button
                    onClick={() => handleDelete(t)}
                    disabled={deletingSlug === t.slug}
                    aria-label={`Delete ${t.name}`}
                    title={`Delete ${t.name}`}
                    className="inline-flex items-center justify-center rounded-md p-2 text-titos-gray-400 hover:text-status-live hover:bg-status-live/10 transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-live"
                  >
                    {deletingSlug === t.slug
                      ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      : <Trash2 className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>
            ))}
            {deleteErr && (
              <p className="text-status-live text-sm" role="alert">{deleteErr}</p>
            )}
            {tournaments.length === 0 && (
              <div className="card rounded-xl p-10 text-center">
                <Trophy className="w-10 h-10 text-titos-gray-500 mx-auto mb-3" />
                <p className="text-titos-gray-400">No tournaments yet. Create one above.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function TournamentAdminPage() {
  return <AuthGate><Inner /></AuthGate>
}
