'use client'

// Admin: add leagues, rename them, set each league's game-night rules, and
// choose which leagues appear on the public site. New leagues start hidden so
// a season can be set up before anyone sees them.

import { useCallback, useEffect, useState } from 'react'
import { Plus, Loader2, Pencil, Save, X, Eye, EyeOff } from 'lucide-react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { adminFetch } from '@/lib/adminFetch'
import { leagueRules } from '@/lib/league/seasonConfig'
import { DAYS_OF_WEEK } from '@/lib/league/leagueInput'
import { cn, slugify } from '@/lib/utils'

const field = 'w-full px-3 py-2 bg-titos-elevated border border-titos-border rounded-lg text-titos-white text-sm placeholder-titos-gray-500 focus:outline-none focus:border-titos-gold/50'

function rulesToForm(source) {
  const r = leagueRules(source)
  return {
    roundsPerWeek: String(r.roundsPerWeek),
    headToHead: !!r.headToHead,
    divisionCount: String(r.divisionCount),
    slotMode: r.slotMode,
    earlySlotLabel: r.earlySlotLabel,
    lateSlotLabel: r.lateSlotLabel,
    singleSlotLabel: r.singleSlotLabel,
    timeRangeLabel: r.timeRangeLabel,
    courts: r.courts.join(', '),
    defaultTierCount: String(r.defaultTierCount),
  }
}

function formFromLeague(league) {
  return {
    name: league?.name || '',
    slug: league?.slug || '',
    dayOfWeek: league?.dayOfWeek || '',
    registrationFee: league ? String(league.registrationFee) : '',
    maxTeams: league ? String(league.maxTeams) : '',
    description: league?.description || '',
    isActive: league ? league.isActive : false,
    ...rulesToForm(league),
  }
}

function Field({ label, hint, className, children }) {
  return (
    <label className={cn('block', className)}>
      <span className="block text-xs font-semibold text-titos-gray-300 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-titos-gray-500 mt-1">{hint}</span>}
    </label>
  )
}

