'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Trophy, Plus, Loader2, ExternalLink, Trash2 } from 'lucide-react'
import { adminFetch, adminPost, adminDelete } from '@/lib/adminFetch'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
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
    name: '', date: '', endDate: '', venue: '',
    poolSize: 4, poolCount: 4, courtCount: 4,
  })
  const [image, setImage] = useState(null) // { dataUrl, type, name }
  const [imgErr, setImgErr] = useState('')

  // Downscale the chosen poster in the browser (max 1600px, JPEG q0.85) so
  // uploads stay small enough to store in-DB without any blob-store setup.
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    setImgErr('')
    if (!file) { setImage(null); return }
    if (!file.type.startsWith('image/')) { setImgErr('Pick an image file'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1600
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        if (dataUrl.length > 2.6 * 1024 * 1024) { setImgErr('Image still too large — try a smaller one'); return }
        setImage({ dataUrl, type: 'image/jpeg', name: file.name })
      }
      img.onerror = () => setImgErr('Could not read that image')
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  const applyPreset = (preset) => setForm(f => ({ ...f, ...preset }))

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
        imageBase64: image?.dataUrl || null,
        imageType: image?.type || null,
      }
      const res = await adminPost('/api/admin/tournaments', payload)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create')
      onCreated()
      setOpen(false)
      setForm({ name: '', date: '', endDate: '', venue: '', poolSize: 4, poolCount: 4, courtCount: 4 })
      setImage(null)
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
      {/* Format presets — one click fills pools/courts */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Beach · 12 teams · 3 pools of 4 · 4 courts', preset: { poolCount: 3, poolSize: 4, courtCount: 4 } },
          { label: 'Classic · 16 teams · 4 pools of 4 · 4 courts', preset: { poolCount: 4, poolSize: 4, courtCount: 4 } },
          { label: 'Crossover · 2 pools · 4 courts', preset: { poolCount: 2, poolSize: 6, courtCount: 4 } },
        ].map(p => (
          <button key={p.label} type="button" onClick={() => applyPreset(p.preset)}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-titos-elevated text-titos-gray-300 border border-titos-border hover:text-titos-gold hover:border-titos-gold/40 transition-colors">
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <label className="block"><span className="text-xs text-titos-gray-400">Name * <span className="text-titos-gray-500">(URL is auto-generated)</span></span>
          <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
        </label>
        <label className="block"><span className="text-xs text-titos-gray-400">Poster image (optional)</span>
          <input type="file" accept="image/*" onChange={handleImageChange}
            className="w-full mt-1 text-sm text-titos-gray-300 file:mr-3 file:px-3 file:py-2 file:rounded-md file:border-0 file:bg-titos-gold/15 file:text-titos-gold file:text-xs file:font-bold file:cursor-pointer bg-titos-elevated border border-titos-border rounded-md min-h-[44px] py-1.5 px-2" />
          {image && (
            <span className="mt-2 flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.dataUrl} alt="Poster preview" className="h-12 w-20 object-cover rounded border border-titos-border" />
              <span className="text-[11px] text-status-success font-semibold">{image.name} ready</span>
            </span>
          )}
          {imgErr && <span className="mt-1 block text-[11px] text-status-live">{imgErr}</span>}
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
        <label className="block"><span className="text-xs text-titos-gray-400">Courts available</span>
          <input type="number" inputMode="numeric" min="1" max="12" value={form.courtCount} onChange={e => setForm({ ...form, courtCount: e.target.value })} className={inputCls} />
          <span className="mt-1 block text-[11px] text-titos-gray-500">How many courts you have booked for the day.</span>
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
    <div>
      <div className="max-w-5xl">
        <AdminPageHeader title="Tournaments" description="Create tournaments, manage pools, brackets, and scores." />
        <div className="mb-6">
          <CreateTournamentForm onCreated={load} />
        </div>

        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 text-titos-gold mx-auto animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {tournaments.map(t => (
              <div key={t.id} className="card-flat rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 flex items-center gap-4 min-w-0">
                  {t.imageType && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/tournaments/${t.slug}/image`} alt="" className="hidden sm:block h-14 w-24 object-cover rounded-lg border border-titos-border flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-display text-lg font-bold text-titos-white">{t.name}</h3>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="text-titos-gray-400 text-sm">
                      {formatDate(t.date)} · {t._count?.tournamentTeams || 0} teams · {t._count?.pools || 0} pools
                      {t.courtCount && <> · {t.courtCount} courts</>}
                      {t.venue && <> · {t.venue}</>}
                    </p>
                  </div>
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
  // Auth is handled by the admin layout's shell gate
  return <Inner />
}