function LeagueForm({ league, leagues, onSaved, onCancel }) {
  const creating = !league
  const [form, setForm] = useState(() => formFromLeague(league))
  const [slugEdited, setSlugEdited] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  // While creating, the URL name follows the league name until edited by hand.
  const setName = (name) => setForm(f => ({ ...f, name, ...(creating && !slugEdited ? { slug: slugify(name) } : {}) }))

  const copyRules = (id) => {
    const source = leagues.find(l => l.id === id)
    if (source) setForm(f => ({ ...f, ...rulesToForm(source) }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = { ...form }
    if (creating) delete payload.id
    else { delete payload.slug; payload.id = league.id }
    try {
      const res = await adminFetch('/api/admin/leagues', { method: creating ? 'POST' : 'PATCH', body: JSON.stringify(payload) })
      const data = await res.json().catch(() => ({}))
      if (res.ok) { onSaved(data.league, creating); return }
      setError(data.error || 'Could not save the league')
    } catch {
      setError('Network error')
    }
    setSaving(false)
  }

  const heading = 'text-xs font-bold uppercase tracking-wider text-titos-gold'

  return (
    <form onSubmit={submit} className="card rounded-xl p-5 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold text-titos-white">{creating ? 'Add League' : `Edit ${league.name}`}</h3>
        {creating && leagues.length > 0 && (
          <select defaultValue="" onChange={(e) => copyRules(e.target.value)} aria-label="Copy rules from an existing league" className={cn(field, 'w-auto')}>
            <option value="">Start from another league&apos;s rules…</option>
            {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        )}
      </div>

      <section className="space-y-3">
        <h4 className={heading}>Details</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="League name *">
            <input value={form.name} onChange={(e) => setName(e.target.value)} required maxLength={60} placeholder="e.g. Wednesday Women's" className={field} />
          </Field>
          <Field
            label="URL name"
            hint={creating ? `titoscourts.com/leagues/${form.slug || '…'} — can't be changed later` : 'Fixed after creation so existing links keep working'}
          >
            <input
              value={form.slug}
              disabled={!creating}
              onChange={(e) => { setSlugEdited(true); set('slug', e.target.value.toLowerCase()) }}
              maxLength={60}
              className={cn(field, !creating && 'opacity-60 cursor-not-allowed')}
            />
          </Field>
          <Field label="Day *">
            <select value={form.dayOfWeek} onChange={(e) => set('dayOfWeek', e.target.value)} required className={field}>
              <option value="">Pick a day…</option>
              {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fee ($) *">
              <input type="number" min="0" value={form.registrationFee} onChange={(e) => set('registrationFee', e.target.value)} required className={field} />
            </Field>
            <Field label="Max teams *">
              <input type="number" min="1" value={form.maxTeams} onChange={(e) => set('maxTeams', e.target.value)} required className={field} />
            </Field>
          </div>
          <Field label="Description" className="sm:col-span-2">
            <textarea rows={2} maxLength={500} value={form.description} onChange={(e) => set('description', e.target.value)} className={field} />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h4 className={heading}>Game night</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Time slots">
            <select value={form.slotMode} onChange={(e) => set('slotMode', e.target.value)} className={field}>
              <option value="two">Two slots (early + late)</option>
              <option value="single">One slot</option>
            </select>
          </Field>
          <Field label="Game night hours" hint="Shown on league cards">
            <input value={form.timeRangeLabel} onChange={(e) => set('timeRangeLabel', e.target.value)} required maxLength={40} placeholder="8 PM – 12 AM" className={field} />
          </Field>
          {form.slotMode === 'two' ? (
            <>
              <Field label="Early slot time">
                <input value={form.earlySlotLabel} onChange={(e) => set('earlySlotLabel', e.target.value)} required maxLength={40} placeholder="8 – 10 PM" className={field} />
              </Field>
              <Field label="Late slot time">
                <input value={form.lateSlotLabel} onChange={(e) => set('lateSlotLabel', e.target.value)} required maxLength={40} placeholder="10 PM – 12 AM" className={field} />
              </Field>
            </>
          ) : (
            <Field label="Slot time">
              <input value={form.singleSlotLabel} onChange={(e) => set('singleSlotLabel', e.target.value)} required maxLength={40} placeholder="9 PM – 12 AM" className={field} />
            </Field>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h4 className={heading}>Rules</h4>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Rounds per week" hint="Times each tier plays through its round-robin">
            <input type="number" min="1" max="5" value={form.roundsPerWeek} onChange={(e) => set('roundsPerWeek', e.target.value)} required className={field} />
          </Field>
          <Field label="Playoff divisions" hint="Diamond, Platinum, Gold, Silver — used for the automatic split">
            <input type="number" min="1" max="4" value={form.divisionCount} onChange={(e) => set('divisionCount', e.target.value)} required className={field} />
          </Field>
          <Field label="Tiers per new season">
            <input type="number" min="1" max="20" value={form.defaultTierCount} onChange={(e) => set('defaultTierCount', e.target.value)} required className={field} />
          </Field>
          <Field label="Courts for new tiers" hint="In order, separated by commas" className="sm:col-span-2">
            <input value={form.courts} onChange={(e) => set('courts', e.target.value)} required placeholder="6, 8, 9, 10" className={field} />
          </Field>
          <label className="flex items-start gap-2 text-sm text-titos-gray-300 sm:pt-5">
            <input type="checkbox" checked={form.headToHead} onChange={(e) => set('headToHead', e.target.checked)} className="mt-1" />
            <span>
              Head-to-head breaks ties
              <span className="block text-[11px] text-titos-gray-500">Checked before overall point difference</span>
            </span>
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-titos-border/50">
        <label className="flex items-center gap-2 text-sm text-titos-gray-300">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
          Visible on the public site
        </label>
        {error && <p role="alert" className="text-status-live text-sm">{error}</p>}
        <div className="flex gap-2 ml-auto">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-titos-gray-400 hover:text-titos-white text-sm flex items-center gap-1">
            <X className="w-4 h-4" /> Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {creating ? 'Create League' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}

export default function LeaguesAdminPage() {
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editingId, setEditingId] = useState(null) // a league id, 'new', or null
  const [togglingId, setTogglingId] = useState(null)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/leagues')
      const data = await res.json()
      if (!res.ok) setLoadError(data.error || 'Failed to load leagues')
      else { setLeagues(data.leagues || []); setLoadError('') }
    } catch {
      setLoadError('Network error')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const onSaved = async (league, created) => {
    setEditingId(null)
    if (!created) setMessage(`Saved "${league.name}"`)
    else setMessage(league.isActive ? `Created "${league.name}" — it's live on the site.` : `Created "${league.name}" — hidden until you make it visible.`)
    await load()
  }

  const toggleVisible = async (league) => {
    const visible = !league.isActive
    if (!visible && !confirm(`Hide ${league.name}? It disappears from the public site (menu, standings, schedule, registration). Its seasons and scores are kept.`)) return
    setTogglingId(league.id)
    try {
      const res = await adminFetch('/api/admin/leagues', { method: 'PATCH', body: JSON.stringify({ id: league.id, isActive: visible }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) setMessage(data.error || 'Could not update the league')
      else { setMessage(visible ? `${league.name} is now visible on the site` : `${league.name} is now hidden`); await load() }
    } catch {
      setMessage('Network error')
    }
    setTogglingId(null)
  }

  return (
    <div>
      <div className="max-w-5xl">
        <AdminPageHeader title="Leagues" description="Add leagues, rename them, set each league's game-night rules, and choose which ones appear on the site.">
          <button onClick={() => setEditingId(editingId === 'new' ? null : 'new')} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> Add League
          </button>
        </AdminPageHeader>

        {message && (
          <div className="fixed top-20 right-6 z-40 max-w-sm p-3 rounded-lg bg-titos-gold/15 border border-titos-gold/40 backdrop-blur-md shadow-lg text-titos-gold text-sm font-medium flex items-center justify-between gap-3">
            <span className="flex-1">{message}</span>
            <button onClick={() => setMessage('')} aria-label="Dismiss" className="text-titos-gold/60 hover:text-titos-gold flex-shrink-0"><X className="w-4 h-4" /></button>
          </div>
        )}

        {editingId === 'new' && (
          <div className="mb-6">
            <LeagueForm leagues={leagues} onSaved={onSaved} onCancel={() => setEditingId(null)} />
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="card rounded-xl h-24 animate-pulse" />)}
          </div>
        ) : loadError ? (
          <p role="alert" className="text-status-live text-sm">{loadError}</p>
        ) : leagues.length === 0 ? (
          <p className="text-titos-gray-500 text-sm">No leagues yet. Add one above.</p>
        ) : (
          <div className="space-y-3">
            {leagues.map(league => (editingId === league.id ? (
              <LeagueForm key={league.id} league={league} leagues={leagues} onSaved={onSaved} onCancel={() => setEditingId(null)} />
            ) : (
              <div key={league.id} className="card rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-titos-white">{league.name}</h3>
                    <span className={cn('px-2 py-0.5 rounded text-[11px] font-bold uppercase',
                      league.isActive ? 'bg-status-success/15 text-status-success' : 'bg-titos-gray-400/15 text-titos-gray-400')}>
                      {league.isActive ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                  <p className="text-titos-gray-400 text-sm mt-1">
                    {league.dayOfWeek}s · {league.timeRangeLabel} · ${league.registrationFee} · {league._count?.seasons || 0} season{league._count?.seasons === 1 ? '' : 's'}
                  </p>
                  <p className="text-titos-gray-500 text-xs mt-0.5">
                    /leagues/{league.slug} · {league.roundsPerWeek} round{league.roundsPerWeek === 1 ? '' : 's'} per week · {league.slotMode === 'single' ? 'one time slot' : 'early + late slots'} · {league.divisionCount} playoff division{league.divisionCount === 1 ? '' : 's'}{league.headToHead ? ' · head-to-head tiebreak' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleVisible(league)} disabled={togglingId === league.id}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-titos-card text-titos-gray-300 border border-titos-border hover:text-titos-white transition-colors flex items-center gap-1.5">
                    {togglingId === league.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : league.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {league.isActive ? 'Hide' : 'Show on site'}
                  </button>
                  <button onClick={() => setEditingId(league.id)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-titos-gold/15 text-titos-gold border border-titos-gold/30 hover:bg-titos-gold/25 transition-colors flex items-center gap-1.5">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              </div>
            )))}
          </div>
        )}
      </div>
    </div>
  )
}
